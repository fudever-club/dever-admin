"use client";

import { Form, Input, Typography, Upload, message } from "antd";
import _ from "lodash";
import { UploadOutlined } from "@ant-design/icons";
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

interface DataType {
  key: string;
  _id: string;
  name: string;
  constant: string;
}

function CreateProject() {
  const params = useParams();
  const router = useRouter();

  const [myForm] = useForm();

  const [imageUrl, setImageUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const [createProject, { isLoading }] = useCreateProjectMutation();

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
      await createProject({
        ...values,
        image: imageUrl,
      }).unwrap();
      message.success("Tạo bài viết thành công!");
      router.push("/project-management");
    } catch (error) {
      message.error("Có lỗi xảy ra");
    }
  };

  return (
    <S.PageWrapper>
      <S.Head>
        <Typography.Title level={2}>Tạo bài viết</Typography.Title>
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
              action="https://api.imgbb.com/1/upload?expiration=600&key=d0adfbcb1f973887c165948d50681492"
              headers={{
                authorization: "authorization-text",
              }}
              customRequest={handleUpload}
              multiple={false}
            >
              <Button icon={<UploadOutlined />}>Click to Upload</Button>
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
          <Button
            type="primary"
            htmlType="submit"
            $width="100%"
            loading={isLoading}
          >
            Tạo bài viết
          </Button>
        </Form.Item>
      </Form>
    </S.PageWrapper>
  );
}

export default CreateProject;
