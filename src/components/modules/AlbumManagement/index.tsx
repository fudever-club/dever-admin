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
      title: "Tên Album",
      dataIndex: "name",
      key: "name",
      width: 220,
      render: (name: string) => (
        <Typography.Text strong style={{ fontSize: 13, wordBreak: "break-word" }}>
          {name}
        </Typography.Text>
      ),
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      render: (desc: string) => (
        <Typography.Paragraph ellipsis={{ rows: 2 }} type="secondary" style={{ fontSize: 12, margin: 0, wordBreak: "break-word" }}>
          {desc || "Chưa có mô tả"}
        </Typography.Paragraph>
      ),
    },
    {
      title: "Số lượng ảnh",
      key: "numberImage",
      width: 140,
      render: (_, record) => (
        <span style={{ fontWeight: 600, color: "#0066CC", fontSize: 12 }}>
          {record?.imageList?.length || 0} ảnh
        </span>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 150,
      render: (_, record) => {
        return (
          <Flex justify="center" gap={8}>
            <Button
              type="default"
              shape="circle"
              icon={<EyeOutlined />}
              aria-label="Xem chi tiết album"
              onClick={() => {
                router.push(`/album-management/${record?.slug}`);
              }}
            />
            <Button
              type="default"
              shape="circle"
              icon={<EditOutlined />}
              aria-label="Sửa thông tin album"
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
              okButtonProps={{ danger: true }}
              onConfirm={() => handleDelete(record?.slug)}
            >
              <Button
                type="primary"
                shape="circle"
                danger
                icon={<DeleteOutlined />}
                aria-label="Xóa album"
              />
            </Popconfirm>
          </Flex>
        );
      },
    },
  ];

  return (
    <S.PageWrapper>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          marginBottom: "16px",
        }}
      >
        <div>
          <Typography.Title level={4} style={{ margin: 0, color: "#0066CC", fontSize: "18px", fontWeight: 700 }}>
            Quản Lý Album Hình Ảnh CLB
          </Typography.Title>
          <Typography.Text type="secondary" style={{ fontSize: "13px" }}>
            Tạo và quản lý các bộ sưu tập ảnh sự kiện, workshop, hoạt động ngoại khóa của DEVER.
          </Typography.Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={addModal.openModal}
          style={{
            background: "#0066CC",
            borderRadius: "8px",
            fontWeight: 600,
            fontSize: "13px",
            height: "34px",
            padding: "0 14px",
            display: "inline-flex",
            alignItems: "center",
            boxShadow: "0 2px 4px rgba(0,102,204,0.15)",
          }}
        >
          Thêm Album Mới
        </Button>
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
        <Table
          columns={columns}
          dataSource={result}
          loading={isFetching}
          rowKey={(record) => record._id}
          scroll={{ x: 750 }}
          pagination={{ pageSize: 8 }}
        />
      </div>

      {/* Modal Add Album */}
      <Modal
        open={addModal.visible}
        onCancel={addModal.closeModal}
        footer={null}
        title="Thêm Album Ảnh Mới"
        width="min(520px, 95vw)"
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
            rules={[{ required: true, message: "Vui lòng nhập tên album!" }]}
          >
            <Input placeholder="Ví dụ: Workshop AI & Web Fullstack 2026..." />
          </Form.Item>

          <Form.Item
            label="Mô tả tóm tắt"
            name="description"
            rules={[{ required: true, message: "Vui lòng nhập mô tả tóm tắt!" }]}
          >
            <Input.TextArea rows={3} placeholder="Mô tả sự kiện, địa điểm và các kỷ niệm nổi bật..." />
          </Form.Item>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
            <Button onClick={addModal.closeModal}>Hủy</Button>
            <Button type="primary" htmlType="submit" style={{ background: "#0066CC" }}>
              Tạo Album
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Modal Edit Album */}
      <Modal
        open={editModal.visible}
        onCancel={editModal.closeModal}
        footer={null}
        title="Chỉnh Sửa Album"
        width="min(520px, 95vw)"
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
            rules={[{ required: true, message: "Vui lòng nhập tên album!" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Mô tả"
            name="description"
            rules={[{ required: true, message: "Vui lòng nhập mô tả!" }]}
          >
            <Input.TextArea rows={3} />
          </Form.Item>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
            <Button onClick={editModal.closeModal}>Hủy</Button>
            <Button type="primary" htmlType="submit" style={{ background: "#0066CC" }}>
              Lưu Thay Đổi
            </Button>
          </div>
        </Form>
      </Modal>
    </S.PageWrapper>
  );
}

export default AlbumManagementModule;
