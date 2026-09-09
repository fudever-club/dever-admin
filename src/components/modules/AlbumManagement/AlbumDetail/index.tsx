"use client";

import { useEffect, useState } from "react";
import { Col, Flex, Image, Row, Typography, Upload, message, Space } from "antd";
import { useParams } from "next/navigation";
import { PlusOutlined, UploadOutlined } from "@ant-design/icons";
import _ from "lodash";
import axios from "axios";

import {
  useGetAlbumDetailQuery,
  useUploadImageForAlbumMutation,
} from "@/store/queries/albumManagement";

import Button from "@/components/core/common/Button";
import { compressImage } from "@/utils/imageCompressor";
import webStorageClient from "@/utils/webStorageClient";
import { constants } from "@/settings";

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
    setIsUploading(true);
    try {
      const compressedFile = await compressImage(file, {
        maxSizeMB: 1.2,
        maxWidthOrHeight: 1920,
        quality: 0.82,
      });

      const token = webStorageClient.getToken();
      const fmData = new FormData();
      fmData.append("file", compressedFile);
      fmData.append("folder", "albums");

      const res = await axios.post(`${constants.API_SERVER}/api/v1/upload/image`, fmData, {
        headers: {
          "Content-Type": "multipart/form-data",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        onUploadProgress: (event: any) => {
          if (event.total) {
            onProgress({ percent: (event.loaded / event.total) * 100 });
          }
        },
      });

      const uploadedUrl = res.data?.data?.url;
      if (!uploadedUrl) {
        throw new Error(res.data?.message || "Tải ảnh lên máy chủ thất bại");
      }

      onSuccess("Ok");
      setImageUrl(uploadedUrl);
      setIsUploading(false);
      message.success("Tải ảnh vào album thành công!");
    } catch (err: any) {
      console.error("Album upload error:", err);
      setIsUploading(false);
      onError({ err });
      message.error(err?.response?.data?.message || err?.message || "Lỗi khi tải ảnh vào album!");
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
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            marginBottom: "16px",
          }}
        >
          <div>
            <Typography.Title level={3} style={{ margin: 0, color: "#0066CC", fontSize: "20px", fontWeight: 700 }}>
              {result?.name || "Chi Tiết Album"}
            </Typography.Title>
            <Typography.Text type="secondary" style={{ fontSize: "13px" }}>
              {result?.description || "Bộ sưu tập hình ảnh sự kiện"} • {result?.imageList?.length || 0} ảnh
            </Typography.Text>
          </div>

          <Space wrap>
            <Upload
              name="file"
              customRequest={handleUpload}
              multiple
              fileList={fileList?.map((file) => ({
                uid: file,
                name: file,
                status: "done",
                url: file,
              }))}
            >
              <Button icon={<UploadOutlined />} style={{ borderRadius: 8 }}>
                Chọn ảnh tải lên
              </Button>
            </Upload>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
              disabled={!fileList.length}
              loading={isLoading}
              style={{
                backgroundColor: "#0066CC",
                borderRadius: 8,
                height: "34px",
                fontWeight: 600,
                fontSize: "13px",
              }}
            >
              Lưu {fileList.length > 0 ? `(${fileList.length})` : ""} ảnh vào Album
            </Button>
          </Space>
        </div>

        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            border: "1px solid #e6f4ff",
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            padding: "16px",
          }}
        >
          {(!result?.imageList || result.imageList.length === 0) ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8" }}>
              <p style={{ fontSize: "14px", fontWeight: 600 }}>Chưa có hình ảnh nào trong album này</p>
              <p style={{ fontSize: "12px" }}>Bấm &quot;Chọn ảnh tải lên&quot; ở trên để bắt đầu thêm ảnh</p>
            </div>
          ) : (
            <Row gutter={[16, 16]}>
              {result?.imageList?.map((image: any, idx: number) => (
                <Col key={image?.url || idx} xs={24} sm={12} md={8} lg={6}>
                  <div
                    style={{
                      borderRadius: "12px",
                      overflow: "hidden",
                      border: "1px solid #f1f5f9",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                      backgroundColor: "#f8fafc",
                      aspectRatio: "4/3",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Image
                      src={image?.url}
                      alt={`Album ${result?.name} - Ảnh ${idx + 1}`}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </div>
                </Col>
              ))}
            </Row>
          )}
        </div>
      </S.PageWrapper>
    </>
  );
}

export default AlbumDetailModule;
