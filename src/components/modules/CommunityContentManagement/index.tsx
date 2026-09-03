"use client";

import { useMemo, useState } from "react";
import {
  App,
  AutoComplete,
  Avatar,
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Radio,
  Row,
  Select,
  Space,
  Switch,
  Table,
  Tabs,
  Tag,
  Typography,
} from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  GithubOutlined,
  StarFilled,
  LinkOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  LinkedinOutlined,
  SearchOutlined,
  UserOutlined,
  UsergroupAddOutlined,
} from "@ant-design/icons";
import {
  useCreateAlumniMutation,
  useCreateOpenSourceProjectMutation,
  useCreateProjectLabMutation,
  useDeleteAlumniMutation,
  useDeleteOpenSourceProjectMutation,
  useDeleteProjectLabMutation,
  useGetAlumniQuery,
  useGetOpenSourceProjectsQuery,
  useGetProjectLabsQuery,
  useUpdateAlumniMutation,
  useUpdateOpenSourceProjectMutation,
  useUpdateProjectLabMutation,
} from "@/store/queries/contentManagement";
import { authAPI } from "@/store/queries/usersMangement";

type Mode = "opensource" | "project" | "alumni";

const statusLabels: Record<string, string> = {
  open: "Đang tuyển",
  paused: "Tạm dừng",
  closed: "Đã đóng",
};

const GEN_CHOICES = [
  { value: "Gen 1", label: "Gen 1" },
  { value: "Gen 2", label: "Gen 2" },
  { value: "Gen 3", label: "Gen 3" },
  { value: "Gen 4", label: "Gen 4" },
  { value: "Gen 5", label: "Gen 5" },
  { value: "Gen 6", label: "Gen 6" },
  { value: "Gen 7", label: "Gen 7" },
  { value: "Gen 8", label: "Gen 8" },
];

const COMPANY_SUGGESTIONS = [
  "Axon Active",
  "FPT Software",
  "VNG Corp",
  "KMS Technology",
  "SmartDev",
  "Momo",
  "Viettel",
  "Shopee",
  "Enclave",
  "Google",
  "Microsoft",
  "Grab",
  "ZaloPay",
];

export default function CommunityContentManagement() {
  const { message } = App.useApp();
  const [mode, setMode] = useState<Mode>("opensource");
  const [editing, setEditing] = useState<any | null>(null);
  const [open, setOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form] = Form.useForm();

  // Alumni UX state
  const [alumniViewMode, setAlumniViewMode] = useState<"cards" | "table">("cards");
  const [alumniSearch, setAlumniSearch] = useState<string>("");
  const [alumniGenFilter, setAlumniGenFilter] = useState<string>("All");

  // Queries
  const projects = useGetProjectLabsQuery();
  const openSourceProjects = useGetOpenSourceProjectsQuery();
  const alumni = useGetAlumniQuery();
  const { data: usersData } = authAPI.useGetAllUsersQuery({
    page: 1,
    limit: 200,
    search: "",
    filter: JSON.stringify({}),
  });

  const memberList: any[] = useMemo(() => {
    if (!usersData) return [];
    if (Array.isArray(usersData)) return usersData;
    if (Array.isArray(usersData.data)) return usersData.data;
    if (Array.isArray(usersData.data?.users)) return usersData.data.users;
    return [];
  }, [usersData]);

  // Mutations
  const [createProject, projectCreateState] = useCreateProjectLabMutation();
  const [updateProject, projectUpdateState] = useUpdateProjectLabMutation();
  const [deleteProject] = useDeleteProjectLabMutation();

  const [createOpenSource, openSourceCreateState] = useCreateOpenSourceProjectMutation();
  const [updateOpenSource, openSourceUpdateState] = useUpdateOpenSourceProjectMutation();
  const [deleteOpenSource] = useDeleteOpenSourceProjectMutation();

  const [createAlumnus, alumniCreateState] = useCreateAlumniMutation();
  const [updateAlumnus, alumniUpdateState] = useUpdateAlumniMutation();
  const [deleteAlumnus] = useDeleteAlumniMutation();

  const saving =
    projectCreateState.isLoading ||
    projectUpdateState.isLoading ||
    openSourceCreateState.isLoading ||
    openSourceUpdateState.isLoading ||
    alumniCreateState.isLoading ||
    alumniUpdateState.isLoading;

  const rawRows =
    mode === "project"
      ? projects.data?.data || []
      : mode === "opensource"
      ? openSourceProjects.data?.data || []
      : alumni.data?.data || [];

  const filteredAlumniRows = useMemo(() => {
    if (mode !== "alumni") return rawRows;
    return (rawRows as any[]).filter((item) => {
      const matchSearch =
        item.name?.toLowerCase().includes(alumniSearch.toLowerCase()) ||
        item.headline?.toLowerCase().includes(alumniSearch.toLowerCase()) ||
        item.workplace?.toLowerCase().includes(alumniSearch.toLowerCase());
      const matchGen =
        alumniGenFilter === "All" || item.graduationGen === alumniGenFilter;
      return matchSearch && matchGen;
    });
  }, [mode, rawRows, alumniSearch, alumniGenFilter]);

  const rows = mode === "alumni" ? filteredAlumniRows : rawRows;

  const openEditor = (record?: any) => {
    setEditing(record || null);
    if (record) {
      form.setFieldsValue({
        ...record,
        roles: Array.isArray(record.roles) ? record.roles.join(", ") : record.roles,
        tags: Array.isArray(record.tags) ? record.tags.join(", ") : record.tags,
      });
    } else {
      form.resetFields();
      if (mode === "project") form.setFieldsValue({ status: "open" });
      if (mode === "opensource")
        form.setFieldsValue({
          stars: 0,
          category: "Open Source",
          isPublished: true,
          githubUrl: "https://github.com/fu-dever",
        });
      if (mode === "alumni")
        form.setFieldsValue({
          graduationGen: "Gen 6",
          workplace: "FPT Software",
          isPublished: true,
          isMentor: true,
        });
    }
    setOpen(true);
  };

  const handleSelectMember = (selectedUserId: string) => {
    const member = memberList.find((m: any) => m._id === selectedUserId);
    if (member) {
      const fullName = `${member.firstname || ""} ${member.lastname || ""}`.trim() || member.email || member.nickname;
      form.setFieldsValue({
        userId: member._id,
        name: fullName,
        avatar: member.avatar || "",
        headline: member.description || "Software Engineer",
        profileUrl: member.socials?.linkedin || member.socials?.github || member.socials?.facebook || "",
      });
      message.success(`Đã tự động liên kết thông tin & avatar của thành viên: ${fullName}`);
    }
  };

  const handleToggleAlumniPublish = async (record: any, checked: boolean) => {
    try {
      await updateAlumnus({ id: record._id, body: { isPublished: checked } }).unwrap();
      await alumni.refetch();
      message.success(`Đã ${checked ? "hiển thị" : "ẩn"} cựu thành viên ${record.name} trên Landing Page`);
    } catch {
      message.error("Lỗi khi cập nhật trạng thái");
    }
  };

  const handleToggleAlumniMentor = async (record: any, checked: boolean) => {
    try {
      await updateAlumnus({ id: record._id, body: { isMentor: checked } }).unwrap();
      await alumni.refetch();
      message.success(`Đã cập nhật trạng thái Mentoring cho ${record.name}`);
    } catch {
      message.error("Lỗi khi cập nhật trạng thái");
    }
  };

  const save = async (values: any) => {
    let body = { ...values };

    if (mode === "project" && values.roles) {
      body.roles = values.roles
        .split(",")
        .map((role: string) => role.trim())
        .filter(Boolean);
    } else if (mode === "opensource" && values.tags) {
      body.tags = typeof values.tags === "string"
        ? values.tags.split(",").map((t: string) => t.trim()).filter(Boolean)
        : values.tags;
    }

    try {
      if (editing) {
        if (mode === "project") {
          await updateProject({ id: editing._id, body }).unwrap();
          await projects.refetch();
        } else if (mode === "opensource") {
          await updateOpenSource({ id: editing._id, body }).unwrap();
          await openSourceProjects.refetch();
        } else {
          await updateAlumnus({ id: editing._id, body }).unwrap();
          await alumni.refetch();
        }
      } else {
        if (mode === "project") {
          await createProject(body).unwrap();
          await projects.refetch();
        } else if (mode === "opensource") {
          await createOpenSource(body).unwrap();
          await openSourceProjects.refetch();
        } else {
          await createAlumnus(body).unwrap();
          await alumni.refetch();
        }
      }
      message.success(editing ? "Đã cập nhật nội dung thành công" : "Đã tạo nội dung mới thành công");
      setOpen(false);
    } catch (err: any) {
      message.error(err?.data?.message || "Lỗi khi lưu dữ liệu");
    }
  };

  const remove = async (record: any) => {
    try {
      setDeletingId(record._id);
      if (mode === "project") {
        await deleteProject(record._id).unwrap();
        await projects.refetch();
      } else if (mode === "opensource") {
        await deleteOpenSource(record._id).unwrap();
        await openSourceProjects.refetch();
      } else {
        await deleteAlumnus(record._id).unwrap();
        await alumni.refetch();
      }
      message.success("Đã xóa nội dung thành công");
    } catch (err: any) {
      message.error(err?.data?.message || "Lỗi khi xóa dữ liệu");
    } finally {
      setDeletingId(null);
    }
  };

  const columns = useMemo(() => {
    if (mode === "project") {
      return [
        {
          title: "Dự Án Lab",
          dataIndex: "title",
          render: (value: string, row: any) => (
            <Space direction="vertical" size={0}>
              <Typography.Text strong style={{ fontSize: "14px", color: "#0066CC" }}>
                {value}
              </Typography.Text>
              <Typography.Text type="secondary" ellipsis={{ tooltip: row.summary }} style={{ maxWidth: 300 }}>
                {row.summary}
              </Typography.Text>
            </Space>
          ),
        },
        {
          title: "Nhóm",
          dataIndex: "category",
          render: (value: string) => <Tag color="blue">{value}</Tag>,
        },
        {
          title: "Vị trí tuyển",
          dataIndex: "roles",
          render: (roles: string[]) => (
            <Space wrap size={[0, 4]}>
              {(roles || []).map((role) => (
                <Tag key={role} color="purple">
                  {role}
                </Tag>
              ))}
            </Space>
          ),
        },
        {
          title: "Trạng thái",
          dataIndex: "status",
          render: (value: string) => (
            <Tag color={value === "open" ? "success" : value === "paused" ? "warning" : "default"}>
              {statusLabels[value] || value}
            </Tag>
          ),
        },
      ];
    } else if (mode === "opensource") {
      return [
        {
          title: "Dự Án Open Source",
          dataIndex: "title",
          render: (value: string, row: any) => (
            <Space direction="vertical" size={0}>
              <Typography.Text strong style={{ fontSize: "14px", color: "#0066CC" }}>
                {value}
              </Typography.Text>
              <Typography.Text type="secondary" ellipsis={{ tooltip: row.description }} style={{ maxWidth: 300 }}>
                {row.description}
              </Typography.Text>
            </Space>
          ),
        },
        {
          title: "Tác giả",
          dataIndex: "author",
          render: (value: string) => <Typography.Text strong>{value}</Typography.Text>,
        },
        {
          title: "Số sao GitHub",
          dataIndex: "stars",
          width: 120,
          render: (value: number) => (
            <Tag color="gold" icon={<StarFilled />}>
              {value || 0}
            </Tag>
          ),
        },
        {
          title: "Phân loại",
          dataIndex: "category",
          render: (value: string) => <Tag color="cyan">{value || "Open Source"}</Tag>,
        },
        {
          title: "Links",
          render: (_: unknown, row: any) => (
            <Space>
              {row.githubUrl && (
                <a href={row.githubUrl} target="_blank" rel="noopener noreferrer">
                  <Tag icon={<GithubOutlined />} color="default">GitHub</Tag>
                </a>
              )}
              {row.demoUrl && (
                <a href={row.demoUrl} target="_blank" rel="noopener noreferrer">
                  <Tag icon={<LinkOutlined />} color="blue">Demo</Tag>
                </a>
              )}
            </Space>
          ),
        },
        {
          title: "Hiển thị",
          dataIndex: "isPublished",
          width: 100,
          render: (value: boolean) => (
            <Tag color={value !== false ? "success" : "error"}>
              {value !== false ? "Đang hiện" : "Ẩn"}
            </Tag>
          ),
        },
      ];
    } else {
      return [
        {
          title: "Cựu thành viên",
          dataIndex: "name",
          render: (value: string, row: any) => (
            <Space size={12}>
              <Avatar src={row.avatar} size={40} style={{ backgroundColor: "#0066CC" }}>
                {value?.charAt(0)}
              </Avatar>
              <Space direction="vertical" size={0}>
                <Typography.Text strong>{value}</Typography.Text>
                <Typography.Text type="secondary" style={{ fontSize: "12px" }}>{row.headline}</Typography.Text>
              </Space>
            </Space>
          ),
        },
        {
          title: "Thế hệ",
          dataIndex: "graduationGen",
          render: (gen: string) => <Tag color="blue">{gen || "Gen 6"}</Tag>,
        },
        {
          title: "Đơn vị / Công ty",
          dataIndex: "workplace",
          render: (workplace: string) => (
            <Tag color="cyan" style={{ fontWeight: 600 }}>{workplace || "FPT Software"}</Tag>
          ),
        },
        {
          title: "Mentoring OJT",
          dataIndex: "isMentor",
          render: (isMentor: boolean, record: any) => (
            <Switch
              checked={isMentor !== false}
              onChange={(checked) => handleToggleAlumniMentor(record, checked)}
              checkedChildren="Sẵn sàng"
              unCheckedChildren="Tạm tắt"
            />
          ),
        },
        {
          title: "Hiển thị Landing",
          dataIndex: "isPublished",
          render: (isPublished: boolean, record: any) => (
            <Switch
              checked={isPublished !== false}
              onChange={(checked) => handleToggleAlumniPublish(record, checked)}
              checkedChildren="Hiện"
              unCheckedChildren="Ẩn"
            />
          ),
        },
      ];
    }
  }, [mode]);

  const actionColumn = {
    title: "Thao tác",
    width: 150,
    render: (_: unknown, record: any) => (
      <Space>
        <Button type="text" icon={<EditOutlined />} onClick={() => openEditor(record)}>
          Sửa
        </Button>
        <Popconfirm
          title="Xóa nội dung này?"
          description="Dữ liệu sẽ bị xóa vĩnh viễn khỏi hệ thống."
          okText="Xóa"
          cancelText="Hủy"
          okButtonProps={{ loading: deletingId === record._id, danger: true }}
          onConfirm={() => remove(record)}
        >
          <Button
            danger
            type="text"
            icon={<DeleteOutlined />}
            loading={deletingId === record._id}
          >
            Xóa
          </Button>
        </Popconfirm>
      </Space>
    ),
  };

  return (
    <div style={{ padding: 24 }}>
      <Space direction="vertical" size={20} style={{ width: "100%" }}>
        <div>
          <Typography.Title level={2} style={{ color: "#0066CC", marginBottom: 4 }}>
            Nội dung cộng đồng &amp; Mạng lưới Alumni
          </Typography.Title>
          <Typography.Text type="secondary">
            Quản trị các dự án Open Source, Project Lab nghiên cứu và mạng lưới cựu thành viên (Gen 1 - Gen 6) hiển thị trên Landing Page.
          </Typography.Text>
        </div>

        <Tabs
          activeKey={mode}
          onChange={(key) => {
            setMode(key as Mode);
            setOpen(false);
            form.resetFields();
          }}
          items={[
            { key: "opensource", label: "Dự Án Cá Nhân & Open Source" },
            { key: "project", label: "Project Lab" },
            { key: "alumni", label: "Mạng Lưới Alumni (Gen 1 - Gen 6)" },
          ]}
        />

        {/* ALUMNI CONTROLS BAR */}
        {mode === "alumni" && (
          <Card style={{ borderRadius: 16, backgroundColor: "#F8FCFF", borderColor: "#E2F0FD" }}>
            <Row gutter={[16, 16]} align="middle" justify="space-between">
              <Col xs={24} lg={14}>
                <Space wrap style={{ width: "100%" }}>
                  <Input
                    prefix={<SearchOutlined style={{ color: "#0066CC" }} />}
                    placeholder="Tìm tên cựu SV, công ty, vị trí..."
                    value={alumniSearch}
                    onChange={(e) => setAlumniSearch(e.target.value)}
                    style={{ width: 220, borderRadius: 10 }}
                    allowClear
                  />
                  <Select
                    value={alumniGenFilter}
                    onChange={(val) => setAlumniGenFilter(val)}
                    style={{ width: 170 }}
                    options={[
                      { value: "All", label: "Tất Cả Thế Hệ (Gen 1 - 6)" },
                      ...GEN_CHOICES,
                    ]}
                  />
                </Space>
              </Col>
              <Col xs={24} lg={10} style={{ display: "flex", flexWrap: "wrap", justifyContent: "flex-end", gap: 8 }}>
                <Radio.Group
                  value={alumniViewMode}
                  onChange={(e) => setAlumniViewMode(e.target.value)}
                  buttonStyle="solid"
                >
                  <Radio.Button value="cards"><AppstoreOutlined /> Thẻ</Radio.Button>
                  <Radio.Button value="table"><UnorderedListOutlined /> Bảng</Radio.Button>
                </Radio.Group>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => openEditor()}
                  style={{ backgroundColor: "#0066CC", borderRadius: 8, height: "34px", fontWeight: 600, fontSize: "13px" }}
                >
                  Thêm Cựu Thành Viên
                </Button>
              </Col>
            </Row>
          </Card>
        )}

        {mode !== "alumni" && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => openEditor()}
            style={{ width: "fit-content", backgroundColor: "#0066CC", borderRadius: 8, height: "34px", fontWeight: 600, fontSize: "13px" }}
          >
            Thêm {mode === "opensource" ? "dự án Open Source" : "dự án Lab"}
          </Button>
        )}

        {/* ALUMNI CARDS VIEW */}
        {mode === "alumni" && alumniViewMode === "cards" && (
          <div style={{ marginTop: 8 }}>
            <Row gutter={[16, 16]}>
              {filteredAlumniRows.map((alumnus: any) => (
                <Col key={alumnus._id} xs={24} sm={12} lg={8} xl={6}>
                  <Card
                    hoverable
                    style={{
                      borderRadius: 16,
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      border: "1px solid #E6F0FA",
                    }}
                    actions={[
                      <Button
                        key="edit"
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => openEditor(alumnus)}
                      >
                        Sửa
                      </Button>,
                      <Popconfirm
                        key="del"
                        title="Xóa cựu thành viên này?"
                        description="Dữ liệu sẽ bị xóa vĩnh viễn khỏi hệ thống."
                        okText="Xóa"
                        cancelText="Hủy"
                        okButtonProps={{ loading: deletingId === alumnus._id, danger: true }}
                        onConfirm={() => remove(alumnus)}
                      >
                        <Button
                          danger
                          type="text"
                          icon={<DeleteOutlined />}
                          loading={deletingId === alumnus._id}
                        >
                          Xóa
                        </Button>
                      </Popconfirm>,
                    ]}
                  >
                    <div style={{ textAlign: "center", marginBottom: 12 }}>
                      <Avatar
                        src={alumnus.avatar}
                        size={64}
                        style={{ backgroundColor: "#0066CC", marginBottom: 8, boxShadow: "0 2px 8px rgba(0,102,204,0.2)" }}
                      >
                        {alumnus.name?.charAt(0)}
                      </Avatar>
                      <div>
                        <Tag color="blue" style={{ fontWeight: "bold" }}>{alumnus.graduationGen || "Gen 6"}</Tag>
                        {alumnus.workplace && <Tag color="cyan">{alumnus.workplace}</Tag>}
                      </div>
                      <Typography.Title level={5} style={{ margin: "6px 0 2px 0" }}>
                        {alumnus.name}
                      </Typography.Title>
                      <Typography.Text type="secondary" style={{ fontSize: "12px" }}>
                        {alumnus.headline}
                      </Typography.Text>
                    </div>

                    {alumnus.quote && (
                      <div
                        style={{
                          backgroundColor: "#F8FAFC",
                          padding: "8px 12px",
                          borderRadius: 10,
                          fontSize: "11px",
                          fontStyle: "italic",
                          color: "#64748B",
                          marginBottom: 12,
                        }}
                      >
                        &quot;{alumnus.quote}&quot;
                      </div>
                    )}

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8, borderTop: "1px solid #F1F5F9" }}>
                      <span style={{ fontSize: "11px", color: "#64748B" }}>Hiển thị Landing:</span>
                      <Switch
                        size="small"
                        checked={alumnus.isPublished !== false}
                        onChange={(checked) => handleToggleAlumniPublish(alumnus, checked)}
                      />
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        )}

        {/* TABLE VIEW (FOR ALL MODES OR WHEN ALUMNI TABLE IS ACTIVE) */}
        {(mode !== "alumni" || alumniViewMode === "table") && (
          <Table
            rowKey="_id"
            loading={
              mode === "project"
                ? projects.isLoading
                : mode === "opensource"
                ? openSourceProjects.isLoading
                : alumni.isLoading
            }
            columns={[...columns, actionColumn]}
            dataSource={rows}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 880 }}
          />
        )}
      </Space>

      {/* MODAL EDITOR */}
      <Modal
        open={open}
        title={
          editing
            ? `Chỉnh sửa ${mode === "opensource" ? "Dự Án Open Source" : mode === "project" ? "Dự Án Lab" : "Cựu Thành Viên"}`
            : `Tạo mới ${mode === "opensource" ? "Dự Án Open Source" : mode === "project" ? "Dự Án Lab" : "Cựu Thành Viên"}`
        }
        onCancel={() => setOpen(false)}
        footer={null}
        destroyOnClose
        width="min(680px, 95vw)"
      >
        <Form form={form} layout="vertical" onFinish={save}>
          {mode === "opensource" && (
            <>
              <Form.Item name="title" label="Tên dự án" rules={[{ required: true, message: "Vui lòng nhập tên dự án" }]}>
                <Input placeholder="ví dụ: dever-cli, fptu-timetable..." />
              </Form.Item>
              <Form.Item name="description" label="Mô tả dự án" rules={[{ required: true, message: "Vui lòng nhập mô tả" }]}>
                <Input.TextArea rows={3} placeholder="Công cụ CLI giúp setup dự án nhanh cho thành viên CLB..." />
              </Form.Item>
              <Space style={{ width: "100%" }} size={16}>
                <Form.Item name="author" label="Tác giả" style={{ flex: 1 }} rules={[{ required: true }]}>
                  <Input placeholder="Nhật Quang, Vũ Vũ..." />
                </Form.Item>
                <Form.Item
                  name="stars"
                  label={
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      Số sao <StarFilled style={{ color: "#F59E0B" }} />
                    </span>
                  }
                  style={{ width: 130 }}
                >
                  <InputNumber min={0} style={{ width: "100%" }} />
                </Form.Item>
              </Space>
              <Form.Item name="category" label="Phân loại">
                <Input placeholder="CLI Tool, Browser Extension, Web App, AI Tool..." />
              </Form.Item>
              <Form.Item name="githubUrl" label="Link kho mã nguồn GitHub">
                <Input type="url" placeholder="https://github.com/fu-dever/dever-cli" />
              </Form.Item>
              <Form.Item name="demoUrl" label="Link trải nghiệm Demo (nếu có)">
                <Input type="url" placeholder="https://demo.fu-dever.com" />
              </Form.Item>
              <Form.Item name="tags" label="Thẻ công nghệ (phân cách bằng dấu phẩy)">
                <Input placeholder="React, TypeScript, Chrome, Node.js" />
              </Form.Item>
              <Form.Item name="isPublished" label="Trạng thái hiển thị" initialValue={true}>
                <Select
                  options={[
                    { value: true, label: "Hiển thị công khai trên Landing Page" },
                    { value: false, label: "Ẩn dự án" },
                  ]}
                />
              </Form.Item>
            </>
          )}

          {mode === "project" && (
            <>
              <Form.Item name="title" label="Tên dự án" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Form.Item name="summary" label="Mô tả" rules={[{ required: true }]}>
                <Input.TextArea rows={3} />
              </Form.Item>
              <Form.Item name="category" label="Nhóm" rules={[{ required: true }]}>
                <Input placeholder="Web, AI/ML, Mobile..." />
              </Form.Item>
              <Form.Item name="roles" label="Vị trí cần tuyển">
                <Input placeholder="Frontend, UI/UX, Backend" />
              </Form.Item>
              <Form.Item name="status" label="Trạng thái" rules={[{ required: true }]}>
                <Select
                  options={Object.entries(statusLabels).map(([value, label]) => ({
                    value,
                    label,
                  }))}
                />
              </Form.Item>
              <Form.Item name="contactUrl" label="Link liên hệ">
                <Input type="url" />
              </Form.Item>
            </>
          )}

          {mode === "alumni" && (
            <>
              {/* SMART MEMBER SELECTOR */}
              {!editing && (
                <div style={{ backgroundColor: "#EFF6FF", padding: 12, borderRadius: 12, marginBottom: 16, border: "1px solid #BFDBFE" }}>
                  <Typography.Text strong style={{ color: "#1E40AF", fontSize: "12px", display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                    <UsergroupAddOutlined /> Nối từ danh sách Thành Viên CLB (Tự động điền Avatar &amp; Profile):
                  </Typography.Text>
                  <Select
                    showSearch
                    allowClear
                    placeholder="Tìm và chọn thành viên trong CLB để lấy Avatar chính xác..."
                    style={{ width: "100%" }}
                    onChange={handleSelectMember}
                    filterOption={(input, option) =>
                      (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                    }
                    options={memberList.map((m: any) => ({
                      value: m._id,
                      label: `${m.firstname || ""} ${m.lastname || ""}`.trim() ? `${m.firstname || ""} ${m.lastname || ""} (${m.email})` : m.email,
                    }))}
                  />
                  <Typography.Text type="secondary" style={{ fontSize: "11px", marginTop: 4, display: "block" }}>
                    Chọn thành viên sẽ tự động điền họ tên, ảnh đại diện (avatar thật) và các link mạng xã hội.
                  </Typography.Text>
                </div>
              )}

              <Form.Item name="name" label="Họ tên cựu thành viên" rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}>
                <Input placeholder="Nguyễn Hải Đăng, Trần Minh Quang..." />
              </Form.Item>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Form.Item name="graduationGen" label="Thế hệ (Gen)" rules={[{ required: true, message: "Chọn Gen" }]}>
                  <Select options={GEN_CHOICES} />
                </Form.Item>
                <Form.Item name="workplace" label="Đơn vị / Công ty (Tự điền bất kỳ)">
                  <AutoComplete
                    placeholder="Nhập hoặc chọn công ty (Axon, FPT, VNG...)"
                    options={COMPANY_SUGGESTIONS.map((c) => ({ value: c }))}
                    filterOption={(inputValue, option) =>
                      (option?.value ?? "").toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                    }
                  />
                </Form.Item>
              </div>

              <Form.Item name="headline" label="Vị trí / Chức danh hiện tại" rules={[{ required: true }]}>
                <Input placeholder="Tech Lead, Senior Backend Engineer, Software Architect..." />
              </Form.Item>

              <Form.Item name="quote" label="Trích dẫn truyền cảm hứng / Lời khuyên OJT">
                <Input.TextArea rows={2} placeholder="Chia sẻ kinh nghiệm vượt khó hoặc mẹo thực tập cho sinh viên..." />
              </Form.Item>

              <Form.Item name="avatar" label="URL Ảnh đại diện">
                <Input placeholder="https://images.unsplash.com/..." prefix={<UserOutlined />} />
              </Form.Item>

              <Form.Item name="profileUrl" label="Link LinkedIn / GitHub / Facebook cá nhân">
                <Input placeholder="https://linkedin.com/in/..." prefix={<LinkedinOutlined />} />
              </Form.Item>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Form.Item name="isMentor" label="Sẵn sàng Mentoring OJT" valuePropName="checked" initialValue={true}>
                  <Switch checkedChildren="Có" unCheckedChildren="Không" />
                </Form.Item>
                <Form.Item name="isPublished" label="Hiển thị lên Landing Page" valuePropName="checked" initialValue={true}>
                  <Switch checkedChildren="Hiện" unCheckedChildren="Ẩn" />
                </Form.Item>
              </div>
            </>
          )}

          <Button
            htmlType="submit"
            type="primary"
            loading={saving}
            block
            style={{ backgroundColor: "#0066CC", borderRadius: 10, marginTop: 8 }}
          >
            Lưu nội dung
          </Button>
        </Form>
      </Modal>
    </div>
  );
}
