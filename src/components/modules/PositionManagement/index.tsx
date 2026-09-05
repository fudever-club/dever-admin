"use client";

import {
  Flex,
  Form,
  Input,
  Modal,
  Popconfirm,
  Table,
  TableProps,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd";
import { useParams } from "next/navigation";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import _ from "lodash";
import { useState } from "react";

import { useTranslation } from "@/app/i18n/client";
import useModal from "@/hooks/useModal";
import {
  useCreatePositionMutation,
  useDeletePositionMutation,
  useEditPositionMutation,
  useGetAllPositionQuery,
} from "@/store/queries/positionManagement";

import Button from "@/components/core/common/Button";

import * as S from "./styles";

interface DataType {
  key: string;
  _id: string;
  name: string;
  constant: string;
}

const PROTECTED_CONSTANTS = new Set(["CHUNHIEM", "PHOCHUNHIEM", "MEMBER"]);

function PositionManagementModule() {
  const params = useParams();

  const [addForm] = Form.useForm();
  const [editForm] = Form.useForm();

  const addModal = useModal();
  const editModal = useModal();

  const { t } = useTranslation(params?.locale as string, "positionManagement");

  const [PositionId, setPositionID] = useState<string>("");

  const [deletePosition] = useDeletePositionMutation();
  const [createPosition] = useCreatePositionMutation();
  const [editPosition] = useEditPositionMutation();
  const { data: positionData, isFetching, refetch } = useGetAllPositionQuery(undefined);
  const result = positionData?.data ?? [];

  const handleDelete = async (id: string) => {
    try {
      await deletePosition(id).unwrap();
      message.success("Xóa chức vụ thành công");
      refetch?.();
    } catch (error: any) {
      message.error(error?.data?.message || "Xóa chức vụ thất bại");
    }
  };

  const handleAdd = async (values: any) => {
    try {
      await createPosition(values).unwrap();
      message.success("Thêm chức vụ thành công");
      addForm.resetFields();
      refetch?.();
      addModal.closeModal();
    } catch (error: any) {
      message.error(error?.data?.message || "Thêm chức vụ thất bại");
    }
  };

  const handleEdit = async (values: any) => {
    try {
      await editPosition({
        params: { id: PositionId },
        body: values,
      }).unwrap();
      message.success("Cập nhật chức vụ thành công");
      refetch?.();
      editModal.closeModal();
    } catch (error: any) {
      message.error(error?.data?.message || "Sửa chức vụ thất bại");
    }
  };

  const columns: TableProps<DataType>["columns"] = [
    {
      title: "STT",
      key: "stt",
      width: 60,
      render: (_, __, index) => index + 1,
    },
    {
      title: t("name"),
      dataIndex: "name",
      key: "name",
      render: (name, record) => (
        <Flex align="center" gap={8}>
          <span style={{ fontWeight: 500 }}>{name}</span>
          {PROTECTED_CONSTANTS.has(record.constant) && (
            <Tag color="geekblue">Cốt lõi</Tag>
          )}
        </Flex>
      ),
    },
    {
      title: t("value"),
      dataIndex: "constant",
      key: "constant",
      width: 220,
      render: (constant) => <Tag color="default">{constant}</Tag>,
    },
    {
      title: t("function"),
      key: "action",
      width: 160,
      render: (_, record) => {
        const isProtected = PROTECTED_CONSTANTS.has(record?.constant);
        return (
          <Flex justify="center" gap={12}>
            <Button
              type="default"
              shape="circle"
              icon={<EditOutlined />}
              onClick={() => {
                setPositionID(record?._id);
                editModal.openModal();
                editForm.setFieldsValue({
                  name: record?.name,
                  constant: record?.constant,
                });
              }}
            />
            {isProtected ? (
              <Tooltip title="Chức vụ hệ thống không thể xóa">
                <Button
                  type="primary"
                  shape="circle"
                  danger
                  disabled
                  icon={<DeleteOutlined />}
                />
              </Tooltip>
            ) : (
              <Popconfirm
                title={t("deletePosition.title")}
                description={t("deletePosition.description")}
                okText={t("deletePosition.okText")}
                cancelText={t("deletePosition.cancelText")}
                onConfirm={() => handleDelete(record?._id)}
              >
                <Button
                  type="primary"
                  shape="circle"
                  danger
                  icon={<DeleteOutlined />}
                />
              </Popconfirm>
            )}
          </Flex>
        );
      },
    },
  ];

  return (
    <S.PageWrapper>
      <S.Head>
        <Typography.Title level={2}>{t("title")}</Typography.Title>
      </S.Head>
      <S.FilterWrapper>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            addForm.resetFields();
            addModal.openModal();
          }}
        >
          {t("addPosition.title")}
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
        onCancel={() => {
          addForm.resetFields();
          addModal.closeModal();
        }}
        footer={[]}
        title={t("addPosition.title")}
      >
        <Form
          form={addForm}
          name="addPositionForm"
          onFinish={handleAdd}
          autoComplete="off"
          layout="vertical"
        >
          <Form.Item
            label={t("addPosition.name")}
            name="name"
            rules={[{ required: true, message: "Vui lòng nhập tên chức vụ!" }]}
          >
            <Input placeholder="Ví dụ: Trưởng Ban Kỹ Thuật" />
          </Form.Item>

          <Form.Item
            label={t("addPosition.value")}
            name="constant"
            rules={[{ required: true, message: "Vui lòng nhập mã định danh constant!" }]}
          >
            <Input placeholder="Ví dụ: TRUONGBANKYTHUAT" />
          </Form.Item>
          <Button type="primary" htmlType="submit" $width="100%">
            {t("addPosition.add")}
          </Button>
        </Form>
      </Modal>
      <Modal
        open={editModal.visible}
        onCancel={editModal.closeModal}
        footer={[]}
        title={t("editPosition.title")}
      >
        <Form
          name="editPositionForm"
          onFinish={handleEdit}
          autoComplete="off"
          layout="vertical"
          form={editForm}
        >
          <Form.Item
            label={t("editPosition.name")}
            name="name"
            rules={[{ required: true, message: "Vui lòng nhập tên chức vụ!" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label={t("editPosition.value")}
            name="constant"
            rules={[{ required: true, message: "Vui lòng nhập mã constant!" }]}
          >
            <Input disabled={PROTECTED_CONSTANTS.has(editForm.getFieldValue("constant"))} />
          </Form.Item>
          <Button type="primary" htmlType="submit" $width="100%">
            {t("editPosition.edit")}
          </Button>
        </Form>
      </Modal>
    </S.PageWrapper>
  );
}

export default PositionManagementModule;
