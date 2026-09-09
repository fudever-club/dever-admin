"use client";

import {
  Flex,
  Form,
  Input,
  Popconfirm,
  Table,
  TableProps,
  Typography,
  Upload,
  message,
} from "antd";
import _ from "lodash";
import {
  useDeleteProjectMutation,
  useEditProjectMutation,
  useGetAllProjectsQuery,
  useGetProjectByIdQuery,
} from "@/store/queries/projectMangement";
import { UploadOutlined } from "@ant-design/icons";
import * as S from "./styles";
import { useParams } from "next/navigation";
import CustomEditor from "@/components/core/common/CustomEditor";
import { useForm } from "antd/es/form/Form";
import { useEffect, useState } from "react";
import axios from "axios";
import Image from "next/image";
import Button from "@/components/core/common/Button";
import { compressImage } from "@/utils/imageCompressor";
import webStorageClient from "@/utils/webStorageClient";
import { constants } from "@/settings";

interface DataType {
  key: string;
  _id: string;
  name: string;
  constant: string;
}

function ViewDetailProject() {
  const params = useParams();

  const [myForm] = useForm();

  const [imageUrl, setImageUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const [editProject] = useEditProjectMutation();

  const { result, isFetching, refetch } = useGetProjectByIdQuery(
    params?.slug as string,
    {
      selectFromResult: ({ data, isFetching }) => {
        return {
          result: data?.data ?? [],
          isFetching,
        };
      },
      skip: !params?.slug,
    }
  );
  const handleUpload = async ({
    onSuccess,
    onError,
    file,
    onProgress,
  }: any) => {
    setIsUploading(true);
    try {
      const compressedFile = await compressImage(file, {
        maxSizeMB: 1.0,
        maxWidthOrHeight: 1920,
        quality: 0.82,
      });

      const token = webStorageClient.getToken();
      const fmData = new FormData();
      fmData.append("file", compressedFile);
      fmData.append("folder", "projects");

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
      message.success("Cập nhật ảnh dự án lên Cloudflare R2 thành công!");
    } catch (err: any) {
      console.error("Project image edit upload error:", err);
      setIsUploading(false);
      onError({ err });
      message.error(err?.response?.data?.message || err?.message || "Lỗi khi tải ảnh lên máy chủ!");
    }
  };

  const handleChangeEditor = (value: string) => {
    myForm.setFieldsValue({ description: value });
  };

  useEffect(() => {
    myForm.setFieldsValue({
      title: result?.title,
      subTitle: result?.subTitle,
      description: result?.description,
    });
    setImageUrl(result?.image);
  }, [
    myForm,
    result?.description,
    result?.image,
    result?.subTitle,
    result?.title,
  ]);

  const handleSubmitForm = async (values: any) => {
    console.log({
      ...values,
      image: imageUrl,
    });

    try {
      await editProject({
        params: { id: result?._id },
        body: {
          ...values,
          image: imageUrl,
        },
      }).unwrap();
      message.success("Sửa thông tin bài viết thành công");
    } catch (error) {
      message.error("Có lỗi xảy ra");
    }
  };

  return (
    <S.PageWrapper>
      <S.Head>
        <Typography.Title level={2}>Chỉnh sửa thông tin dự án</Typography.Title>
      </S.Head>
      <Form layout="vertical" form={myForm} onFinish={handleSubmitForm}>
        <Form.Item label="Tên dự án" name={"title"}>
          <Input placeholder="Nhập tên dự án" />
        </Form.Item>
        <Form.Item label="Tiêu đề phụ" name={"subTitle"}>
          <Input placeholder="Nhập tiêu đề phụ" />
        </Form.Item>
        <Form.Item label="Ảnh bìa">
          <S.UploadWrap>
            <Upload.Dragger
              name="file"
              customRequest={handleUpload}
              multiple={false}
              showUploadList={false}
            >
              <Button icon={<UploadOutlined />}>Tải Ảnh Dự Án (Cloudflare R2)</Button>
            </Upload.Dragger>
          </S.UploadWrap>
        </Form.Item>
        {imageUrl && (
          <S.ImageWrapper src={imageUrl} alt="" width={600} height={600} />
        )}
        <Form.Item label="Mô tả" name={"description"}>
          <CustomEditor
            data={result?.description}
            getData={handleChangeEditor}
          />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" $width="100%">
            Lưu
          </Button>
        </Form.Item>
      </Form>
    </S.PageWrapper>
  );
}

export default ViewDetailProject;
