"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Alert,
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
import { constants } from "@/settings";
import { useParams } from "next/navigation";
import { useTranslation } from "@/app/i18n/client";

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
  // SLA fields from GET /api/v1/blogs/admin/review-queue (optional for backward compat).
  waitingHours?: number;
  slaOverdue?: boolean;
}

interface ReviewQueueSla {
  thresholdHours: number;
  overdueCount: number;
}

const DEFAULT_SLA_THRESHOLD_HOURS = 72;

export default function BlogManagement() {
  const params = useParams();
  const { t } = useTranslation(params?.locale as string, "blogManagement");
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("pending_review");
  
  // Review Modal state
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState<BlogPost | null>(null);
  const [reviewFeedback, setReviewFeedback] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [togglingFeaturedId, setTogglingFeaturedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState(false);
  // SLA review-queue metadata (optional; absent on /admin/all legacy shape).
  const [slaThresholdHours, setSlaThresholdHours] = useState<number>(DEFAULT_SLA_THRESHOLD_HOURS);
  const [slaOverdueCount, setSlaOverdueCount] = useState<number | null>(null);

  const API_SERVER = constants.API_SERVER;

  const fetchBlogs = useCallback(async () => {
    setLoading(true);
    setFetchError(false);
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
        // Backward compat: review-queue returns { results, sla, data: BlogPost[] };
        // legacy /admin/all returns { data: BlogPost[] } without sla.
        setBlogs(Array.isArray(data.data) ? data.data : []);
        const sla = (data.sla ?? null) as ReviewQueueSla | null;
        if (sla && typeof sla.thresholdHours === "number") {
          setSlaThresholdHours(sla.thresholdHours);
        } else {
          setSlaThresholdHours(DEFAULT_SLA_THRESHOLD_HOURS);
        }
        if (sla && typeof sla.overdueCount === "number") {
          setSlaOverdueCount(sla.overdueCount);
        } else {
          setSlaOverdueCount(null);
        }
      } else {
        setFetchError(true);
        message.error(data.message || t("messages.loadFailed", "Không thể tải danh sách bài viết"));
      }
    } catch (err) {
      setFetchError(true);
      message.error(t("messages.apiConnectionError", "Lỗi kết nối máy chủ API"));
    } finally {
      setLoading(false);
    }
  }, [API_SERVER, t]);

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
    if (!record?._id || togglingFeaturedId) {
      return;
    }
    setTogglingFeaturedId(record._id);
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
            ? t("messages.featuredPinned", `Đã ghim bài viết "${record.title}" lên mục nổi bật!`, { title: record.title })
            : t("messages.featuredUnpinned", `Đã bỏ ghim bài viết "${record.title}".`, { title: record.title })
        );
      } else {
        // Revert on failure
        setBlogs((prev) =>
          prev.map((b) => (b._id === record._id ? { ...b, isFeatured: oldFeatured } : b))
        );
        message.error(data.message || t("messages.featuredUpdateFailed", "Không thể cập nhật trạng thái ghim nổi bật"));
      }
    } catch (err) {
      setBlogs((prev) =>
        prev.map((b) => (b._id === record._id ? { ...b, isFeatured: oldFeatured } : b))
      );
      message.error(t("messages.serverConnectionError", "Lỗi kết nối máy chủ"));
    } finally {
      setTogglingFeaturedId(null);
    }
  };

  const handleReviewAction = async (status: "published" | "changes_requested" | "rejected") => {
    if (!selectedBlog) return;
    if ((status === "changes_requested" || status === "rejected") && !reviewFeedback.trim()) {
      message.warning(t("messages.reviewFeedbackRequired", "Vui lòng nhập lời nhận xét/lý do để tác giả biết cần chỉnh sửa gì."));
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
            ? t("messages.reviewPublished", "Đã duyệt và xuất bản bài viết thành công!")
            : t("messages.reviewFeedbackSent", "Đã phản hồi ý kiến cho tác giả bài viết.")
        );
        setReviewModalVisible(false);
        setSelectedBlog(null);
        setReviewFeedback("");
        fetchBlogs();
      } else {
        message.error(json.message || t("messages.reviewFailed", "Lỗi khi xử lý duyệt bài"));
      }
    } catch (e) {
      message.error(t("messages.serverConnectionError", "Lỗi kết nối máy chủ"));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteBlog = async (id: string) => {
    if (!id || deletingId) return;
    setDeletingId(id);
    const token = webStorageClient.getToken();
    try {
      const res = await fetch(`${API_SERVER}/api/v1/blogs/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        message.success(t("messages.deleteSuccess", "Đã xóa bài viết."));
        fetchBlogs();
      } else {
        message.error(t("messages.deleteFailed", "Không thể xóa bài viết"));
      }
    } catch (e) {
      message.error(t("messages.connectionError", "Lỗi kết nối"));
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusTag = (status: string) => {
    switch (status) {
      case "published":
        return <Tag color="success">{t("status.published", "Đã xuất bản")}</Tag>;
      case "pending_review":
        return <Tag color="processing">{t("status.pending_review", "Chờ duyệt")}</Tag>;
      case "changes_requested":
        return <Tag color="warning">{t("status.changes_requested", "Yêu cầu sửa")}</Tag>;
      case "rejected":
        return <Tag color="error">{t("status.rejected", "Từ chối")}</Tag>;
      default:
        return <Tag color="default">{t("status.draft", "Bản nháp")}</Tag>;
    }
  };

  // SLA labels localized via blogManagement namespace (vi fallback).
  const isSlaOverdue = useCallback(
    (blog: BlogPost) => {
      if (typeof blog.slaOverdue === "boolean") return blog.slaOverdue;
      if (typeof blog.waitingHours === "number") return blog.waitingHours > slaThresholdHours;
      return false;
    },
    [slaThresholdHours]
  );

  // Duration format localized via blogManagement namespace (vi fallback).
  const formatWaitingHours = useCallback((hours: number) => {
    const rounded = Math.max(0, Math.floor(hours));
    if (rounded < 24) return t("sla.hours", `${rounded} giờ`, { count: rounded });
    const days = Math.floor(rounded / 24);
    const remainder = rounded % 24;
    if (remainder === 0) return t("sla.days", `${days} ngày`, { count: days });
    return t("sla.daysHours", `${days} ngày ${remainder} giờ`, { days, hours: remainder });
  }, [t]);

  const overdueBlogs = useMemo(
    () => blogs.filter((b) => b.status === "pending_review" && isSlaOverdue(b)),
    [blogs, isSlaOverdue]
  );
  // Prefer server sla.overdueCount; fallback to client count when review-queue shape is absent.
  const overdueCount = slaOverdueCount ?? overdueBlogs.length;

  const longestWaitingBlog = useMemo(() => {
    let longest: BlogPost | null = null;
    for (const blog of blogs) {
      if (blog.status !== "pending_review" || typeof blog.waitingHours !== "number") continue;
      if (!longest || (blog.waitingHours ?? -1) > (longest.waitingHours ?? -1)) {
        longest = blog;
      }
    }
    return longest;
  }, [blogs]);

  const filteredBlogs = useMemo(() => {
    const base =
      filterStatus === "all"
        ? blogs
        : filterStatus === "featured"
          ? blogs.filter((b) => b.isFeatured)
          : filterStatus === "overdue"
            ? blogs.filter((b) => b.status === "pending_review" && isSlaOverdue(b))
            : blogs.filter((b) => b.status === filterStatus);
    // Default order: overdue first, then longest waiting. AntD sorter on the
    // "Chờ duyệt" column takes over once the user changes sorting.
    return [...base].sort((a, b) => {
      const overdueDiff = Number(isSlaOverdue(b)) - Number(isSlaOverdue(a));
      if (overdueDiff !== 0) return overdueDiff;
      return (b.waitingHours ?? -1) - (a.waitingHours ?? -1);
    });
  }, [blogs, filterStatus, isSlaOverdue]);

  const columns = [
    {
      title: t("table.title", "Tiêu đề bài viết"),
      dataIndex: "title",
      key: "title",
      render: (title: string, record: BlogPost) => (
        <div>
          <div className="flex items-center gap-1.5">
            {record.isFeatured && (
              <Tag color="gold" className="!mr-1 font-bold text-[10px] inline-flex items-center gap-1">
                <StarFilled /> {t("featured.tag", "NỔI BẬT")}
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
      title: t("table.featured", "Ghim nổi bật"),
      dataIndex: "isFeatured",
      key: "isFeatured",
      width: 120,
      align: "center" as const,
      render: (isFeatured: boolean, record: BlogPost) => (
        <Tooltip
          title={
            isFeatured
              ? t("featured.tooltipPinned", "Đang được ghim trên mục nổi bật Landing Page (Bấm để bỏ ghim)")
              : t("featured.tooltipUnpinned", "Bấm để ghim bài viết này lên mục nổi bật Landing Page")
          }
        >
          <Switch
            checked={Boolean(isFeatured)}
            loading={togglingFeaturedId === record._id}
            disabled={togglingFeaturedId !== null && togglingFeaturedId !== record._id}
            onChange={() => handleToggleFeatured(record)}
            aria-label={isFeatured ? t("featured.unpinAria", "Bỏ ghim khỏi nổi bật") : t("featured.pinAria", "Ghim lên nổi bật")}
            checkedChildren={<StarFilled className="text-amber-300" />}
            unCheckedChildren={<StarOutlined />}
            className={isFeatured ? "!bg-amber-500" : ""}
          />
        </Tooltip>
      ),
    },
    {
      title: t("table.author", "Tác giả"),
      dataIndex: "author",
      key: "author",
      width: 170,
      render: (author: any) => (
        <Space size="small">
          <UserOutlined className="text-blue-500" />
          <span className="font-semibold">{author?.name || t("table.authorFallback", "DEVER Member")}</span>
        </Space>
      ),
    },
    {
      title: t("table.category", "Chuyên mục"),
      dataIndex: "category",
      key: "category",
      width: 150,
      render: (cat: string) => <Tag color="geekblue">{cat}</Tag>,
    },
    {
      title: t("table.status", "Trạng thái"),
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (status: string) => getStatusTag(status),
    },
    {
      title: t("sla.waitingColumn", "Chờ duyệt"),
      dataIndex: "waitingHours",
      key: "waitingHours",
      width: 170,
      defaultSortOrder: "descend" as const,
      sorter: (a: BlogPost, b: BlogPost) => {
        const overdueDiff = Number(isSlaOverdue(a)) - Number(isSlaOverdue(b));
        if (overdueDiff !== 0) return overdueDiff;
        return (a.waitingHours ?? -1) - (b.waitingHours ?? -1);
      },
      render: (_: unknown, record: BlogPost) => {
        if (typeof record.waitingHours !== "number") {
          return <Text type="secondary">—</Text>;
        }
        const overdue = isSlaOverdue(record);
        return (
          <Space size={4} wrap>
            <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
              <ClockCircleOutlined className={overdue ? "text-red-500" : "text-slate-400"} />
              {formatWaitingHours(record.waitingHours)}
            </span>
            {overdue && <Tag color="error">{t("sla.overdueTag", `Quá ${slaThresholdHours}h`, { hours: slaThresholdHours })}</Tag>}
          </Space>
        );
      },
    },
    {
      title: t("table.updatedAt", "Ngày cập nhật"),
      dataIndex: "updatedAt",
      key: "updatedAt",
      width: 140,
      sorter: (a: BlogPost, b: BlogPost) =>
        new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
      render: (date: string) => new Date(date).toLocaleDateString("vi-VN"),
    },
    {
      title: t("table.actions", "Thao tác"),
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
            {record.status === "pending_review" ? t("actions.review", "Duyệt bài") : t("actions.detail", "Chi tiết")}
          </Button>
          <Popconfirm
            title={t("delete.confirmTitle", "Xác nhận xóa bài viết này?")}
            onConfirm={() => handleDeleteBlog(record._id)}
            okText={t("delete.confirmOk", "Xóa")}
            cancelText={t("delete.cancel", "Hủy")}
            okButtonProps={{ danger: true, loading: deletingId === record._id }}
          >
            <Button size="small" danger icon={<DeleteOutlined />} className="!rounded-lg" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Quick Metric Counts (honest on fetch failure: Alert + "—" instead of misleading 0,
  // same pattern as ExecutiveAnalytics unavailable + AuditFunnel partial warning).
  const totalCount = blogs.length;
  const pendingCount = blogs.filter((b) => b.status === "pending_review").length;
  const publishedCount = blogs.filter((b) => b.status === "published").length;
  const featuredCount = blogs.filter((b) => b.isFeatured).length;
  const metricDisplay = (value: number) => (fetchError && !loading ? "—" : value);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Title level={3} className="!mb-1 text-slate-900 font-black">
            {t("title", "Quản Lý & Kiểm Duyệt Tech Blog")}
          </Title>
          <Text type="secondary" className="text-sm">
            {t("subtitle", "Quản lý toàn diện bài viết kỹ thuật: kiểm duyệt bài mới, ghim bài viết tiêu biểu lên trang chủ và theo dõi trạng thái xuất bản.")}
          {longestWaitingBlog && typeof longestWaitingBlog.waitingHours === "number" ? (
            <Text type="secondary" className="mt-1 block text-sm">
              {t("sla.longestWaiting", "Bài chờ lâu nhất:")} <Text strong>{longestWaitingBlog.title}</Text> —{" "}
              {formatWaitingHours(longestWaitingBlog.waitingHours)}
              {isSlaOverdue(longestWaitingBlog) && (
                <Tag color="error" className="ml-2">
                  {t("sla.overdueTag", `Quá ${slaThresholdHours}h`, { hours: slaThresholdHours })}
                </Tag>
              )}
            </Text>
          ) : pendingCount > 0 ? (
            <Text type="secondary" className="mt-1 block text-sm">
              {t("sla.pendingCount", `Có ${pendingCount} bài đang chờ duyệt.`, { count: pendingCount })}
            </Text>
          ) : null}
          </Text>
        </div>
        <Button
          icon={<ReloadOutlined />}
          onClick={fetchBlogs}
          loading={loading}
          className="!rounded-xl !font-bold self-start sm:self-auto"
        >
          {t("refresh", "Làm mới")}
        </Button>
      </div>

      {/* Metric Cards Row (fetchError → "—", never misleading 0) */}
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Card className="!rounded-2xl !border-slate-200 shadow-2xs hover:border-blue-300 transition-all">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t("metrics.total", "Tổng bài viết")}</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{metricDisplay(totalCount)}</div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="!rounded-2xl !border-amber-200 bg-amber-50/40 shadow-2xs">
            <div className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1">
              <ClockCircleOutlined /> {t("metrics.pending", "Chờ duyệt")}
            </div>
            <div className="text-2xl font-black text-amber-900 mt-1">{metricDisplay(pendingCount)}</div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="!rounded-2xl !border-emerald-200 bg-emerald-50/40 shadow-2xs">
            <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
              <CheckCircleOutlined /> {t("metrics.published", "Đã xuất bản")}
            </div>
            <div className="text-2xl font-black text-emerald-900 mt-1">{metricDisplay(publishedCount)}</div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="!rounded-2xl !border-blue-200 bg-blue-50/40 shadow-2xs">
            <div className="text-xs font-bold text-[#0066CC] uppercase tracking-wider flex items-center gap-1">
              <StarFilled className="text-amber-500" /> {t("metrics.featured", "Ghim nổi bật")}
            </div>
            <div className="text-2xl font-black text-[#004C99] mt-1">{metricDisplay(featuredCount)}</div>
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
                label: <span className="font-bold">{fetchError && !loading ? t("tabs.allWithCount", "Tất cả (—)", { count: "—" as unknown as number }) : t("tabs.allWithCount", `Tất cả (${blogs.length})`, { count: blogs.length })}</span>,
              },
              {
                key: "pending_review",
                label: (
                  <Badge count={fetchError && !loading ? 0 : pendingCount} showZero={!fetchError} offset={[8, 0]}>
                    <span className="font-bold pr-2 inline-flex items-center gap-1.5">
                      <ClockCircleOutlined style={{ color: "#D97706" }} /> {t("tabs.pending", "Chờ duyệt")}{fetchError && !loading ? " (—)" : ""}
                    </span>
                  </Badge>
                ),
              },
              {
                key: "overdue",
                label: (
                  <Badge count={fetchError && !loading ? 0 : overdueCount} showZero={!fetchError} offset={[8, 0]} color="#DC2626">
                    <span className="font-bold pr-2 inline-flex items-center gap-1.5 text-red-600">
                      <ExclamationCircleOutlined /> {fetchError && !loading ? t("sla.overdueTabWithCount", "Quá hạn (—)", { count: "—" as unknown as number }) : t("sla.overdueTabWithCount", `Quá hạn (${overdueCount})`, { count: overdueCount })}
                    </span>
                  </Badge>
                ),
              },
              {
                key: "published",
                label: (
                  <Badge count={fetchError && !loading ? 0 : publishedCount} showZero={!fetchError} offset={[8, 0]} color="#10B981">
                    <span className="font-bold pr-2 inline-flex items-center gap-1.5 text-emerald-700">
                      <CheckCircleOutlined /> {t("tabs.published", "Đã xuất bản")}
                    </span>
                  </Badge>
                ),
              },
              {
                key: "featured",
                label: (
                  <Badge count={fetchError && !loading ? 0 : featuredCount} showZero={!fetchError} offset={[8, 0]} color="#F59E0B">
                    <span className="font-bold pr-2 inline-flex items-center gap-1.5 text-amber-600">
                      <StarFilled /> {t("tabs.featured", "Nổi bật")}
                    </span>
                  </Badge>
                ),
              },
              {
                key: "changes_requested",
                label: (
                  <Badge count={fetchError && !loading ? 0 : blogs.filter((b) => b.status === "changes_requested").length} showZero={!fetchError} offset={[8, 0]}>
                    <span className="font-bold pr-2 inline-flex items-center gap-1.5">
                      <ExclamationCircleOutlined style={{ color: "#EA580C" }} /> {t("tabs.changesRequested", "Cần chỉnh sửa")}
                    </span>
                  </Badge>
                ),
              },
              {
                key: "draft",
                label: (
                  <span className="font-bold inline-flex items-center gap-1.5">
                    <FileTextOutlined style={{ color: "#64748B" }} /> {fetchError && !loading ? t("tabs.draftWithCount", "Bản nháp (—)", { count: "—" as unknown as number }) : t("tabs.draftWithCount", `Bản nháp (${blogs.filter((b) => b.status === "draft").length})`, { count: blogs.filter((b) => b.status === "draft").length })}
                  </span>
                ),
              },
            ]}
          />
        </div>

        {fetchError && !loading && (
          <Alert
            type="error"
            showIcon
            message={t("error.title", "Không thể tải danh sách bài viết")}
            description={t("error.desc", "Vui lòng kiểm tra kết nối và thử lại.")}
            action={
              <Button size="small" danger onClick={fetchBlogs}>
                {t("error.retry", "Thử lại")}
              </Button>
            }
            style={{ marginBottom: 16 }}
          />
        )}
        <Table
          dataSource={filteredBlogs}
          columns={columns}
          rowKey="_id"
          loading={loading}
          // Client-side slice: toàn bộ blogs đã tải về client; showSizeChanger chỉ đổi pageSize hiển thị, không phân trang server.
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => t("table.totalWithCount", `Tổng cộng ${total} bài viết`, { total }),
          }}
          scroll={{ x: 880 }}
          className="dever-admin-table"
          locale={{ emptyText: <Empty description={t("table.empty", "Chưa có bài viết nào")} /> }}
        />
      </Card>

      {/* Review Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-lg font-black text-[#0066CC]">
            <FileTextOutlined /> {t("modal.title", "Đánh Giá Bài Viết & Phản Hồi Tác Giả")}
          </div>
        }
        open={reviewModalVisible}
        onCancel={() => setReviewModalVisible(false)}
        width="min(900px, 95vw)"
        centered
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
                <span><strong>{t("modal.authorLabel", "Tác giả:")}</strong> {selectedBlog.author?.name} ({selectedBlog.author?.role})</span>
                <span><strong>{t("modal.durationLabel", "Thời lượng:")}</strong> {selectedBlog.readTime || t("modal.defaultReadTime", "5 phút")}</span>
              </div>
            </div>

            {/* Markdown Content Preview */}
            <div>
              <Text strong className="text-slate-800 block mb-2 text-xs uppercase tracking-wider">
                {t("modal.contentLabel", "Nội dung bài viết (Markdown Preview):")}
              </Text>
              <div className="p-5 rounded-2xl border border-slate-200 bg-white max-h-[300px] overflow-y-auto font-mono text-xs leading-relaxed whitespace-pre-wrap text-slate-800">
                {selectedBlog.content || t("modal.emptyContent", "Bài viết chưa có nội dung.")}
              </div>
            </div>

            {/* Feedback / Review Notes Input */}
            <div>
              <Text strong className="text-slate-800 block mb-2 text-xs uppercase tracking-wider">
                {t("modal.feedbackLabel", "Lời nhắn góp ý / Lý do yêu cầu sửa đổi (Review Notes):")}
              </Text>
              <TextArea
                rows={3}
                value={reviewFeedback}
                onChange={(e) => setReviewFeedback(e.target.value)}
                placeholder={t("modal.feedbackPlaceholder", "Nhập nhận xét cụ thể để tác giả chỉnh sửa (ví dụ: 'Bài viết tốt nhưng cần bổ sung thêm giải thích phần code xử lý JWT...')")}
                className="!rounded-xl text-sm"
              />
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <Button onClick={() => setReviewModalVisible(false)} className="!rounded-xl" style={{ minHeight: 44 }}>
                {t("modal.close", "Đóng")}
              </Button>

              <Space>
                <Button
                  danger
                  loading={actionLoading}
                  onClick={() => handleReviewAction("rejected")}
                  className="!rounded-xl !font-semibold"
                  style={{ minHeight: 44 }}
                >
                  {t("modal.reject", "Từ chối")}
                </Button>

                <Button
                  loading={actionLoading}
                  onClick={() => handleReviewAction("changes_requested")}
                  className="!rounded-xl !font-bold !bg-amber-500 !text-white !border-0 hover:!bg-amber-600"
                  style={{ minHeight: 44 }}
                >
                  {t("modal.requestChanges", "Yêu cầu chỉnh sửa")}
                </Button>

                <Button
                  type="primary"
                  loading={actionLoading}
                  icon={<CheckCircleOutlined />}
                  onClick={() => handleReviewAction("published")}
                  className="!rounded-xl !font-bold !bg-emerald-600 hover:!bg-emerald-700 !border-0 shadow-md"
                  style={{ minHeight: 44 }}
                >
                  {t("modal.approvePublish", "Duyệt & Xuất Bản Ngay")}
                </Button>
              </Space>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
