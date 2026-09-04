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
  Switch,
  Tooltip,
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
  StarFilled,
  StarOutlined,
  FireOutlined,
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
  isFeatured?: boolean;
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

  const fetchBlogs = useCallback(async () => {
    setLoading(true);
    const token = webStorageClient.getToken();
    try {
      // First try /api/v1/blogs/admin/all, fallback to review-queue
      let res = await fetch(`${API_SERVER}/api/v1/blogs/admin/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        res = await fetch(`${API_SERVER}/api/v1/blogs/admin/review-queue`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      const data = await res.json();
      if (res.ok && data.status === "success") {
        setBlogs(data.data || []);
      } else {
        message.error(data.message || "Không thể tải danh sách bài viết");
      }
    } catch (err) {
      message.error("Lỗi kết nối máy chủ API");
    } finally {
      setLoading(false);
    }
  }, [API_SERVER]);

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  useEffect(() => {
    if (!reviewModalVisible) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setReviewModalVisible(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [reviewModalVisible]);

  const handleToggleFeatured = async (record: BlogPost) => {
    const token = webStorageClient.getToken();
    const oldFeatured = Boolean(record.isFeatured);
    const newFeatured = !oldFeatured;

    // Optimistic UI update
    setBlogs((prev) =>
      prev.map((b) => (b._id === record._id ? { ...b, isFeatured: newFeatured } : b))
    );

    try {
      const res = await fetch(`${API_SERVER}/api/v1/blogs/${record._id}/toggle-featured`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      if (res.ok && data.status === "success") {
        message.success(
          newFeatured
            ? `Đã ghim bài viết "${record.title}" lên mục nổi bật!`
            : `Đã bỏ ghim bài viết "${record.title}".`
        );
      } else {
        // Revert on failure
        setBlogs((prev) =>
          prev.map((b) => (b._id === record._id ? { ...b, isFeatured: oldFeatured } : b))
        );
        message.error(data.message || "Không thể cập nhật trạng thái ghim nổi bật");
      }
    } catch (err) {
      setBlogs((prev) =>
        prev.map((b) => (b._id === record._id ? { ...b, isFeatured: oldFeatured } : b))
      );
      message.error("Lỗi kết nối máy chủ");
    }
  };

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
        fetchBlogs();
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
        fetchBlogs();
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
    : filterStatus === "featured"
    ? blogs.filter((b) => b.isFeatured)
    : blogs.filter((b) => b.status === filterStatus);

  const columns = [
    {
      title: "Tiêu đề bài viết",
      dataIndex: "title",
      key: "title",
      render: (title: string, record: BlogPost) => (
        <div>
          <div className="flex items-center gap-1.5">
            {record.isFeatured && (
              <Tag color="gold" className="!mr-1 font-bold text-[10px] inline-flex items-center gap-1">
                <StarFilled /> NỔI BẬT
              </Tag>
            )}
            <Text strong className="text-[#0066CC] hover:underline cursor-pointer">
              {title}
            </Text>
          </div>
          <div className="text-xs text-slate-400 mt-0.5 line-clamp-1">{record.excerpt}</div>
        </div>
      ),
    },
    {
      title: "Ghim nổi bật",
      dataIndex: "isFeatured",
      key: "isFeatured",
      width: 120,
      align: "center" as const,
      render: (isFeatured: boolean, record: BlogPost) => (
        <Tooltip
          title={
            isFeatured
              ? "Đang được ghim trên mục nổi bật Landing Page (Bấm để bỏ ghim)"
              : "Bấm để ghim bài viết này lên mục nổi bật Landing Page"
          }
        >
          <Switch
            checked={Boolean(isFeatured)}
            onChange={() => handleToggleFeatured(record)}
            checkedChildren={<StarFilled className="text-amber-300" />}
            unCheckedChildren={<StarOutlined />}
            className={isFeatured ? "!bg-amber-500" : ""}
          />
        </Tooltip>
      ),
    },
    {
      title: "Tác giả",
      dataIndex: "author",
      key: "author",
      width: 170,
      render: (author: any) => (
        <Space size="small">
          <UserOutlined className="text-blue-500" />
          <span className="font-semibold">{author?.name || "DEVER Member"}</span>
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
      width: 130,
      render: (status: string) => getStatusTag(status),
    },
    {
      title: "Ngày cập nhật",
      dataIndex: "updatedAt",
      key: "updatedAt",
      width: 140,
      render: (date: string) => new Date(date).toLocaleDateString("vi-VN"),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 170,
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
            className="!bg-[#0066CC] !rounded-lg !font-semibold"
          >
            {record.status === "pending_review" ? "Duyệt bài" : "Chi tiết"}
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

  // Quick Metric Counts
  const totalCount = blogs.length;
  const pendingCount = blogs.filter((b) => b.status === "pending_review").length;
  const publishedCount = blogs.filter((b) => b.status === "published").length;
  const featuredCount = blogs.filter((b) => b.isFeatured).length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Title level={3} className="!mb-1 text-slate-900 font-black">
            Quản Lý &amp; Kiểm Duyệt Tech Blog
          </Title>
          <Text type="secondary" className="text-sm">
            Quản lý toàn diện bài viết kỹ thuật: kiểm duyệt bài mới, ghim bài viết tiêu biểu lên trang chủ và theo dõi trạng thái xuất bản.
          </Text>
        </div>
        <Button
          icon={<ReloadOutlined />}
          onClick={fetchBlogs}
          loading={loading}
          className="!rounded-xl !font-bold self-start sm:self-auto"
        >
          Làm mới
        </Button>
      </div>

      {/* Metric Cards Row */}
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Card className="!rounded-2xl !border-slate-200 shadow-2xs hover:border-blue-300 transition-all">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng bài viết</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{totalCount}</div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="!rounded-2xl !border-amber-200 bg-amber-50/40 shadow-2xs">
            <div className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1">
              <ClockCircleOutlined /> Chờ duyệt
            </div>
            <div className="text-2xl font-black text-amber-900 mt-1">{pendingCount}</div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="!rounded-2xl !border-emerald-200 bg-emerald-50/40 shadow-2xs">
            <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
              <CheckCircleOutlined /> Đã xuất bản
            </div>
            <div className="text-2xl font-black text-emerald-900 mt-1">{publishedCount}</div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="!rounded-2xl !border-blue-200 bg-blue-50/40 shadow-2xs">
            <div className="text-xs font-bold text-[#0066CC] uppercase tracking-wider flex items-center gap-1">
              <StarFilled className="text-amber-500" /> Ghim nổi bật
            </div>
            <div className="text-2xl font-black text-[#004C99] mt-1">{featuredCount}</div>
          </Card>
        </Col>
      </Row>

      <Card className="!rounded-3xl !border-blue-100 shadow-sm">
        {/* Status Filter Tabs */}
        <div className="mb-4">
          <Tabs
            activeKey={filterStatus}
            onChange={setFilterStatus}
            items={[
              {
                key: "all",
                label: <span className="font-bold">Tất cả ({blogs.length})</span>,
              },
              {
                key: "pending_review",
                label: (
                  <Badge count={pendingCount} offset={[8, 0]}>
                    <span className="font-bold pr-2 inline-flex items-center gap-1.5">
                      <ClockCircleOutlined style={{ color: "#D97706" }} /> Chờ duyệt
                    </span>
                  </Badge>
                ),
              },
              {
                key: "published",
                label: (
                  <Badge count={publishedCount} offset={[8, 0]} color="#10B981">
                    <span className="font-bold pr-2 inline-flex items-center gap-1.5 text-emerald-700">
                      <CheckCircleOutlined /> Đã xuất bản
                    </span>
                  </Badge>
                ),
              },
              {
                key: "featured",
                label: (
                  <Badge count={featuredCount} offset={[8, 0]} color="#F59E0B">
                    <span className="font-bold pr-2 inline-flex items-center gap-1.5 text-amber-600">
                      <StarFilled /> Nổi bật
                    </span>
                  </Badge>
                ),
              },
              {
                key: "changes_requested",
                label: (
                  <Badge count={blogs.filter((b) => b.status === "changes_requested").length} offset={[8, 0]}>
                    <span className="font-bold pr-2 inline-flex items-center gap-1.5">
                      <ExclamationCircleOutlined style={{ color: "#EA580C" }} /> Cần chỉnh sửa
                    </span>
                  </Badge>
                ),
              },
              {
                key: "draft",
                label: (
                  <span className="font-bold inline-flex items-center gap-1.5">
                    <FileTextOutlined style={{ color: "#64748B" }} /> Bản nháp ({blogs.filter((b) => b.status === "draft").length})
                  </span>
                ),
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
          scroll={{ x: 880 }}
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
        width="min(900px, 95vw)"
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
