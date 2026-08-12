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
  Radio,
  Upload,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  FilePdfOutlined,
  LinkOutlined,
  UploadOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;
const { Option } = Select;

interface ResourceData {
  _id?: string;
  key?: string;
  title: string;
  type: "Slide" | "Source Code" | "Ebook / PDF" | string;
  category: "Web Dev" | "Backend" | "Algorithm" | "AI / Data" | string;
  fileUrl: string;
  size: string;
  createdAt?: string;
}

export default function ResourceManagementModule() {
  const [resources, setResources] = useState<ResourceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadMode, setUploadMode] = useState<"link" | "file">("link");
  const [form] = Form.useForm();

  const API_SERVER = process.env.NEXT_PUBLIC_API_SERVER || "http://localhost:5000";

  const handleCustomFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      const ext = file.name.split(".").pop()?.toUpperCase() || "FILE";
      form.setFieldsValue({
        fileUrl: result,
        size: `${sizeMb} MB (${ext})`,
        title: form.getFieldValue("title") || file.name.replace(/\.[^/.]+$/, ""),
      });
      message.success(`Đã chọn file "${file.name}" (${sizeMb} MB) thành công!`);
    };
    reader.readAsDataURL(file);
    return false; // Prevent automatic upload
  };

  const fetchResources = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_SERVER}/api/v1/resources`);
      const json = await res.json();
      if (json.data) {
        setResources(json.data.map((item: any) => ({ ...item, key: item._id })));
      }
    } catch (err) {
      message.error("Lỗi khi tải tài liệu từ MongoDB");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const handleAddResource = async (values: any) => {
    try {
      const res = await fetch(`${API_SERVER}/api/v1/resources`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: values.title,
          type: values.type,
          category: values.category,
          fileUrl: values.fileUrl,
          size: values.size || "Drive Link",
        }),
      });
      const json = await res.json();
      if (json.status === "success") {
        message.success("Đã thêm tài liệu mới thành công.");
        setIsModalOpen(false);
        form.resetFields();
        fetchResources();
      }
    } catch (err) {
      message.error("Lỗi khi lưu tài liệu vào MongoDB");
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    try {
      const res = await fetch(`${API_SERVER}/api/v1/resources/${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.status === "success") {
        message.success("Đã xóa tài liệu khỏi MongoDB!");
        fetchResources();
      }
    } catch (err) {
      message.error("Lỗi khi xóa tài liệu!");
    }
  };

  const columns = [
    {
      title: "Tên tài liệu / Slide",
      dataIndex: "title",
      key: "title",
      render: (text: string, record: ResourceData) => (
        <Space>
          <FilePdfOutlined style={{ color: "#0066CC", fontSize: 18 }} />
          <div>
            <Text strong>{text}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Loại tài liệu",
      dataIndex: "type",
      key: "type",
      render: (type: string) => (
        <Tag color={type === "Slide" ? "blue" : type === "Source Code" ? "green" : "purple"}>
          {type}
        </Tag>
      ),
    },
    {
      title: "Chủ đề",
      dataIndex: "category",
      key: "category",
      render: (cat: string) => <Tag color="cyan">{cat}</Tag>,
    },
    {
      title: "Dung lượng / Nguồn",
      dataIndex: "size",
      key: "size",
    },
    {
      title: "Đường dẫn File",
      dataIndex: "fileUrl",
      key: "fileUrl",
      render: (url: string) => (
        <a href={url} target="_blank" rel="noreferrer" style={{ color: "#0066CC", fontWeight: 600 }}>
          <LinkOutlined /> Xem File ↗
        </a>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_: any, record: ResourceData) => (
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <Title level={3} style={{ margin: 0, color: "#0066CC" }}>
              <FilePdfOutlined aria-hidden="true" /> Quản Lý Tài Liệu & Slide Workshop
            </Title>
            <Text type="secondary">
              Đăng tải tài liệu, Ebook, Slide bài giảng, tự động lưu vào Database MongoDB và hiển thị lên Landing Page.
            </Text>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={() => setIsModalOpen(true)}
            style={{ borderRadius: 10, background: "#0066CC" }}
          >
            Tải Lên Tài Liệu Mới
          </Button>
        </div>

        <Table dataSource={resources} columns={columns} loading={loading} pagination={{ pageSize: 5 }} />
      </Card>

      {/* Modal Add Resource */}
      <Modal
        title="Tải Lên Tài Liệu / Slide Bài Giảng Mới (Lưu MongoDB Database)"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleAddResource} initialValues={{ type: "Slide", category: "Web Dev" }}>
          <Form.Item label="Tên bài giảng / Tài liệu" name="title" rules={[{ required: true, message: "Vui lòng nhập tên tài liệu!" }]}>
            <Input placeholder="Ví dụ: Slide Workshop Clean Architecture 2026..." />
          </Form.Item>

          <Form.Item label="Loại tài liệu" name="type" rules={[{ required: true }]}>
            <Select>
              <Option value="Slide">Slide Bài Giảng</Option>
              <Option value="Source Code">Mẫu Source Code (ZIP / GitHub)</Option>
              <Option value="Ebook / PDF">Sách Ebook / File PDF</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Chủ đề chuyên môn" name="category" rules={[{ required: true }]}>
            <Select>
              <Option value="Web Dev">Web & Frontend</Option>
              <Option value="Backend">Backend & Architecture</Option>
              <Option value="Algorithm">Giải Thuật ICPC</Option>
              <Option value="AI / Data">AI & Data Science</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Hình thức tải tài liệu">
            <Radio.Group value={uploadMode} onChange={(e) => setUploadMode(e.target.value)}>
              <Radio.Button value="link"><LinkOutlined /> Dán Link (Drive/GitHub)</Radio.Button>
              <Radio.Button value="file"><UploadOutlined /> Tải File Trực Tiếp Từ Máy</Radio.Button>
            </Radio.Group>
          </Form.Item>

          {uploadMode === "file" ? (
            <Form.Item label="Chọn File Từ Máy Tính (PDF, ZIP, PPTX, DOCX)">
              <Upload
                beforeUpload={handleCustomFileUpload}
                maxCount={1}
                showUploadList={true}
              >
                <Button icon={<UploadOutlined />} style={{ borderRadius: 8 }}>
                  Bấm Chọn File Upload Từ Máy
                </Button>
              </Upload>
            </Form.Item>
          ) : null}

          <Form.Item label="Đường dẫn File / Dữ liệu Upload" name="fileUrl" rules={[{ required: true, message: "Vui lòng nhập link hoặc tải file từ máy!" }]}>
            <Input prefix={<LinkOutlined />} placeholder="https://drive.google.com/... hoặc dữ liệu file upload" />
          </Form.Item>

          <Form.Item label="Dung lượng file / Nguồn" name="size">
            <Input placeholder="Ví dụ: 12.5 MB (PDF) hoặc Google Drive Link" />
          </Form.Item>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
            <Button onClick={() => setIsModalOpen(false)}>Hủy</Button>
            <Button type="primary" htmlType="submit" style={{ background: "#0066CC" }}>
              Xác nhận lưu tài liệu
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
