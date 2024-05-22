"use client";

import { useEffect, useState } from "react";
import { Col, Flex, Image, Row, Typography, Upload, message } from "antd";
import { useParams } from "next/navigation";
import { PlusOutlined, UploadOutlined } from "@ant-design/icons";
import _ from "lodash";
import axios from "axios";

import {
  useGetAlbumDetailQuery,
  useUploadImageForAlbumMutation,
} from "@/store/queries/albumManagement";

import Button from "@/components/core/common/Button";

import * as S from "./styles";

interface DataType {
  key: string;
  _id: string;
  url: string;
}

function AlbumDetailModule() {
  const params = useParams();

  const [imageUrl, setImageUrl] = useState<string>("");
  const [fileList, setFileList] = useState<string[]>([]);
  const [messageApi, contextHolder] = message.useMessage();
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const [uploadImageForAlbum, { isLoading }] = useUploadImageForAlbumMutation();

  const { result, isFetching, refetch } = useGetAlbumDetailQuery(
    params?.slug as string,
    {
      selectFromResult: ({ data, isFetching }) => {
        return {
          result: data?.data,
          isFetching,
        };
      },
    }
  );

  const handleAdd = async () => {
    try {
      await uploadImageForAlbum({
        params: {
          slug: params?.slug,
        },
        body: { imageList: fileList?.map((url: any) => ({ url: url })) },
      }).unwrap();
      message.success("Thêm thành công");
      refetch();
      setFileList([]);
    } catch (error) {
      message.error("Có lỗi xảy ra");
    }
  };

  const handleUpload = async ({
    onSuccess,
    onError,
    file,
    onProgress,
  }: any) => {
    const fmData = new FormData();
    const config = {
      headers: { "content-type": "multipart/form-data" },
      onUploadProgress: (event: any) => {
        onProgress({ percent: (event.loaded / event.total) * 100 });
        setIsUploading(true);
      },
    };

    fmData.append("image", file);
    try {
      const res = await axios.post(
        "https://api.imgbb.com/1/upload?key=c9a0d416d3771b79bea983ffbb51811e",
        fmData,
        config
      );

      onSuccess("Ok");
      setImageUrl(res?.data?.data?.url);
      setIsUploading(false);
    } catch (err) {
      const error = new Error("Some error");
      onError({ error });
    }
  };

  useEffect(() => {
    if (!imageUrl) {
      return;
    }
    setFileList([...fileList, imageUrl]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageUrl]);

  useEffect(() => {
    if (!isUploading) {
      messageApi.destroy();
      return;
    }
    messageApi.open({
      type: "loading",
      content: "Wait for upload images...",
      duration: 100,
    });
  }, [isUploading, messageApi]);

  return (
    <>
      {contextHolder}
      <S.PageWrapper>
        <S.Head>
          <Typography.Title level={2}>{result?.name}</Typography.Title>
        </S.Head>
        <Flex justify="space-between" align="flex-start">
          <S.FilterWrapper>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
              disabled={!fileList.length}
              loading={isLoading}
            >
              Tải ảnh lên album
            </Button>
            <Upload
              name="file"
              action="https://api.imgbb.com/1/upload?expiration=600&key=d0adfbcb1f973887c165948d50681492"
              headers={{
                authorization: "authorization-text",
              }}
              customRequest={handleUpload}
              multiple
              fileList={fileList?.map((file) => ({
                uid: file,
                name: file,
                status: "done",
                url: file,
              }))}
            >
              <Button icon={<UploadOutlined />}>Click to pick images</Button>
            </Upload>
          </S.FilterWrapper>
        </Flex>

        <S.TableWrapper>
          {/* <Table
            columns={columns}
            dataSource={result?.imageList}
            loading={isFetching}
            pagination={false}
            rowKey={(record) => {
              return record?.url;
            }}
            rowSelection={{
              type: "checkbox",
              onChange: (selectedRowKey, selectedRows: DataType[]) => {
                setDeleteList(selectedRows.map((row) => row?.url));
              },
            }}
          /> */}
          <Row gutter={[16, 16]}>
            {result?.imageList?.map((image: any) => (
              <Col key={image?.url} span={6}>
                <Image src={image?.url} alt="" />
              </Col>
            ))}
          </Row>
        </S.TableWrapper>
      </S.PageWrapper>
    </>
  );
}

export default AlbumDetailModule;
