"use client";

import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  Switch,
  message,
  Typography,
  Card,
  Row,
  Col,
  Image as AntImage,
  QRCode,
} from "antd";
import {
  PlusOutlined,
  CalendarOutlined,
  DeleteOutlined,
  PictureOutlined,
  QrcodeOutlined,
  FormOutlined,
  EnvironmentOutlined,
  UploadOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  PlayCircleOutlined,
  ClockCircleOutlined,
  HistoryOutlined,
  PauseCircleOutlined,
  AppstoreOutlined,
  StarFilled,
  StarOutlined,
} from "@ant-design/icons";
import webStorageClient from "@/utils/webStorageClient";

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

export interface EventStatusMeta {
  key: string;
  label: string;
  color: string;
  bg: string;
  border: string;
  dotColor: string;
  renderIcon: () => React.ReactNode;
}

export const EVENT_STATUS_CONFIG: Record<string, EventStatusMeta> = {
  "Đang mở đăng ký": {
    key: "Đang mở đăng ký",
    label: "Đang mở đăng ký",
    color: "#0066CC",
    bg: "#EFF6FF",
    border: "#BFDBFE",
    dotColor: "#2563EB",
    renderIcon: () => <CheckCircleOutlined style={{ color: "#0066CC" }} />,
  },
  "Đang diễn ra": {
    key: "Đang diễn ra",
    label: "Đang diễn ra",
    color: "#E11D48",
    bg: "#FFF1F2",
    border: "#FECDD3",
    dotColor: "#E11D48",
    renderIcon: () => <PlayCircleOutlined style={{ color: "#E11D48" }} />,
  },
  "Sắp diễn ra": {
    key: "Sắp diễn ra",
    label: "Sắp diễn ra",
    color: "#D97706",
    bg: "#FFFBEB",
    border: "#FDE68A",
    dotColor: "#D97706",
    renderIcon: () => <ClockCircleOutlined style={{ color: "#D97706" }} />,
  },
  "Đã kết thúc": {
    key: "Đã kết thúc",
    label: "Đã kết thúc",
    color: "#475569",
    bg: "#F8FAFC",
    border: "#E2E8F0",
    dotColor: "#64748B",
    renderIcon: () => <HistoryOutlined style={{ color: "#64748B" }} />,
  },
  "Tạm hoãn": {
    key: "Tạm hoãn",
    label: "Tạm hoãn",
    color: "#7C3AED",
    bg: "#FAF5FF",
    border: "#E9D5FF",
    dotColor: "#7C3AED",
    renderIcon: () => <PauseCircleOutlined style={{ color: "#7C3AED" }} />,
  },
};

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

interface EventAdminData {
  _id?: string;
  key?: string;
  title: string;
  date: string;
  time: string;
  location: string;
  status: string;
  speakers: string;
  coverImage: string;
  description: string;
  registerUrl: string;
  checkinUrl: string;
  isFeatured?: boolean;
}

export default function EventManagementModule() {
  const [events, setEvents] = useState<EventAdminData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedQrEvent, setSelectedQrEvent] = useState<EventAdminData | null>(null);
  const [previewCoverUrl, setPreviewCoverUrl] = useState("");
  const [updatingFeaturedId, setUpdatingFeaturedId] = useState<string | null>(null);
  const [form] = Form.useForm();

  const API_SERVER = process.env.NEXT_PUBLIC_API_SERVER || "http://localhost:5000";

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_SERVER}/api/v1/events`);
      const json = await res.json();
      if (json.data) {
        setEvents(json.data.map((item: any) => ({ ...item, key: item._id })));
      }
    } catch (err) {
      console.warn("MongoDB API error, using local state:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        message.error("Kích thước file ảnh không được vượt quá 5MB!");
        return;
      }
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const base64Url = uploadEvent.target?.result as string;
        setPreviewCoverUrl(base64Url);
        form.setFieldsValue({ coverImage: base64Url });
        message.success("Tải ảnh từ máy tính thành công!");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddEvent = async (values: any) => {
    const finalCoverImage = formatImageUrl(values.coverImage || previewCoverUrl || "/images/dever_blog_hero.png");
    const token = webStorageClient.getToken();

    try {
      const res = await fetch(`${API_SERVER}/api/v1/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: values.title,
          date: values.date || "20/09/2026",
          time: values.time || "14:00 - 17:00",
          location: values.location,
          status: values.status || "Đang mở đăng ký",
          speakers: values.speakers || "Ban Chuyên Môn FU-DEVER",
          coverImage: finalCoverImage,
          description: values.description || "Nội dung chi tiết sự kiện...",
          registerUrl: values.registerUrl || "#",
          checkinUrl: values.checkinUrl || "#",
          isFeatured: !!values.isFeatured,
        }),
      });
      const json = await res.json();
      if (json.status === "success") {
        message.success("Đã tạo sự kiện mới thành công.");
        setIsModalOpen(false);
        setPreviewCoverUrl("");
        form.resetFields();
        fetchEvents();
      }
    } catch (err) {
      message.error("Lỗi khi thêm sự kiện!");
    }
  };

  const handleQuickStatusChange = async (id?: string, newStatus?: string) => {
    if (!id || !newStatus) return;
    const token = webStorageClient.getToken();

    // Optimistic UI update
    setEvents((prev) =>
      prev.map((ev) => (ev._id === id ? { ...ev, status: newStatus } : ev))
    );

    try {
      const res = await fetch(`${API_SERVER}/api/v1/events/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (json.status === "success") {
        message.success(`Đã cập nhật trạng thái: "${newStatus}"!`);
      } else {
        fetchEvents();
      }
    } catch (err) {
      message.error("Lỗi khi cập nhật trạng thái!");
      fetchEvents();
    }
  };

  const handleToggleFeatured = async (id?: string, checked?: boolean) => {
    if (!id || updatingFeaturedId === id) return;
    setUpdatingFeaturedId(id);
    const token = webStorageClient.getToken();

    // Optimistic update
    setEvents((prev) =>
      prev.map((ev) =>
        ev._id === id
          ? { ...ev, isFeatured: checked }
          : checked
          ? { ...ev, isFeatured: false }
          : ev
      )
    );

    try {
      const res = await fetch(`${API_SERVER}/api/v1/events/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isFeatured: checked }),
      });
      const json = await res.json();
      if (json.status === "success") {
        message.success(
          checked
            ? "Đã ghim sự kiện này lên vị trí SỰ KIỆN NỔI BẬT đầu trang Landing Page!"
            : "Đã tắt ghim sự kiện nổi bật."
        );
      } else {
        fetchEvents();
      }
    } catch (err) {
      message.error("Lỗi khi cập nhật sự kiện nổi bật!");
      fetchEvents();
    } finally {
      setUpdatingFeaturedId(null);
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    const token = webStorageClient.getToken();
    try {
      const res = await fetch(`${API_SERVER}/api/v1/events/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.status === "success") {
        message.success("Đã xóa sự kiện thành công!");
        fetchEvents();
      }
    } catch (err) {
      message.error("Lỗi khi xóa sự kiện!");
    }
  };

  const filteredEvents =
    filterStatus === "all"
      ? events
      : events.filter((e) => e.status === filterStatus);

  const filterTabs = [
    {
      key: "all",
      label: "Tất cả",
      icon: <AppstoreOutlined />,
      count: events.length,
    },
    {
      key: "Đang mở đăng ký",
      label: "Đang mở đăng ký",
      icon: <CheckCircleOutlined style={{ color: "#0066CC" }} />,
      count: events.filter((e) => e.status === "Đang mở đăng ký").length,
    },
    {
      key: "Đang diễn ra",
      label: "Đang diễn ra",
      icon: <PlayCircleOutlined style={{ color: "#E11D48" }} />,
      count: events.filter((e) => e.status === "Đang diễn ra").length,
    },
    {
      key: "Sắp diễn ra",
      label: "Sắp diễn ra",
      icon: <ClockCircleOutlined style={{ color: "#D97706" }} />,
      count: events.filter((e) => e.status === "Sắp diễn ra").length,
    },
    {
      key: "Đã kết thúc",
      label: "Đã kết thúc",
      icon: <HistoryOutlined style={{ color: "#64748B" }} />,
      count: events.filter((e) => e.status === "Đã kết thúc").length,
    },
    {
      key: "Tạm hoãn",
      label: "Tạm hoãn",
      icon: <PauseCircleOutlined style={{ color: "#7C3AED" }} />,
      count: events.filter((e) => e.status === "Tạm hoãn").length,
    },
  ];

  const columns = [
    {
      title: "Ảnh Bìa",
      dataIndex: "coverImage",
      key: "coverImage",
      width: 85,
      render: (imgUrl: string) => (
        <AntImage
          src={formatImageUrl(imgUrl)}
          alt="Cover"
          width={65}
          height={44}
          style={{ objectFit: "cover", borderRadius: 8, border: "1px solid #e6f4ff" }}
          fallback="/images/dever_blog_hero.png"
        />
      ),
    },
    {
      title: "Tên Sự kiện & Mô tả",
      dataIndex: "title",
      key: "title",
      width: 260,
      render: (text: string, record: EventAdminData) => (
        <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 180, maxWidth: 300 }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "4px 6px" }}>
            {record.isFeatured && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                  padding: "1px 6px",
                  borderRadius: 6,
                  backgroundColor: "#FEF3C7",
                  color: "#B45309",
                  fontSize: 10,
                  fontWeight: 700,
                  border: "1px solid #FCD34D",
                  flexShrink: 0,
                  whiteSpace: "nowrap",
                  lineHeight: "16px",
                }}
              >
                <StarFilled style={{ color: "#F59E0B", fontSize: 10 }} /> NỔI BẬT
              </span>
            )}
            <Text strong style={{ fontSize: 13, wordBreak: "break-word", flex: "1 1 auto", minWidth: 100 }}>
              {text}
            </Text>
          </div>
          <Paragraph ellipsis={{ rows: 2 }} type="secondary" style={{ fontSize: 12, margin: 0, wordBreak: "break-word" }}>
            {record.description}
          </Paragraph>
          <Text type="secondary" style={{ fontSize: 11, color: "#0066CC", wordBreak: "break-word" }}>
            <EnvironmentOutlined aria-hidden="true" /> {record.location} • <CalendarOutlined aria-hidden="true" /> {record.date} ({record.time})
          </Text>
        </div>
      ),
    },
    {
      title: (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          <StarFilled style={{ color: "#F59E0B" }} /> Nổi Bật (Hero)
        </span>
      ),
      dataIndex: "isFeatured",
      key: "isFeatured",
      width: 125,
      render: (isFeatured: boolean, record: EventAdminData) => (
        <Switch
          checked={!!isFeatured}
          checkedChildren={<StarFilled />}
          unCheckedChildren={<StarOutlined />}
          loading={updatingFeaturedId === record._id}
          disabled={updatingFeaturedId !== null && updatingFeaturedId !== record._id}
          aria-label={`Đặt sự kiện ${record.title} làm nổi bật trên Hero Banner`}
          onChange={(checked) => handleToggleFeatured(record._id, checked)}
          style={{ backgroundColor: isFeatured ? "#F59E0B" : undefined }}
        />
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 165,
      render: (status: string, record: EventAdminData) => {
        const currentCfg = EVENT_STATUS_CONFIG[status] || {
          key: status,
          label: status || "Chưa chọn",
          color: "#475569",
          bg: "#F8FAFC",
          border: "#E2E8F0",
          dotColor: "#64748B",
          renderIcon: () => <HistoryOutlined style={{ color: "#64748B" }} />,
        };

        return (
          <Select
            value={status}
            onChange={(newStatus) => handleQuickStatusChange(record._id, newStatus)}
            size="small"
            bordered={false}
            style={{
              width: 155,
              backgroundColor: currentCfg.bg,
              color: currentCfg.color,
              border: `1px solid ${currentCfg.border}`,
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 12,
              padding: "2px 4px",
            }}
            dropdownMatchSelectWidth={false}
          >
            {Object.keys(EVENT_STATUS_CONFIG).map((stKey) => {
              const cfg = EVENT_STATUS_CONFIG[stKey];
              return (
                <Option key={stKey} value={stKey}>
                  <Space size={6}>
                    {cfg.renderIcon()}
                    <span style={{ color: cfg.color, fontWeight: 600, fontSize: 12 }}>
                      {cfg.label}
                    </span>
                  </Space>
                </Option>
              );
            })}
          </Select>
        );
      },
    },
    {
      title: "Link Đăng Ký",
      dataIndex: "registerUrl",
      key: "registerUrl",
      width: 140,
      render: (url: string) =>
        url && url !== "#" ? (
          <a href={url} target="_blank" rel="noreferrer" style={{ color: "#0066CC", fontWeight: 600 }}>
            <FormOutlined /> Link Đăng Ký ↗
          </a>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: "Mã QR Check-in",
      key: "qr",
      width: 150,
      render: (_: any, record: EventAdminData) =>
        record.checkinUrl && record.checkinUrl !== "#" ? (
          <Button
            size="small"
            icon={<QrcodeOutlined />}
            onClick={() => setSelectedQrEvent(record)}
            style={{ borderRadius: 6, borderColor: "#0066CC", color: "#0066CC", fontWeight: 600 }}
          >
            Mã QR Bàn Desk
          </Button>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 75,
      render: (_: any, record: EventAdminData) => (
        <Button
          danger
          type="text"
          icon={<DeleteOutlined />}
          onClick={() => handleDelete(record._id)}
        >
          Xóa
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: "16px 20px" }}>
      {/* Header */}
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
          <Title level={4} style={{ margin: 0, color: "#0066CC", fontSize: "18px", fontWeight: 700 }}>
            <CalendarOutlined aria-hidden="true" /> Quản Lý Sự Kiện & Workshop
          </Title>
          <Text type="secondary" style={{ fontSize: "13px" }}>
            Linh hoạt ghim sự kiện nổi bật lên Hero Banner, lọc trạng thái và tạo mã QR check-in bàn desk.
          </Text>
        </div>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchEvents}
            loading={loading}
            style={{ borderRadius: 8 }}
          >
            Làm mới
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="middle"
            onClick={() => setIsModalOpen(true)}
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
            Tạo Sự Kiện Mới
          </Button>
        </Space>
      </div>

      <Card
        style={{
          borderRadius: "16px",
          border: "1px solid #e6f4ff",
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        }}
        bodyStyle={{ padding: "16px" }}
      >
        {/* Modern Segmented Status Filter Pills (SVG Icons & Glassmorphism) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            overflowX: "auto",
            paddingBottom: "14px",
            marginBottom: "14px",
            borderBottom: "1px solid #f1f5f9",
          }}
        >
          {filterTabs.map((tab) => {
            const isActive = filterStatus === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilterStatus(tab.key)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 14px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: isActive ? 700 : 500,
                  cursor: "pointer",
                  border: isActive ? "1px solid #0066CC" : "1px solid #e2e8f0",
                  backgroundColor: isActive ? "#0066CC" : "#f8fafc",
                  color: isActive ? "#ffffff" : "#475569",
                  transition: "all 0.2s ease-in-out",
                  whiteSpace: "nowrap",
                  boxShadow: isActive ? "0 2px 6px rgba(0, 102, 204, 0.2)" : "none",
                }}
              >
                <span style={{ fontSize: 13, display: "flex", alignItems: "center", color: isActive ? "#ffffff" : undefined }}>
                  {tab.icon}
                </span>
                <span>{tab.label}</span>
                <span
                  style={{
                    padding: "1px 6px",
                    borderRadius: "10px",
                    fontSize: "11px",
                    fontWeight: 700,
                    backgroundColor: isActive ? "rgba(255, 255, 255, 0.25)" : "#e2e8f0",
                    color: isActive ? "#ffffff" : "#64748b",
                  }}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <Table
          dataSource={filteredEvents}
          columns={columns}
          loading={loading}
          pagination={{ pageSize: 5 }}
          scroll={{ x: 920 }}
        />
      </Card>

      {/* Modal Add Event */}
      <Modal
        title="Tạo Sự Kiện / Workshop Mới (Hỗ trợ Upload File Ảnh & Link Drive)"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width="min(720px, 95vw)"
        style={{ top: 20 }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddEvent}
          initialValues={{ status: "Đang mở đăng ký", isFeatured: false }}
        >
          <Form.Item label="Tiêu đề Sự kiện / Workshop" name="title" rules={[{ required: true, message: "Vui lòng nhập tiêu đề sự kiện!" }]}>
            <Input placeholder="Ví dụ: Workshop Tối Ưu Hóa Code Web 2026..." />
          </Form.Item>

          <Row gutter={[12, 12]}>
            <Col xs={24} sm={12}>
              <Form.Item label="Ngày diễn ra" name="date" rules={[{ required: true, message: "Nhập ngày diễn ra!" }]}>
                <Input placeholder="Ví dụ: 15/08/2026" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="Khung giờ" name="time" rules={[{ required: true, message: "Nhập khung giờ!" }]}>
                <Input placeholder="Ví dụ: 14:00 - 17:00" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[12, 12]}>
            <Col xs={24} sm={14}>
              <Form.Item label="Địa điểm tổ chức" name="location" rules={[{ required: true, message: "Vui lòng nhập địa điểm!" }]}>
                <Input placeholder="Ví dụ: Hội trường Beta, FPTU Da Nang..." />
              </Form.Item>
            </Col>
            <Col xs={24} sm={10}>
              <Form.Item label="Trạng thái sự kiện" name="status" rules={[{ required: true }]}>
                <Select>
                  {Object.keys(EVENT_STATUS_CONFIG).map((stKey) => {
                    const cfg = EVENT_STATUS_CONFIG[stKey];
                    return (
                      <Option key={stKey} value={stKey}>
                        <Space size={6}>
                          {cfg.renderIcon()}
                          <span style={{ color: cfg.color, fontWeight: 600, fontSize: 12 }}>{cfg.label}</span>
                        </Space>
                      </Option>
                    );
                  })}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Diễn giả / Ban tổ chức" name="speakers">
            <Input placeholder="Ví dụ: Lê Đức Anh Phương & Ban Chuyên Môn FU-DEVER" />
          </Form.Item>

          {/* Featured Event Switch */}
          <Form.Item name="isFeatured" valuePropName="checked" style={{ marginBottom: 16 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 14px",
                backgroundColor: "#FFFBEB",
                borderRadius: "12px",
                border: "1px solid #FDE68A",
              }}
            >
              <Switch checkedChildren={<StarFilled />} unCheckedChildren={<StarOutlined />} />
              <span style={{ fontSize: "13px", fontWeight: 600, color: "#92400E", display: "inline-flex", alignItems: "center", gap: 6 }}>
                <StarFilled style={{ color: "#F59E0B" }} /> Ghim làm "SỰ KIỆN NỔI BẬT" trên Hero Banner đầu trang Landing Page
              </span>
            </div>
          </Form.Item>

          {/* Upload Image Section */}
          <div style={{ marginBottom: 16, background: "#F8FCFF", padding: 16, borderRadius: 12, border: "1px solid #e6f4ff" }}>
            <Text strong style={{ display: "block", marginBottom: 8 }}>
              <PictureOutlined aria-hidden="true" /> Ảnh Bìa Sự Kiện (Tải từ máy tính HOẶC Dán URL Link Drive)
            </Text>

            <Row gutter={[12, 12]} align="middle">
              <Col xs={24} sm={15}>
                <Form.Item name="coverImage" style={{ marginBottom: 0 }}>
                  <Input
                    prefix={<PictureOutlined style={{ color: "#0066CC" }} />}
                    placeholder="Dán URL link ảnh (Google Drive, ImgBB, Unsplash...)"
                    value={previewCoverUrl}
                    onChange={(e) => setPreviewCoverUrl(e.target.value)}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={9}>
                <label
                  htmlFor="local-image-upload"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 16px",
                    background: "#0066CC",
                    color: "white",
                    borderRadius: 8,
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: "pointer",
                    width: "100%",
                    justifyContent: "center",
                  }}
                >
                  <UploadOutlined /> Tải Từ Máy Tính
                </label>
                <input
                  id="local-image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  style={{ display: "none" }}
                />
              </Col>
            </Row>

            {previewCoverUrl && (
              <div style={{ marginTop: 12, textAlign: "center", borderRadius: 10, overflow: "hidden", border: "1px solid #d9d9d9", maxHeight: 180 }}>
                <img
                  src={formatImageUrl(previewCoverUrl)}
                  alt="Banner Preview"
                  style={{ width: "100%", objectFit: "cover" }}
                  onError={() => setPreviewCoverUrl("")}
                />
              </div>
            )}
          </div>

          <Form.Item
            label="Mô Tả Chi Tiết Sự Kiện (Description & Agenda)"
            name="description"
            rules={[{ required: true, message: "Vui lòng nhập mô tả sự kiện!" }]}
          >
            <TextArea
              rows={4}
              placeholder="Ví dụ: Buổi workshop sẽ đi qua 3 phần chính: 1. Giới thiệu Next.js 14; 2. Demo xây dựng Web; 3. Hỏi đáp cùng Senior Dev..."
            />
          </Form.Item>

          <Form.Item
            label="Link Đăng Ký (Google Form / MS Form)"
            name="registerUrl"
            rules={[
              { required: true, message: "Vui lòng nhập link form đăng ký sự kiện!" },
              { type: "url", message: "Link đăng ký phải là URL hợp lệ (bắt đầu bằng http:// hoặc https://)!" },
            ]}
          >
            <Input prefix={<FormOutlined />} placeholder="https://docs.google.com/forms/d/e/.../viewform" />
          </Form.Item>

          <Form.Item
            label="Link / Mã QR Check-in (Điểm danh)"
            name="checkinUrl"
            rules={[
              { required: true, message: "Vui lòng nhập link tạo mã QR điểm danh / check-in!" },
              { type: "url", message: "Link check-in phải là URL hợp lệ (bắt đầu bằng http:// hoặc https://)!" },
            ]}
          >
            <Input prefix={<QrcodeOutlined />} placeholder="https://docs.google.com/forms/d/e/.../viewform hoặc link điểm danh" />
          </Form.Item>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
            <Button onClick={() => setIsModalOpen(false)}>Hủy</Button>
            <Button type="primary" htmlType="submit" style={{ background: "#0066CC" }}>
              Xác nhận lưu sự kiện
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Modal View QR Code Bàn Desk (Offline Native SVG QR Code) */}
      {selectedQrEvent && (
        <Modal
          title="Mã QR Code Điểm Danh Sự Kiện (Bàn Desk)"
          open={!!selectedQrEvent}
          onCancel={() => setSelectedQrEvent(null)}
          footer={[
            <Button key="close" type="primary" onClick={() => setSelectedQrEvent(null)} style={{ background: "#0066CC" }}>
              Đóng
            </Button>,
          ]}
          width="min(440px, 92vw)"
          style={{ textAlign: "center", top: 40 }}
        >
          <div style={{ padding: "16px 0" }}>
            <Text strong style={{ fontSize: 16, display: "block", marginBottom: 8 }}>
              {selectedQrEvent.title}
            </Text>
            <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 16 }}>
              Mã QR SVG nội bộ hoạt động ngay cả khi không có mạng ngoài. Sinh viên dùng Zalo/Camera điện thoại quét để mở form điểm danh.
            </Text>

            <div style={{ display: "flex", justifyContent: "center", margin: "0 auto", padding: 8 }}>
              <QRCode
                value={selectedQrEvent.checkinUrl && selectedQrEvent.checkinUrl !== "#" ? selectedQrEvent.checkinUrl : "https://fu-dever.com"}
                size={220}
                type="svg"
                bordered={false}
                color="#002D66"
                style={{ borderRadius: 12, border: "2px solid #e6f4ff", padding: 8, backgroundColor: "#ffffff" }}
              />
            </div>

            <div style={{ marginTop: 16 }}>
              <a
                href={selectedQrEvent.checkinUrl}
                target="_blank"
                rel="noreferrer"
                style={{ color: "#0066CC", fontWeight: 600, fontSize: 13 }}
              >
                Link Form Check-in Trực Tiếp ↗
              </a>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
