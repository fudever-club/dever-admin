"use client";

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
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import _ from "lodash";
import { useState } from "react";

import { useTranslation } from "@/app/i18n/client";
import {
  useCreateDepartmentMutation,
  useDeleteDepartmentMutation,
  useEditDepartmentMutation,
  useGetAllDepartmentsQuery,
} from "@/store/queries/departmentMangement";
import useModal from "@/hooks/useModal";

import Button from "@/components/core/common/Button";

import * as S from "./styles";

interface DataType {
  key: string;
  _id: string;
  name: string;
  constant: string;
}

function DepartmentManagementModule() {
  const params = useParams();

  const [addForm] = Form.useForm();
  const [editForm] = Form.useForm();

  const addModal = useModal();
  const editModal = useModal();

  const { t } = useTranslation(
    params?.locale as string,
    "departmentManagement"
  );

  const [departmentId, setDepartmentID] = useState<string>("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [deleteDepartment] = useDeleteDepartmentMutation();
  const [createDepartment] = useCreateDepartmentMutation();
  const [editDepartment] = useEditDepartmentMutation();
  const { data: deptData, isFetching, refetch } = useGetAllDepartmentsQuery(undefined);
  const result = deptData?.data ?? [];

  const handleDelete = async (id: string) => {
    if (!id || deletingId) return;
    setDeletingId(id);
    try {
      await deleteDepartment(id).unwrap();
      message.success("Xóa ban chuyên môn thành công");
      refetch?.();
    } catch (error: any) {
      // 409 = still referenced by members — keep the message visible longer.
      message.error(error?.data?.message || "Xóa ban thất bại", error?.status === 409 ? 6 : 3);
    } finally {
      setDeletingId(null);
    }
  };

  const handleAdd = async (values: any) => {
    try {
      await createDepartment(values).unwrap();
      message.success("Thêm ban chuyên môn thành công");
      addForm.resetFields();
      refetch?.();
      addModal.closeModal();
    } catch (error: any) {
      message.error(error?.data?.message || "Thêm ban thất bại");
    }
  };

  const handleEdit = async (values: any) => {
    try {
      await editDepartment({
        params: { id: departmentId },
        body: values,
      }).unwrap();
      message.success("Cập nhật ban chuyên môn thành công");
      refetch?.();
      editModal.closeModal();
    } catch (error: any) {
      message.error(error?.data?.message || "Sửa ban thất bại");
    }
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
      title: t("value"),
      dataIndex: "constant",
      key: "constant",
      width: 200,
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
              icon={<EditOutlined />}
              onClick={() => {
                setDepartmentID(record?._id);
                editModal.openModal();
                editForm.setFieldsValue({
                  name: record?.name,
                  constant: record?.constant,
                });
              }}
            />
            <Popconfirm
              title={t("deleteDepartment.title")}
              description={t("deleteDepartment.description")}
              okText={t("deleteDepartment.okText")}
              cancelText={t("deleteDepartment.cancelText")}
              okButtonProps={{ danger: true, loading: deletingId === record?._id }}
              onConfirm={() => handleDelete(record?._id)}
            >
              <Button
                type="primary"
                shape="circle"
                danger
                icon={<DeleteOutlined />}
                loading={deletingId === record?._id}
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
        <Typography.Title level={2}>{t("title")}</Typography.Title>
      </S.Head>
      <S.FilterWrapper>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={addModal.openModal}
        >
          {t("addDepartment.title")}
        </Button>
      </S.FilterWrapper>
      <S.TableWrapper>
        <Table
          columns={columns}
          dataSource={result}
          loading={isFetching}
          rowKey={(record) => record._id}
          scroll={{ x: 750 }}
        />
      </S.TableWrapper>
      <Modal
        open={addModal.visible}
        onCancel={() => {
          addForm.resetFields();
          addModal.closeModal();
        }}
        footer={[]}
        title={t("addDepartment.title")}
        width="min(520px, 95vw)"
        centered
      >
        <Form
          form={addForm}
          name="addDepartmentForm"
          onFinish={handleAdd}
          autoComplete="off"
          layout="vertical"
        >
          <Form.Item
            label={t("addDepartment.name")}
            name="name"
            rules={[
              { required: true, message: t("validation.nameRequired") },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label={t("addDepartment.value")}
            name="constant"
            rules={[{ required: true, message: t("validation.constantRequired") }]}
          >
            <Input />
          </Form.Item>
          <Button type="primary" htmlType="submit" $width="100%" style={{ minHeight: 44 }}>
            {t("addDepartment.add")}
          </Button>
        </Form>
      </Modal>
      <Modal
        open={editModal.visible}
        onCancel={editModal.closeModal}
        footer={[]}
        title={t("editDepartment.title")}
        width="min(520px, 95vw)"
        centered
      >
        <Form
          name="basic"
          onFinish={handleEdit}
          autoComplete="off"
          layout="vertical"
          form={editForm}
        >
          <Form.Item
            label={t("editDepartment.name")}
            name="name"
            rules={[
              { required: true, message: t("validation.nameRequired") },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label={t("editDepartment.value")}
            name="constant"
            rules={[{ required: true, message: t("validation.constantRequired") }]}
          >
            <Input />
          </Form.Item>
          <Button type="primary" htmlType="submit" $width="100%" style={{ minHeight: 44 }}>
            {t("editDepartment.edit")}
          </Button>
        </Form>
      </Modal>
    </S.PageWrapper>
  );
}

export default DepartmentManagementModule;
