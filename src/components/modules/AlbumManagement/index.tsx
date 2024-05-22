"use client";

import { useState } from "react";
import {
  Flex,
  Form,
  Input,
  Modal,
  Popconfirm,
  Table,
  TableProps,
  Typography,
  message,
} from "antd";
import { useParams } from "next/navigation";
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import _ from "lodash";
import { useRouter } from "next-nprogress-bar";

import { useTranslation } from "@/app/i18n/client";
import useModal from "@/hooks/useModal";
import {
  useCreateAlbumMutation,
  useDeleteAlbumMutation,
  useEditAlbumMutation,
  useGetAllAlbumsQuery,
} from "@/store/queries/albumManagement";

import Button from "@/components/core/common/Button";

import * as S from "./styles";

interface DataType {
  key: string;
  _id: string;
  name: string;
  description: string;
  imageList: { url: string }[];
  slug: string;
}

function AlbumManagementModule() {
  const params = useParams();
  const router = useRouter();

  const [editForm] = Form.useForm();

  const addModal = useModal();
  const editModal = useModal();

  const { t } = useTranslation(params?.locale as string, "majorManagement");

  const [MajorId, setMajorID] = useState<string>("");

  const [deleteAlbum] = useDeleteAlbumMutation();
  const [createAlbum] = useCreateAlbumMutation();
  const [editAlbum] = useEditAlbumMutation();
  const { result, isFetching, refetch } = useGetAllAlbumsQuery(undefined, {
    selectFromResult: ({ data, isFetching }) => {
      return {
        result: data?.data ?? [],
        isFetching,
      };
    },
  });

  const handleDelete = async (id: string) => {
    console.log(id);

    try {
      await deleteAlbum(id).unwrap();
      message.success("Xóa thành công");
      refetch();
    } catch (error) {}
  };

  const handleAdd = async (values: any) => {
    try {
      await createAlbum(values).unwrap();
      message.success("Thêm thành công");
      refetch();
      addModal.closeModal();
    } catch (error) {}
  };

  const handleEdit = async (values: any) => {
    try {
      await editAlbum({
        params: { id: MajorId },
        body: values,
      }).unwrap();
      message.success("Sửa thành công");
      refetch();
      editModal.closeModal();
    } catch (error) {}
  };

  const columns: TableProps<DataType>["columns"] = [
    {
      title: "ID",
      dataIndex: "_id",
      key: "_id",
      width: 50,
    },
    {
      title: t("name"),
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "Số lượng ảnh",
      key: "numberImage",
      width: 200,
      render: (_, record) => record?.imageList?.length,
    },
    {
      title: t("function"),
      key: "action",
      width: 200,
      render: (_, record) => {
        return (
          <Flex justify="center" gap={20}>
            <Button
              type="default"
              shape="circle"
              icon={<EyeOutlined />}
              onClick={() => {
                router.push(`/album-management/${record?.slug}`);
              }}
            />
            <Button
              type="default"
              shape="circle"
              icon={<EditOutlined />}
              onClick={() => {
                setMajorID(record?._id);
                editModal.openModal();
                editForm.setFieldsValue({
                  name: record?.name,
                  description: record?.description,
                });
              }}
            />
            <Popconfirm
              title="Xoá album"
              description="Bạn có chắc chắn muốn xoá album này không?"
              okText="Xoá"
              cancelText="Hủy"
              onConfirm={() => handleDelete(record?.slug)}
            >
              <Button
                type="primary"
                shape="circle"
                danger
                icon={<DeleteOutlined />}
              />
            </Popconfirm>
          </Flex>
        );
      },
    },
  ];

  return (
    <S.PageWrapper>
      <S.Head>
        <Typography.Title level={2}>Quản lý Album</Typography.Title>
      </S.Head>
      <S.FilterWrapper>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={addModal.openModal}
        >
          Thêm Album
        </Button>
      </S.FilterWrapper>
      <S.TableWrapper>
        <Table
          columns={columns}
          dataSource={result}
          loading={isFetching}
          rowKey={(record) => record._id}
        />
      </S.TableWrapper>
      <Modal
        open={addModal.visible}
        onCancel={addModal.closeModal}
        footer={[]}
        title="Thêm Album"
      >
        <Form
          name="basic"
          onFinish={handleAdd}
          autoComplete="off"
          layout="vertical"
        >
          <Form.Item
            label="Tên Album"
            name="name"
            rules={[{ required: true, message: "Please input your Major!" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Mô tả"
            name="description"
            rules={[
              { required: true, message: "Please input your description!" },
            ]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>
          <Button type="primary" htmlType="submit" $width="100%">
            {t("addMajor.add")}
          </Button>
        </Form>
      </Modal>
      <Modal
        open={editModal.visible}
        onCancel={editModal.closeModal}
        footer={[]}
        title="Sửa Album"
      >
        <Form
          name="basic"
          onFinish={handleEdit}
          autoComplete="off"
          layout="vertical"
          form={editForm}
        >
          <Form.Item
            label="Tên Album"
            name="name"
            rules={[{ required: true, message: "Please input your Major!" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Mô tả"
            name="description"
            rules={[
              { required: true, message: "Please input your description!" },
            ]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>
          <Button type="primary" htmlType="submit" $width="100%">
            {t("editMajor.edit")}
          </Button>
        </Form>
      </Modal>
    </S.PageWrapper>
  );
}

export default AlbumManagementModule;
