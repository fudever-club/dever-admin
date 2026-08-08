"use client";

import { useMemo, useState } from "react";
import { Button, Form, Input, Modal, Popconfirm, Select, Space, Table, Tabs, Tag, Typography, message } from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import {
  useCreateAlumniMutation,
  useCreateProjectLabMutation,
  useDeleteAlumniMutation,
  useDeleteProjectLabMutation,
  useGetAlumniQuery,
  useGetProjectLabsQuery,
  useUpdateAlumniMutation,
  useUpdateProjectLabMutation,
} from "@/store/queries/contentManagement";

type Mode = "project" | "alumni";

const statusLabels: Record<string, string> = { open: "Đang tuyển", paused: "Tạm dừng", closed: "Đã đóng" };

export default function CommunityContentManagement() {
  const [mode, setMode] = useState<Mode>("project");
  const [editing, setEditing] = useState<any | null>(null);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const projects = useGetProjectLabsQuery();
  const alumni = useGetAlumniQuery();
  const [createProject, projectCreateState] = useCreateProjectLabMutation();
  const [updateProject, projectUpdateState] = useUpdateProjectLabMutation();
  const [deleteProject] = useDeleteProjectLabMutation();
  const [createAlumnus, alumniCreateState] = useCreateAlumniMutation();
  const [updateAlumnus, alumniUpdateState] = useUpdateAlumniMutation();
  const [deleteAlumnus] = useDeleteAlumniMutation();
  const saving = projectCreateState.isLoading || projectUpdateState.isLoading || alumniCreateState.isLoading || alumniUpdateState.isLoading;

  const rows = mode === "project" ? projects.data?.data || [] : alumni.data?.data || [];
  const refresh = () => (mode === "project" ? projects.refetch() : alumni.refetch());
  const openEditor = (record?: any) => {
    setEditing(record || null);
    form.setFieldsValue(record ? { ...record, roles: record.roles?.join(", ") } : { status: "open" });
    setOpen(true);
  };
  const save = async (values: any) => {
    const body = mode === "project" ? { ...values, roles: values.roles ? values.roles.split(",").map((role: string) => role.trim()).filter(Boolean) : [] } : values;
    try {
      if (editing) {
        await (mode === "project" ? updateProject({ id: editing._id, body }).unwrap() : updateAlumnus({ id: editing._id, body }).unwrap());
      } else {
        await (mode === "project" ? createProject(body).unwrap() : createAlumnus(body).unwrap());
      }
      message.success(editing ? "Đã cập nhật nội dung" : "Đã tạo nội dung mới");
      setOpen(false); form.resetFields(); refresh();
    } catch { message.error("Không thể lưu. Kiểm tra lại quyền admin hoặc dữ liệu nhập."); }
  };
  const remove = async (record: any) => {
    try {
      await (mode === "project" ? deleteProject(record._id).unwrap() : deleteAlumnus(record._id).unwrap());
      message.success("Đã xóa"); refresh();
    } catch { message.error("Không thể xóa nội dung"); }
  };

  const columns = useMemo(() => mode === "project" ? [
    { title: "Dự án", dataIndex: "title", render: (value: string, row: any) => <Space direction="vertical" size={0}><Typography.Text strong>{value}</Typography.Text><Typography.Text type="secondary" ellipsis={{ tooltip: row.summary }}>{row.summary}</Typography.Text></Space> },
    { title: "Nhóm", dataIndex: "category", render: (value: string) => <Tag color="blue">{value}</Tag> },
    { title: "Trạng thái", dataIndex: "status", render: (value: string) => <Tag color={value === "open" ? "green" : "default"}>{statusLabels[value] || value}</Tag> },
  ] : [
    { title: "Cựu thành viên", dataIndex: "name", render: (value: string, row: any) => <Space direction="vertical" size={0}><Typography.Text strong>{value}</Typography.Text><Typography.Text type="secondary">{row.headline}</Typography.Text></Space> },
    { title: "Thế hệ", dataIndex: "graduationGen" }, { title: "Đơn vị", dataIndex: "workplace" },
  ], [mode]);
  const actionColumn = { title: "Thao tác", render: (_: unknown, record: any) => <Space><Button type="text" icon={<EditOutlined />} onClick={() => openEditor(record)}>Sửa</Button><Popconfirm title="Xóa nội dung này?" okText="Xóa" cancelText="Hủy" onConfirm={() => remove(record)}><Button danger type="text" icon={<DeleteOutlined />}>Xóa</Button></Popconfirm></Space> };

  return <div style={{ padding: 24 }}>
    <Space direction="vertical" size={20} style={{ width: "100%" }}>
      <div><Typography.Title level={2} style={{ color: "#0066CC", marginBottom: 4 }}>Nội dung cộng đồng</Typography.Title><Typography.Text type="secondary">Quản trị Project Lab và Hall of Fame hiển thị trên landing page.</Typography.Text></div>
      <Tabs activeKey={mode} onChange={(key) => { setMode(key as Mode); setOpen(false); form.resetFields(); }} items={[{ key: "project", label: "Project Lab" }, { key: "alumni", label: "Alumni" }]} />
      <Button type="primary" icon={<PlusOutlined />} onClick={() => openEditor()} style={{ width: "fit-content" }}>Thêm {mode === "project" ? "dự án" : "cựu thành viên"}</Button>
      <Table rowKey="_id" loading={mode === "project" ? projects.isLoading : alumni.isLoading} columns={[...columns, actionColumn]} dataSource={rows} pagination={{ pageSize: 10 }} />
    </Space>
    <Modal open={open} title={editing ? "Chỉnh sửa" : "Tạo mới"} onCancel={() => setOpen(false)} footer={null} destroyOnClose>
      <Form form={form} layout="vertical" onFinish={save}>
        {mode === "project" ? <>
          <Form.Item name="title" label="Tên dự án" rules={[{ required: true }]}><Input /></Form.Item><Form.Item name="summary" label="Mô tả" rules={[{ required: true }]}><Input.TextArea rows={3} /></Form.Item><Form.Item name="category" label="Nhóm" rules={[{ required: true }]}><Input placeholder="Web, AI/ML, Mobile..." /></Form.Item><Form.Item name="roles" label="Vị trí cần tuyển"><Input placeholder="Frontend, UI/UX, Backend" /></Form.Item><Form.Item name="status" label="Trạng thái" rules={[{ required: true }]}><Select options={Object.entries(statusLabels).map(([value, label]) => ({ value, label }))} /></Form.Item><Form.Item name="contactUrl" label="Link liên hệ"><Input type="url" /></Form.Item>
        </> : <>
          <Form.Item name="name" label="Họ tên" rules={[{ required: true }]}><Input /></Form.Item><Form.Item name="headline" label="Vai trò" rules={[{ required: true }]}><Input /></Form.Item><Form.Item name="graduationGen" label="Thế hệ"><Input placeholder="Gen 3" /></Form.Item><Form.Item name="workplace" label="Đơn vị"><Input /></Form.Item><Form.Item name="avatar" label="URL ảnh đại diện"><Input type="url" /></Form.Item><Form.Item name="profileUrl" label="URL hồ sơ"><Input type="url" /></Form.Item><Form.Item name="isPublished" label="Hiển thị trên landing" initialValue><Select options={[{ value: true, label: "Hiển thị" }, { value: false, label: "Ẩn" }]} /></Form.Item>
        </>}
        <Button htmlType="submit" type="primary" loading={saving} block>Lưu nội dung</Button>
      </Form>
    </Modal>
  </div>;
}
