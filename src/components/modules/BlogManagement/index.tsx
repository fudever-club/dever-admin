"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  Card,
  Tag,
  Button,
  Space,
  Modal,
  Input,
  Typography,
  message,
  Tabs,
  Badge,
  Descriptions,
  Popconfirm,
  Skeleton,
  Empty,
  Row,
  Col,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  ReloadOutlined,
  FileTextOutlined,
  DeleteOutlined,
  UserOutlined,
  ClockCircleOutlined,
  SendOutlined,
} from "@ant-design/icons";
import webStorageClient from "@/utils/webStorageClient";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  content: string;
  status: "published" | "draft" | "pending_review" | "changes_requested" | "rejected";
  author?: {
    name: string;
    role: string;
    avatar: string;
  };
  tags?: string[];
  readTime?: string;
  likes?: number;
  reviewNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export default function BlogManagement() {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("pending_review");
  
  // Review Modal state
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState<BlogPost | null>(null);
  const [reviewFeedback, setReviewFeedback] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const API_SERVER =
    process.env.NEXT_PUBLIC_API_SERVER ||
    "https://dever-backend-production.up.railway.app";

  const fetchReviewQueue = useCallback(async () => {
    setLoading(true);
    const token = webStorageClient.getToken();
    try {
      const res = await fetch(`${API_SERVER}/api/v1/blogs/admin/review-queue`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.status === "success") {
        setBlogs(data.data || []);
      } else {
        message.error(data.message || "Không thể tải hàng đợi duyệt bài");
      }
    } catch (err) {
      message.error("Lỗi kết nối máy chủ API");
    } finally {
      setLoading(false);
    }
  }, [API_SERVER]);

  useEffect(() => {
    fetchReviewQueue();
  }, [fetchReviewQueue]);

  const handleReviewAction = async (status: "published" | "changes_requested" | "rejected") => {
    if (!selectedBlog) return;
    if ((status === "changes_requested" || status === "rejected") && !reviewFeedback.trim()) {
      message.warning("Vui lòng nhập lời nhận xét/lý do để tác giả biết cần chỉnh sửa gì.");
      return;
    }

    setActionLoading(true);
    const token = webStorageClient.getToken();
    try {
      const res = await fetch(`${API_SERVER}/api/v1/blogs/${selectedBlog._id}/review`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status,
          reviewNotes: reviewFeedback,
        }),
      });
      const json = await res.json();
      if (res.ok && json.status === "success") {
        message.success(
          status === "published"
            ? "Đã duyệt và xuất bản bài viết thành công!"
            : "Đã phản hồi ý kiến cho tác giả bài viết."
        );
        setReviewModalVisible(false);
        setSelectedBlog(null);
        setReviewFeedback("");
        fetchReviewQueue();
      } else {
        message.error(json.message || "Lỗi khi xử lý duyệt bài");
      }
    } catch (e) {
      message.error("Lỗi kết nối máy chủ");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteBlog = async (id: string) => {
    const token = webStorageClient.getToken();
    try {
      const res = await fetch(`${API_SERVER}/api/v1/blogs/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        message.success("Đã xóa bài viết.");
        fetchReviewQueue();
      } else {
        message.error("Không thể xóa bài viết");
      }
    } catch (e) {
      message.error("Lỗi kết nối");
    }
  };

  const getStatusTag = (status: string) => {
    switch (status) {
      case "published":
        return <Tag color="success">Đã xuất bản</Tag>;
      case "pending_review":
        return <Tag color="processing">Chờ duyệt</Tag>;
      case "changes_requested":
        return <Tag color="warning">Yêu cầu sửa</Tag>;
      case "rejected":
        return <Tag color="error">Từ chối</Tag>;
      default:
        return <Tag color="default">Bản nháp</Tag>;
    }
  };

  const filteredBlogs = filterStatus === "all"
    ? blogs
    : blogs.filter((b) => b.status === filterStatus);

  const columns = [
    {
      title: "Tiêu đề bài viết",
      dataIndex: "title",
      key: "title",
      render: (title: string, record: BlogPost) => (
        <div>
          <Text strong className="text-[#0066CC]">{title}</Text>
          <div className="text-xs text-slate-400 mt-0.5 line-clamp-1">{record.excerpt}</div>
        </div>
      ),
    },
    {
      title: "Tác giả",
      dataIndex: "author",
      key: "author",
      width: 180,
      render: (author: any) => (
        <Space size="small">
          <UserOutlined className="text-blue-500" />
          <span>{author?.name || "DEVER Member"}</span>
        </Space>
      ),
    },
    {
      title: "Chuyên mục",
      dataIndex: "category",
      key: "category",
      width: 150,
      render: (cat: string) => <Tag color="geekblue">{cat}</Tag>,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 140,
      render: (status: string) => getStatusTag(status),
    },
    {
      title: "Ngày cập nhật",
      dataIndex: "updatedAt",
      key: "updatedAt",
      width: 150,
      render: (date: string) => new Date(date).toLocaleDateString("vi-VN"),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 180,
      render: (_: any, record: BlogPost) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedBlog(record);
              setReviewFeedback(record.reviewNotes || "");
              setReviewModalVisible(true);
            }}
            className="!bg-[#0066CC] !rounded-lg"
          >
            Đánh giá
          </Button>
          <Popconfirm
            title="Xác nhận xóa bài viết này?"
            onConfirm={() => handleDeleteBlog(record._id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button size="small" danger icon={<DeleteOutlined />} className="!rounded-lg" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Title level={3} className="!mb-1 text-slate-900 font-black">
            Hàng Đợi Duyệt &amp; Quản Lý Tech Blog
          </Title>
          <Text type="secondary" className="text-sm">
            Kiểm duyệt bài viết kỹ thuật do thành viên CLB FU-DEVER đóng góp trước khi xuất bản công khai.
          </Text>
        </div>
        <Button
          icon={<ReloadOutlined />}
          onClick={fetchReviewQueue}
          loading={loading}
          className="!rounded-xl !font-bold"
        >
          Làm mới
        </Button>
      </div>

      <Card className="!rounded-3xl !border-blue-100 shadow-sm">
        {/* Status Filter Tabs */}
        <div className="mb-4">
          <Tabs
            activeKey={filterStatus}
            onChange={setFilterStatus}
            items={[
              {
                key: "pending_review",
                label: (
                  <Badge count={blogs.filter((b) => b.status === "pending_review").length} offset={[8, 0]}>
                    <span className="font-bold pr-2">🟡 Chờ duyệt</span>
                  </Badge>
                ),
              },
              {
                key: "changes_requested",
                label: (
                  <Badge count={blogs.filter((b) => b.status === "changes_requested").length} offset={[8, 0]}>
                    <span className="font-bold pr-2">🟠 Cần chỉnh sửa</span>
                  </Badge>
                ),
              },
              {
                key: "draft",
                label: (
                  <span className="font-bold">⚪ Bản nháp</span>
                ),
              },
              {
                key: "all",
                label: <span className="font-bold">Tất cả ({blogs.length})</span>,
              },
            ]}
          />
        </div>

        <Table
          dataSource={filteredBlogs}
          columns={columns}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          className="dever-admin-table"
        />
      </Card>

      {/* Review Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-lg font-black text-[#0066CC]">
            <FileTextOutlined /> Đánh Giá Bài Viết &amp; Phản Hồi Tác Giả
          </div>
        }
        open={reviewModalVisible}
        onCancel={() => setReviewModalVisible(false)}
        width={900}
        footer={null}
        className="!rounded-3xl"
      >
        {selectedBlog && (
          <div className="space-y-6 pt-2">
            {/* Meta info */}
            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-2">
              <div className="flex items-center justify-between">
                <Tag color="geekblue" className="font-bold">{selectedBlog.category}</Tag>
                {getStatusTag(selectedBlog.status)}
              </div>
              <h2 className="text-xl font-black text-slate-900">{selectedBlog.title}</h2>
              <p className="text-xs text-slate-600 font-medium">{selectedBlog.excerpt}</p>
              <div className="flex items-center gap-4 text-xs text-slate-500 pt-2 border-t border-blue-100">
                <span><strong>Tác giả:</strong> {selectedBlog.author?.name} ({selectedBlog.author?.role})</span>
                <span><strong>Thời lượng:</strong> {selectedBlog.readTime || "5 phút"}</span>
              </div>
            </div>

            {/* Markdown Content Preview */}
            <div>
              <Text strong className="text-slate-800 block mb-2 text-xs uppercase tracking-wider">
                Nội dung bài viết (Markdown Preview):
              </Text>
              <div className="p-5 rounded-2xl border border-slate-200 bg-white max-h-[300px] overflow-y-auto font-mono text-xs leading-relaxed whitespace-pre-wrap text-slate-800">
                {selectedBlog.content || "Bài viết chưa có nội dung."}
              </div>
            </div>

            {/* Feedback / Review Notes Input */}
            <div>
              <Text strong className="text-slate-800 block mb-2 text-xs uppercase tracking-wider">
                Lời nhắn góp ý / Lý do yêu cầu sửa đổi (Review Notes):
              </Text>
              <TextArea
                rows={3}
                value={reviewFeedback}
                onChange={(e) => setReviewFeedback(e.target.value)}
                placeholder="Nhập nhận xét cụ thể để tác giả chỉnh sửa (ví dụ: 'Bài viết tốt nhưng cần bổ sung thêm giải thích phần code xử lý JWT...')"
                className="!rounded-xl text-sm"
              />
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <Button onClick={() => setReviewModalVisible(false)} className="!rounded-xl">
                Đóng
              </Button>

              <Space>
                <Button
                  danger
                  loading={actionLoading}
                  onClick={() => handleReviewAction("rejected")}
                  className="!rounded-xl !font-semibold"
                >
                  Từ chối
                </Button>

                <Button
                  loading={actionLoading}
                  onClick={() => handleReviewAction("changes_requested")}
                  className="!rounded-xl !font-bold !bg-amber-500 !text-white !border-0 hover:!bg-amber-600"
                >
                  Yêu cầu chỉnh sửa
                </Button>

                <Button
                  type="primary"
                  loading={actionLoading}
                  icon={<CheckCircleOutlined />}
                  onClick={() => handleReviewAction("published")}
                  className="!rounded-xl !font-bold !bg-emerald-600 hover:!bg-emerald-700 !border-0 shadow-md"
                >
                  Duyệt &amp; Xuất Bản Ngay
                </Button>
              </Space>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
