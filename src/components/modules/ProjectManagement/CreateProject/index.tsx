"use client";

import { Form, Input, Typography, Upload, message } from "antd";
import _ from "lodash";
import { UploadOutlined, LinkOutlined } from "@ant-design/icons";
import axios from "axios";
import { useRouter } from "next-nprogress-bar";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useForm } from "antd/es/form/Form";

import {
  useCreateProjectMutation,
  useGetProjectByIdQuery,
} from "@/store/queries/projectMangement";

import CustomEditor from "@/components/core/common/CustomEditor";
import Button from "@/components/core/common/Button";

import * as S from "./styles";

export function formatImageUrl(url: string): string {
  if (!url) return "/images/dever_blog_hero.png";
  if (url.includes("drive.google.com")) {
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://lh3.googleusercontent.com/d/${match[1]}`;
    }
  }
  return url;
}

function CreateProject() {
  const params = useParams();
  const router = useRouter();

  const [myForm] = useForm();

  const [imageUrl, setImageUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const [createProject, { isLoading }] = useCreateProjectMutation();

  const { result } = useGetProjectByIdQuery(
    params?.slug as string,
    {
      selectFromResult: ({ data }) => ({
        result: data?.data ?? [],
      }),
      skip: !params?.slug,
    }
  );

  const handleUpload = async ({ onSuccess, onError, file }: any) => {
    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Url = e.target?.result as string;
      setImageUrl(base64Url);
      setIsUploading(false);
      if (onSuccess) onSuccess("Ok");
      message.success("Tải ảnh dự án từ máy tính thành công!");
    };
    reader.onerror = (err) => {
      if (onError) onError({ err });
      setIsUploading(false);
      message.error("Lỗi khi đọc file ảnh!");
    };
    reader.readAsDataURL(file);
  };

  const handleChangeEditor = (value: string) => {
    myForm.setFieldsValue({ description: value });
  };

  useEffect(() => {
    if (result) {
      myForm.setFieldsValue({
        title: result?.title,
        subTitle: result?.subTitle,
        description: result?.description,
      });
      if (result?.image) setImageUrl(result?.image);
    }
  }, [myForm, result]);

  const handleSubmitForm = async (values: any) => {
    const finalImage = formatImageUrl(imageUrl || values.imageInput || "/images/dever_blog_hero.png");

    try {
      await createProject({
        ...values,
        image: finalImage,
      }).unwrap();
      message.success("Tạo dự án thành công!");
      router.push("/project-management");
    } catch (error) {
      message.error("Có lỗi xảy ra khi tạo dự án!");
    }
  };

  return (
    <S.PageWrapper>
      <S.Head>
        <Typography.Title level={2}>Tạo bài viết Dự án</Typography.Title>
      </S.Head>
      <Form layout="vertical" form={myForm} onFinish={handleSubmitForm}>
        <Form.Item label="Tên dự án" name={"title"} rules={[{ required: true, message: "Vui lòng nhập tên dự án" }]}>
          <Input placeholder="Nhập tên dự án..." />
        </Form.Item>
        <Form.Item label="Tiêu đề phụ (Mô tả tóm tắt)" name={"subTitle"} rules={[{ required: true, message: "Nhập tiêu đề phụ" }]}>
          <Input placeholder="Nhập tiêu đề phụ..." />
        </Form.Item>
        
        <Form.Item label="Ảnh bìa Dự án (Tải từ máy tính HOẶC dán Link Drive/Image URL)">
          <Input
            prefix={<LinkOutlined style={{ color: "#0066CC" }} />}
            placeholder="Dán URL link ảnh (Google Drive, ImgBB, Unsplash...)"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            style={{ marginBottom: 12 }}
          />

          <S.UploadWrap>
            <Upload.Dragger
              name="file"
              customRequest={handleUpload}
              multiple={false}
              showUploadList={false}
            >
              <Button icon={<UploadOutlined />}>Tải Ảnh Từ Máy Tính 📁</Button>
            </Upload.Dragger>
          </S.UploadWrap>
        </Form.Item>

        {imageUrl && (
          <div style={{ marginBottom: 16, borderRadius: 12, overflow: "hidden", border: "1px solid #d9d9d9", maxHeight: 240, textAlign: "center" }}>
            <img src={formatImageUrl(imageUrl)} alt="Preview" style={{ width: "100%", objectFit: "cover" }} />
          </div>
        )}

        <Form.Item label="Mô tả chi tiết" name={"description"}>
          <CustomEditor
            data={result?.description}
            getData={handleChangeEditor}
          />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            $width="100%"
            loading={isLoading}
            style={{ background: "#0066CC" }}
          >
            Tạo bài viết Dự án 🚀
          </Button>
        </Form.Item>
      </Form>
    </S.PageWrapper>
  );
}

export default CreateProject;
