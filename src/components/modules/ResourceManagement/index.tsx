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
  Popconfirm,
  Row,
  Col,
  type UploadFile,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  FilePdfOutlined,
  LinkOutlined,
  UploadOutlined,
  ReloadOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
} from "@ant-design/icons";
import webStorageClient from "@/utils/webStorageClient";

const { Title, Text, Paragraph } = Typography;
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
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form] = Form.useForm();

  const API_SERVER = process.env.NEXT_PUBLIC_API_SERVER || "http://localhost:5000";

  const authHeaders = (json = false) => {
    const token = webStorageClient.getToken();
    return {
      ...(json ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const resetUpload = () => {
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
    message.success(`Đã chọn "${file.name}". Bấm "Lưu" để hoàn tất.`);
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
      message.error("Lỗi khi tải danh sách tài liệu");
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
          throw new Error(uploadJson.message || "Không thể tải tài liệu lên máy chủ");
        }

        finalFileUrl = uploadJson.data.url;
        finalSize = `${(uploadJson.data.size / (1024 * 1024)).toFixed(2)} MB (${selectedFile.name.split(".").pop()?.toUpperCase()})`;
      } catch (err) {
        setIsSaving(false);
        message.error(err instanceof Error ? err.message : "Lỗi khi tải file lên máy chủ");
        return;
      }
    }

    try {
      setIsSaving(true);
      const res = await fetch(`${API_SERVER}/api/v1/resources`, {
        method: "POST",
        headers: authHeaders(true),
        body: JSON.stringify({
          title: values.title.trim(),
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
      message.success(uploadMode === "file" ? "Đã tải file và lưu tài liệu thành công!" : "Đã lưu đường dẫn tài liệu.");
      setIsModalOpen(false);
      form.resetFields();
      resetUpload();
      fetchResources();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Lỗi khi lưu tài liệu vào Database");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    setDeletingId(id);
    try {
      const res = await fetch(`${API_SERVER}/api/v1/resources/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      const json = await res.json();
      if (res.ok && json.status === "success") {
        message.success("Đã xóa tài liệu thành công!");
        // Update local state immediately
        setResources((prev) => prev.filter((r) => r._id !== id));
      } else {
        throw new Error(json.message || "Lỗi khi xóa tài liệu");
      }
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Lỗi khi xóa tài liệu!");
      fetchResources();
    } finally {
      setDeletingId(null);
    }
  };

  const columns = [
    {
      title: "Tên tài liệu / Slide",
      dataIndex: "title",
      key: "title",
      width: 280,
      render: (text: string, record: ResourceData) => (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, maxWidth: 300 }}>
          <FilePdfOutlined style={{ color: "#0066CC", fontSize: 20, marginTop: 2, flexShrink: 0 }} />
          <div style={{ minWidth: 150 }}>
            <Text strong style={{ fontSize: 13, wordBreak: "break-word" }}>{text}</Text>
            {record.description && (
              <Paragraph ellipsis={{ rows: 1 }} type="secondary" style={{ fontSize: 11, margin: "2px 0 0 0" }}>
                {record.description}
              </Paragraph>
            )}
            <Text type="secondary" style={{ fontSize: 11, color: "#64748B", display: "block" }}>
              Tác giả: {record.author || "FU-DEVER"}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: "Loại tài liệu",
      dataIndex: "type",
      key: "type",
      width: 140,
      render: (type: string) => {
        let color = "blue";
        if (type === "Source Code") color = "green";
        else if (type === "Ebook / PDF") color = "purple";
        else if (type === "Cheatsheet") color = "orange";
        return (
          <Tag color={color} style={{ borderRadius: 6, fontWeight: 600, fontSize: 11 }}>
            {type}
          </Tag>
        );
      },
    },
    {
      title: "Chủ đề",
      dataIndex: "category",
      key: "category",
      width: 160,
      render: (cat: string) => (
        <Tag color="cyan" style={{ borderRadius: 6, fontWeight: 600, fontSize: 11 }}>
          {cat}
        </Tag>
      ),
    },
    {
      title: "Dung lượng / Nguồn",
      dataIndex: "size",
      key: "size",
      width: 140,
      render: (size: string) => (
        <Text style={{ fontSize: 12, color: "#475569", fontWeight: 500 }}>
          {size || "External Link"}
        </Text>
      ),
    },
    {
      title: "Đường dẫn File",
      dataIndex: "fileUrl",
      key: "fileUrl",
      width: 130,
      render: (url: string) => (
        <a
          href={url}
          target="_blank"
          rel="noreferrer noopener"
          style={{ color: "#0066CC", fontWeight: 600, fontSize: 12 }}
        >
          <LinkOutlined /> Xem File ↗
        </a>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 90,
      render: (_: any, record: ResourceData) => (
        <Popconfirm
          title="Xóa tài liệu"
          description={`Bạn có chắc chắn muốn xóa "${record.title}"?`}
          onConfirm={() => handleDelete(record._id)}
          okText="Xóa"
          cancelText="Hủy"
          okButtonProps={{ danger: true, loading: deletingId === record._id }}
        >
          <Button
            danger
            type="text"
            icon={<DeleteOutlined />}
            loading={deletingId === record._id}
            aria-label={`Xóa tài liệu ${record.title}`}
          >
            Xóa
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div style={{ padding: "16px 20px" }}>
      {/* Header Bar */}
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
            <FolderOpenOutlined aria-hidden="true" /> Quản Lý Tài Liệu & Slide Workshop
          </Title>
          <Text type="secondary" style={{ fontSize: "13px" }}>
            Đăng tải tài liệu, Ebook, Slide bài giảng, tự động đồng bộ lên Landing Page.
          </Text>
        </div>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchResources}
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
            Tải Lên Tài Liệu Mới
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
        <Table
          dataSource={resources}
          columns={columns}
          loading={loading}
          pagination={{ pageSize: 8 }}
          scroll={{ x: 880 }}
        />
      </Card>

      {/* Modal Add Resource */}
      <Modal
        title="Tải Lên Tài Liệu / Slide Bài Giảng Mới"
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          resetUpload();
        }}
        footer={null}
        width="min(640px, 95vw)"
        style={{ top: 20 }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddResource}
          initialValues={{
            type: "Slide",
            category: "Web & Frontend",
            author: "Ban Chuyên Môn FU-DEVER",
          }}
        >
          <Form.Item
            label="Tên bài giảng / Tài liệu"
            name="title"
            rules={[{ required: true, message: "Vui lòng nhập tên tài liệu!" }]}
          >
            <Input placeholder="Ví dụ: Slide Workshop Clean Architecture 2026..." />
          </Form.Item>

          <Row gutter={[12, 12]}>
            <Col xs={24} sm={12}>
              <Form.Item label="Loại tài liệu" name="type" rules={[{ required: true }]}>
                <Select>
                  <Option value="Slide">Slide Bài Giảng</Option>
                  <Option value="Source Code">Mã Nguồn Mẫu (GitHub / ZIP)</Option>
                  <Option value="Ebook / PDF">Sách Ebook / File PDF</Option>
                  <Option value="Cheatsheet">Cẩm Nang Cheatsheet</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item label="Chủ đề chuyên môn" name="category" rules={[{ required: true }]}>
                <Select>
                  <Option value="Web & Frontend">Web & Frontend</Option>
                  <Option value="Backend & Architecture">Backend & Architecture</Option>
                  <Option value="Giải Thuật ICPC">Giải Thuật ICPC</Option>
                  <Option value="AI & Data Science">AI & Data Science</Option>
                  <Option value="Cẩm Nang Chung">Cẩm Nang Chung</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Tác giả / Ban chuyên môn biên soạn" name="author">
            <Input placeholder="Ví dụ: Ban Chuyên Môn FU-DEVER, Dev Team..." />
          </Form.Item>

          <Form.Item label="Mô tả tóm tắt nội dung tài liệu" name="description">
            <Input.TextArea rows={2} placeholder="Tóm tắt ngắn gọn giá trị của tài liệu đối với sinh viên..." />
          </Form.Item>

          <Form.Item label="Hình thức tải tài liệu">
            <Radio.Group
              value={uploadMode}
              onChange={(e) => {
                setUploadMode(e.target.value);
                resetUpload();
                form.setFieldValue("fileUrl", undefined);
              }}
            >
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
              extra="Hỗ trợ Google Docs, Google Drive, GitHub, OneDrive và mọi link HTTP(S) công khai."
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
