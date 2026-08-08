"use client";

import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Tag,
  Space,
  message,
  Typography,
  Card,
  Row,
  Col,
  Upload,
  Image as AntImage,
} from "antd";
import {
  PlusOutlined,
  CalendarOutlined,
  DeleteOutlined,
  PictureOutlined,
  QrcodeOutlined,
  FormOutlined,
  UploadOutlined,
} from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

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
  status: "Đang mở đăng ký" | "Sắp diễn ra" | "Đã kết thúc" | string;
  speakers: string;
  coverImage: string;
  description: string;
  registerUrl: string;
  checkinUrl: string;
}

export default function EventManagementModule() {
  const [events, setEvents] = useState<EventAdminData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedQrEvent, setSelectedQrEvent] = useState<EventAdminData | null>(null);
  const [previewCoverUrl, setPreviewCoverUrl] = useState("");
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

    try {
      const res = await fetch(`${API_SERVER}/api/v1/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: values.title,
          date: values.date || "20/09/2026",
          time: values.time || "14:00 - 17:00",
          location: values.location,
          status: values.status,
          speakers: values.speakers || "Ban Chuyên Môn FU-DEVER",
          coverImage: finalCoverImage,
          description: values.description || "Nội dung chi tiết sự kiện...",
          registerUrl: values.registerUrl,
          checkinUrl: values.checkinUrl,
        }),
      });
      const json = await res.json();
      if (json.status === "success") {
        message.success("🎉 Đã tạo Sự kiện mới vào Database MongoDB thành công!");
        setIsModalOpen(false);
        setPreviewCoverUrl("");
        form.resetFields();
        fetchEvents();
      }
    } catch (err) {
      message.error("Lỗi khi thêm sự kiện!");
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    try {
      const res = await fetch(`${API_SERVER}/api/v1/events/${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.status === "success") {
        message.success("Đã xóa sự kiện khỏi MongoDB!");
        fetchEvents();
      }
    } catch (err) {
      message.error("Lỗi khi xóa sự kiện!");
    }
  };

  const columns = [
    {
      title: "Ảnh Bìa",
      dataIndex: "coverImage",
      key: "coverImage",
      width: 90,
      render: (imgUrl: string) => (
        <AntImage
          src={formatImageUrl(imgUrl)}
          alt="Cover"
          width={70}
          height={48}
          style={{ objectFit: "cover", borderRadius: 8, border: "1px solid #e6f4ff" }}
          fallback="/images/dever_blog_hero.png"
        />
      ),
    },
    {
      title: "Tên Sự kiện & Mô tả",
      dataIndex: "title",
      key: "title",
      render: (text: string, record: EventAdminData) => (
        <Space direction="vertical" size={2}>
          <Text strong style={{ fontSize: 14 }}>
            {text}
          </Text>
          <Paragraph ellipsis={{ rows: 2 }} type="secondary" style={{ fontSize: 12, margin: 0, maxWidth: 360 }}>
            {record.description}
          </Paragraph>
          <Text type="secondary" style={{ fontSize: 11, color: "#0066CC" }}>
            📍 {record.location} • 📅 {record.date} ({record.time})
          </Text>
        </Space>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (st: string) => (
        <Tag color={st === "Đang mở đăng ký" ? "green" : st === "Sắp diễn ra" ? "orange" : "default"}>
          {st}
        </Tag>
      ),
    },
    {
      title: "Diễn giả",
      dataIndex: "speakers",
      key: "speakers",
    },
    {
      title: "Form Đăng Ký (Cách A)",
      dataIndex: "registerUrl",
      key: "registerUrl",
      render: (url: string) =>
        url && url !== "#" ? (
          <a href={url} target="_blank" rel="noreferrer" style={{ color: "#0066CC", fontWeight: 600 }}>
            <FormOutlined /> Form Đăng Ký ↗
          </a>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: "Mã QR Check-in (Cách B)",
      key: "qr",
      render: (_: any, record: EventAdminData) =>
        record.checkinUrl && record.checkinUrl !== "#" ? (
          <Button
            size="small"
            icon={<QrcodeOutlined />}
            onClick={() => setSelectedQrEvent(record)}
            style={{ borderRadius: 6, borderColor: "#0066CC", color: "#0066CC" }}
          >
            Mở Mã QR
          </Button>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: "Thao tác",
      key: "action",
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
    <div style={{ padding: 24 }}>
      <Card style={{ borderRadius: 16 }}>
        <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <Title level={3} style={{ margin: 0, color: "#0066CC" }}>
              📅 Quản Lý Sự Kiện & Workshop (Hỗ Trợ Tải Ảnh Từ Máy Tính & Link Google Drive)
            </Title>
            <Text type="secondary">
              Tải ảnh từ máy tính hoặc dán link Google Drive (tự động đổi sang ảnh trực tiếp), lưu thẳng vào Database MongoDB.
            </Text>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={() => setIsModalOpen(true)}
            style={{ borderRadius: 10, background: "#0066CC" }}
          >
            Tạo Sự Kiện Mới
          </Button>
        </div>

        <Table dataSource={events} columns={columns} loading={loading} pagination={{ pageSize: 5 }} />
      </Card>

      {/* Modal Add Event */}
      <Modal
        title="Tạo Sự Kiện / Workshop Mới (Hỗ trợ Upload File Ảnh & Link Drive)"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={720}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddEvent}
          initialValues={{ status: "Đang mở đăng ký" }}
        >
          <Form.Item label="Tiêu đề Sự kiện / Workshop" name="title" rules={[{ required: true, message: "Vui lòng nhập tiêu đề sự kiện!" }]}>
            <Input placeholder="Ví dụ: Workshop Tối Ưu Hóa Code Web 2026..." />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Ngày diễn ra" name="date" rules={[{ required: true, message: "Nhập ngày diễn ra!" }]}>
                <Input placeholder="Ví dụ: 15/08/2026" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Khung giờ" name="time" rules={[{ required: true, message: "Nhập khung giờ!" }]}>
                <Input placeholder="Ví dụ: 14:00 - 17:00" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={14}>
              <Form.Item label="Địa điểm tổ chức" name="location" rules={[{ required: true, message: "Vui lòng nhập địa điểm!" }]}>
                <Input placeholder="Ví dụ: Hội trường Beta, FPTU Da Nang..." />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item label="Trạng thái sự kiện" name="status" rules={[{ required: true }]}>
                <Select>
                  <Option value="Đang mở đăng ký">Đang mở đăng ký</Option>
                  <Option value="Sắp diễn ra">Sắp diễn ra</Option>
                  <Option value="Đã kết thúc">Đã kết thúc</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Diễn giả / Ban tổ chức" name="speakers">
            <Input placeholder="Ví dụ: Lê Đức Anh Phương & Ban Chuyên Môn FU-DEVER" />
          </Form.Item>

          {/* Upload Image Section */}
          <div style={{ marginBottom: 16, background: "#F8FCFF", padding: 16, borderRadius: 12, border: "1px border #e6f4ff" }}>
            <Text strong style={{ display: "block", marginBottom: 8 }}>
              🖼️ Ảnh Bìa Sự Kiện (Tải từ máy tính HOẶC Dán URL Link Drive)
            </Text>

            <Row gutter={12} align="middle">
              <Col span={14}>
                <Form.Item name="coverImage" style={{ marginBottom: 0 }}>
                  <Input
                    prefix={<PictureOutlined style={{ color: "#0066CC" }} />}
                    placeholder="Dán URL link ảnh (Google Drive, ImgBB, Unsplash...)"
                    value={previewCoverUrl}
                    onChange={(e) => setPreviewCoverUrl(e.target.value)}
                  />
                </Form.Item>
              </Col>

              <Col span={10}>
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
                  <UploadOutlined /> Tải Từ Máy Tính 📁
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
            label="Link Google Form Đăng Ký (Cách A)"
            name="registerUrl"
            rules={[{ required: true, message: "Vui lòng nhập link Google Form đăng ký!" }]}
          >
            <Input prefix={<FormOutlined />} placeholder="https://docs.google.com/forms/d/e/.../viewform" />
          </Form.Item>

          <Form.Item
            label="Link Google Form Check-in (Cách B)"
            name="checkinUrl"
            rules={[{ required: true, message: "Vui lòng nhập link Google Form check-in!" }]}
          >
            <Input prefix={<QrcodeOutlined />} placeholder="https://docs.google.com/forms/d/e/.../viewform" />
          </Form.Item>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
            <Button onClick={() => setIsModalOpen(false)}>Hủy</Button>
            <Button type="primary" htmlType="submit" style={{ background: "#0066CC" }}>
              Xác Nhận Lưu Vào MongoDB Database 🚀
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Modal View QR Code */}
      {selectedQrEvent && (
        <Modal
          title="Mã QR Code Điểm Danh Sự Kiện"
          open={!!selectedQrEvent}
          onCancel={() => setSelectedQrEvent(null)}
          footer={[
            <Button key="close" type="primary" onClick={() => setSelectedQrEvent(null)} style={{ background: "#0066CC" }}>
              Đóng
            </Button>,
          ]}
          style={{ textAlign: "center" }}
        >
          <div style={{ padding: "16px 0" }}>
            <Text strong style={{ fontSize: 16, display: "block", marginBottom: 8 }}>
              {selectedQrEvent.title}
            </Text>
            <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 16 }}>
              In mã QR này dán tại Bàn Check-in để sinh viên tự quét bằng Zalo/Camera
            </Text>

            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                selectedQrEvent.checkinUrl
              )}`}
              alt="QR Code"
              style={{ margin: "0 auto", borderRadius: 12, border: "2px solid #e6f4ff", padding: 8 }}
            />

            <div style={{ marginTop: 16 }}>
              <a href={selectedQrEvent.checkinUrl} target="_blank" rel="noreferrer" style={{ color: "#0066CC", fontWeight: 600 }}>
                Link Form Check-in Trực Tiếp ↗
              </a>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
