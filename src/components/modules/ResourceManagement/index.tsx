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
  type UploadFile,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  FilePdfOutlined,
  LinkOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import webStorageClient from "@/utils/webStorageClient";

const { Title, Text } = Typography;
const { Option } = Select;

interface ResourceData {
  _id?: string;
  key?: string;
  title: string;
  type: "Slide" | "Source Code" | "Ebook / PDF" | "Cheatsheet" | string;
  category: "Web & Frontend" | "Backend & Architecture" | "Giải Thuật ICPC" | "AI & Data Science" | "Cẩm Nang Chung" | string;
  author?: string;
  description?: string;
  fileUrl: string;
  size: string;
  createdAt?: string;
}

export default function ResourceManagementModule() {
  const [resources, setResources] = useState<ResourceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadMode, setUploadMode] = useState<"link" | "file">("link");
  const [localFileData, setLocalFileData] = useState<string | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [form] = Form.useForm();

  const API_SERVER = process.env.NEXT_PUBLIC_API_SERVER || "http://localhost:5000";

  const authHeaders = (json = false) => {
    const token = webStorageClient.getToken();
    return {
      ...(json ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const resetUpload = () => {
    setLocalFileData(null);
    setSelectedFile(null);
    setFileList([]);
  };

  const handleCustomFileUpload = (file: File) => {
    if (file.size > 30 * 1024 * 1024) {
      message.error("File quá lớn. Vui lòng chọn tài liệu không quá 30 MB.");
      return Upload.LIST_IGNORE;
    }
    const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
    const ext = file.name.split(".").pop()?.toUpperCase() || "FILE";
    form.setFieldsValue({
      size: `${sizeMb} MB (${ext})`,
      title: form.getFieldValue("title") || file.name.replace(/\.[^/.]+$/, ""),
    });
    setSelectedFile(file);
    setFileList([{ uid: `${file.name}-${file.lastModified}`, name: file.name, status: "done", size: file.size, type: file.type }]);
    message.success(`Đã chọn "${file.name}". File sẽ được tải lên Cloudflare R2.`);
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
    let finalFileUrl = typeof values.fileUrl === "string" ? values.fileUrl.trim() : "";
    let finalSize = values.size || (uploadMode === "link" ? "External link" : "Tài liệu");

    if (uploadMode === "file") {
      if (!selectedFile) {
        message.error("Vui lòng chọn file từ máy trước khi lưu.");
        return;
      }
      try {
        setIsSaving(true);
        const token = webStorageClient.getToken();
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("folder", "resources");

        const uploadRes = await fetch(`${API_SERVER}/api/v1/upload/document`, {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        });

        const uploadJson = await uploadRes.json();
        if (!uploadRes.ok || uploadJson.status !== "success") {
          throw new Error(uploadJson.message || "Không thể tải tài liệu lên Cloudflare R2");
        }

        finalFileUrl = uploadJson.data.url;
        finalSize = `${(uploadJson.data.size / (1024 * 1024)).toFixed(2)} MB (${selectedFile.name.split(".").pop()?.toUpperCase()})`;
      } catch (err) {
        setIsSaving(false);
        message.error(err instanceof Error ? err.message : "Lỗi khi tải file lên Cloudflare R2");
        return;
      }
    }

    try {
      setIsSaving(true);
      const res = await fetch(`${API_SERVER}/api/v1/resources`, {
        method: "POST",
        headers: authHeaders(true),
        body: JSON.stringify({
          title: values.title,
          type: values.type,
          category: values.category,
          author: values.author || "Ban Chuyên Môn FU-DEVER",
          description: values.description || "",
          fileUrl: finalFileUrl,
          size: finalSize,
        }),
      });
      const json = await res.json();
      if (!res.ok || json.status !== "success") {
        throw new Error(json.message || "Không thể lưu tài liệu");
      }
      message.success(uploadMode === "file" ? "Đã tải file lên Cloudflare R2 và lưu tài liệu thành công!" : "Đã lưu đường dẫn tài liệu.");
      setIsModalOpen(false);
      form.resetFields();
      resetUpload();
      fetchResources();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Lỗi khi lưu tài liệu vào MongoDB");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    try {
      const res = await fetch(`${API_SERVER}/api/v1/resources/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
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
        onCancel={() => {
          setIsModalOpen(false);
          resetUpload();
        }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleAddResource} initialValues={{ type: "Slide", category: "Web & Frontend", author: "Ban Chuyên Môn FU-DEVER" }}>
          <Form.Item label="Tên bài giảng / Tài liệu" name="title" rules={[{ required: true, message: "Vui lòng nhập tên tài liệu!" }]}>
            <Input placeholder="Ví dụ: Slide Workshop Clean Architecture 2026..." />
          </Form.Item>

          <Form.Item label="Tác giả / Ban chuyên môn biên soạn" name="author">
            <Input placeholder="Ví dụ: Ban Chuyên Môn FU-DEVER, Dev Team..." />
          </Form.Item>

          <Form.Item label="Mô tả tóm tắt nội dung tài liệu" name="description">
            <Input.TextArea rows={2} placeholder="Tóm tắt ngắn gọn giá trị của tài liệu đối với sinh viên..." />
          </Form.Item>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Form.Item label="Loại tài liệu" name="type" rules={[{ required: true }]}>
              <Select>
                <Option value="Slide">Slide Bài Giảng</Option>
                <Option value="Source Code">Mã Nguồn Mẫu (GitHub / ZIP)</Option>
                <Option value="Ebook / PDF">Sách Ebook / File PDF</Option>
                <Option value="Cheatsheet">Cẩm Nang Cheatsheet</Option>
              </Select>
            </Form.Item>

            <Form.Item label="Chủ đề chuyên môn" name="category" rules={[{ required: true }]}>
              <Select>
                <Option value="Web & Frontend">Web & Frontend</Option>
                <Option value="Backend & Architecture">Backend & Architecture</Option>
                <Option value="Giải Thuật ICPC">Giải Thuật ICPC</Option>
                <Option value="AI & Data Science">AI & Data Science</Option>
                <Option value="Cẩm Nang Chung">Cẩm Nang Chung</Option>
              </Select>
            </Form.Item>
          </div>

          <Form.Item label="Hình thức tải tài liệu">
            <Radio.Group value={uploadMode} onChange={(e) => {
              setUploadMode(e.target.value);
              resetUpload();
              form.setFieldValue("fileUrl", undefined);
            }}>
              <Radio.Button value="link"><LinkOutlined /> Dán link (Google Docs/Drive/GitHub)</Radio.Button>
              <Radio.Button value="file"><UploadOutlined /> Tải File Trực Tiếp Từ Máy</Radio.Button>
            </Radio.Group>
          </Form.Item>

          {uploadMode === "file" ? (
            <Form.Item label="Chọn File Từ Máy Tính (PDF, ZIP, PPTX, DOCX)">
              <Upload
                beforeUpload={handleCustomFileUpload}
                maxCount={1}
                accept=".pdf,.zip,.ppt,.pptx,.doc,.docx,.xlsx,.csv,.txt"
                fileList={fileList}
                onRemove={() => { resetUpload(); return true; }}
              >
                <Button icon={<UploadOutlined />} style={{ borderRadius: 8 }}>
                  Bấm Chọn File Upload Từ Máy
                </Button>
              </Upload>
            </Form.Item>
          ) : null}

          {uploadMode === "link" && (
            <Form.Item
              label="Đường dẫn tài liệu"
              name="fileUrl"
              rules={[
                { required: true, message: "Vui lòng dán link tài liệu." },
                { type: "url", message: "Link phải bắt đầu bằng http:// hoặc https://" },
              ]}
              extra="Hỗ trợ Google Docs, Google Drive, GitHub, OneDrive và mọi link HTTP(S) có thể mở công khai."
            >
              <Input prefix={<LinkOutlined />} placeholder="https://docs.google.com/document/d/..." />
            </Form.Item>
          )}

          <Form.Item label="Dung lượng file / Nguồn" name="size">
            <Input placeholder="Ví dụ: 12.5 MB (PDF) hoặc Google Drive Link" />
          </Form.Item>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
            <Button onClick={() => setIsModalOpen(false)} disabled={isSaving}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={isSaving} style={{ background: "#0066CC" }}>
              {uploadMode === "file" ? "Tải lên và lưu" : "Lưu đường dẫn"}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
