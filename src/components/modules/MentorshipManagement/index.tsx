"use client";

import React, { useMemo, useState } from "react";
import {
  Alert,
  App,
  Avatar,
  Badge,
  Button,
  Card,
  Empty,
  Input,
  Popconfirm,
  Radio,
  Skeleton,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
} from "antd";
import {
  AuditOutlined,
  CheckOutlined,
  CloseOutlined,
  ReloadOutlined,
  SearchOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "@/app/i18n/client";
import {
  MentorshipMentor,
  MentorshipRequestItem,
  MentorshipRequestStatus,
  useGetMentorsQuery,
  useListRequestsQuery,
  useReviewRequestMutation,
} from "@/store/queries/mentorshipManagement";

const { Title, Text } = Typography;

type QueueTab = "mentors" | "requests";
type StatusFilter = MentorshipRequestStatus | "all";

function getMentorName(record: MentorshipMentor): string {
  return record.name?.trim() || "—";
}

function getRequesterName(item: MentorshipRequestItem): string {
  const requester = typeof item.requesterId === "object" ? item.requesterId : null;
  const fullName = `${requester?.firstname || ""} ${requester?.lastname || ""}`.trim();
  return fullName || requester?.email?.trim() || "—";
}

function getQueueMentorName(item: MentorshipRequestItem): string {
  const mentor = typeof item.alumniId === "object" ? item.alumniId : null;
  return mentor?.name?.trim() || "—";
}

export default function MentorshipManagement() {
  const { message } = App.useApp();
  const locale = useParams()?.locale as string;
  const { t } = useTranslation(locale, "mentorshipManagement");
  const statusTag: Record<MentorshipRequestStatus, { color: string; label: string }> = {
    pending: { color: "gold", label: t("status.pending", "Chờ duyệt") },
    accepted: { color: "success", label: t("status.accepted", "Đã duyệt") },
    declined: { color: "error", label: t("status.declined", "Đã từ chối") },
  };
  const [activeTab, setActiveTab] = useState<QueueTab>("mentors");
  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const { data, error, isLoading, isFetching, refetch } = useGetMentorsQuery();

  // Badge pending: đếm nhẹ (limit=1, đọc total từ server), luôn tải để badge hiện trên cả tab Mentors.
  const pendingBadge = useListRequestsQuery({ status: "pending", page: 1, limit: 1 });
  const pendingTotal = pendingBadge.data?.total ?? 0;

  const queueParams =
    statusFilter === "all"
      ? { page, limit: pageSize }
      : { status: statusFilter as MentorshipRequestStatus, page, limit: pageSize };
  const queue = useListRequestsQuery(queueParams, { skip: activeTab !== "requests" });
  const [reviewRequest] = useReviewRequestMutation();

  // Backend trả { status, results, data: mentors[] }; defensive như AuditLog.
  const mentors: MentorshipMentor[] = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data.data)) return data.data;
    return [];
  }, [data]);

  const filtered: MentorshipMentor[] = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return mentors;
    return mentors.filter((mentor) => {
      const haystack = [mentor.name, mentor.headline, mentor.workplace, mentor.graduationGen]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const topicHaystack = (mentor.mentoringTopics || []).join(" ").toLowerCase();
      return haystack.includes(keyword) || topicHaystack.includes(keyword);
    });
  }, [mentors, search]);

  const requests: MentorshipRequestItem[] = useMemo(() => {
    if (!queue.data) return [];
    if (Array.isArray(queue.data.data)) return queue.data.data;
    return [];
  }, [queue.data]);
  const queueTotal = queue.data?.total ?? 0;

  const handleRetry = () => {
    if (activeTab === "requests") {
      if (!queue.isFetching) queue.refetch();
    } else if (!isFetching) {
      refetch();
    }
  };

  const handleClearSearch = () => {
    setSearch("");
  };

  const handleReview = async (record: MentorshipRequestItem, status: "accepted" | "declined") => {
    if (!record._id || reviewingId) return;
    setReviewingId(record._id);
    try {
      await reviewRequest({ id: record._id, status }).unwrap();
      message.success(
        status === "accepted"
          ? t("messages.approved", `Đã duyệt kết nối của ${getRequesterName(record)}`, { name: getRequesterName(record) })
          : t("messages.declined", `Đã từ chối kết nối của ${getRequesterName(record)}`, { name: getRequesterName(record) }),
      );
      await queue.refetch();
      await pendingBadge.refetch();
    } catch (err: unknown) {
      const apiMessage =
        typeof err === "object" && err !== null && "data" in err
          ? (err as { data?: { message?: string } }).data?.message
          : undefined;
      message.error(apiMessage || t("messages.reviewFail", "Lỗi khi duyệt yêu cầu"));
    } finally {
      setReviewingId(null);
    }
  };

  const mentorColumns = [
    {
      title: t("mentorTable.mentor", "Mentor"),
      key: "mentor",
      width: 280,
      render: (_: unknown, record: MentorshipMentor) => (
        <Space size={12}>
          <Avatar src={record.avatar || undefined} size={40} style={{ backgroundColor: "#0066CC" }}>
            {getMentorName(record).charAt(0)}
          </Avatar>
          <Space direction="vertical" size={0}>
            <Text strong>{getMentorName(record)}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.headline || "—"}
            </Text>
          </Space>
        </Space>
      ),
    },
    {
      title: t("mentorTable.gen", "Thế hệ"),
      dataIndex: "graduationGen",
      key: "graduationGen",
      width: 120,
      render: (value: string) => <Tag color="blue">{value || t("status.unknownGen", "Chưa rõ")}</Tag>,
    },
    {
      title: t("mentorTable.workplace", "Đơn vị / Công ty"),
      dataIndex: "workplace",
      key: "workplace",
      width: 180,
      render: (value: string) => (
        <Text style={{ fontSize: 13 }}>{value || "—"}</Text>
      ),
    },
    {
      title: t("mentorTable.topics", "Chủ đề cố vấn"),
      dataIndex: "mentoringTopics",
      key: "mentoringTopics",
      render: (value: string[]) => {
        if (!Array.isArray(value) || value.length === 0) {
          return <Text type="secondary" style={{ fontSize: 12 }}>—</Text>;
        }
        return (
          <Space wrap size={[0, 4]}>
            {value.map((topic) => (
              <Tag key={topic} color="cyan">
                {topic}
              </Tag>
            ))}
          </Space>
        );
      },
    },
    {
      title: t("mentorTable.status", "Trạng thái"),
      key: "status",
      width: 150,
      render: () => <Tag color="success">{t("status.open", "Mở kết nối")}</Tag>,
    },
  ];

  const requestColumns = [
    {
      title: t("requestTable.mentee", "Mentee"),
      key: "mentee",
      width: 240,
      render: (_: unknown, record: MentorshipRequestItem) => {
        const requester = typeof record.requesterId === "object" ? record.requesterId : null;
        return (
          <Space direction="vertical" size={0}>
            <Text strong>{getRequesterName(record)}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {requester?.email || "—"}
              {requester?.gen ? ` · ${requester.gen}` : ""}
            </Text>
          </Space>
        );
      },
    },
    {
      title: t("requestTable.mentor", "Mentor"),
      key: "mentor",
      width: 240,
      render: (_: unknown, record: MentorshipRequestItem) => {
        const mentor = typeof record.alumniId === "object" ? record.alumniId : null;
        return (
          <Space size={10}>
            <Avatar src={mentor?.avatar || undefined} size={36} style={{ backgroundColor: "#0066CC" }}>
              {getQueueMentorName(record).charAt(0)}
            </Avatar>
            <Space direction="vertical" size={0}>
              <Text strong style={{ fontSize: 13 }}>{getQueueMentorName(record)}</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {mentor?.headline || mentor?.workplace || "—"}
              </Text>
            </Space>
          </Space>
        );
      },
    },
    {
      title: t("requestTable.topic", "Chủ đề"),
      dataIndex: "topic",
      key: "topic",
      width: 160,
      render: (value: string) => <Tag color="cyan">{value || "—"}</Tag>,
    },
    {
      title: t("requestTable.message", "Lời nhắn"),
      dataIndex: "message",
      key: "message",
      render: (value: string) => (
        <Text type="secondary" ellipsis={{ tooltip: value || "—" }} style={{ maxWidth: 260, fontSize: 13 }}>
          {value || "—"}
        </Text>
      ),
    },
    {
      title: t("requestTable.status", "Trạng thái"),
      dataIndex: "status",
      key: "status",
      width: 140,
      render: (value: MentorshipRequestStatus) => {
        const meta = statusTag[value] || { color: "default", label: value || "—" };
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    {
      title: t("requestTable.sentAt", "Ngày gửi"),
      dataIndex: "createdAt",
      key: "createdAt",
      width: 150,
      render: (value: string) =>
        value ? (
          <Text style={{ fontSize: 12 }}>{new Date(value).toLocaleString("vi-VN")}</Text>
        ) : (
          <Text type="secondary" style={{ fontSize: 12 }}>—</Text>
        ),
    },
    {
      title: t("requestTable.actions", "Thao tác"),
      key: "actions",
      width: 210,
      render: (_: unknown, record: MentorshipRequestItem) => {
        if (record.status !== "pending") {
          return <Text type="secondary" style={{ fontSize: 12 }}>—</Text>;
        }
        const locked = reviewingId !== null;
        return (
          <Space size={6} wrap>
            <Popconfirm
              title={t("approveTitle", "Duyệt yêu cầu kết nối này?")}
              description={t("approveDesc", "Mentee sẽ nhận thông báo mentor đã nhận lời kết nối.")}
              okText={t("approve", "Duyệt")}
              cancelText={t("cancel", "Hủy")}
              okButtonProps={{ style: { backgroundColor: "#52c41a" } }}
              onConfirm={() => handleReview(record, "accepted")}
            >
              <Button
                type="primary"
                size="small"
                icon={<CheckOutlined />}
                loading={reviewingId === record._id}
                disabled={locked}
                style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
              >
                {t("approve", "Duyệt")}
              </Button>
            </Popconfirm>
            <Popconfirm
              title={t("declineTitle", "Từ chối yêu cầu kết nối này?")}
              description={t("declineDesc", "Mentee sẽ nhận thông báo yêu cầu chưa được duyệt.")}
              okText={t("decline", "Từ chối")}
              cancelText={t("cancel", "Hủy")}
              okButtonProps={{ danger: true }}
              onConfirm={() => handleReview(record, "declined")}
            >
              <Button
                size="small"
                danger
                icon={<CloseOutlined />}
                loading={reviewingId === record._id}
                disabled={locked}
              >
                {t("decline", "Từ chối")}
              </Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <div style={{ padding: "24px", maxWidth: 1300, margin: "0 auto", backgroundColor: "#F8FAFC", minHeight: "100vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <Title level={3} style={{ margin: 0, color: "#0F172A", display: "flex", alignItems: "center", gap: 10, fontWeight: 800 }}>
            <TeamOutlined style={{ color: "#0066CC" }} /> {t("title", "Kết nối mentor")}
          </Title>
          <Text type="secondary" style={{ fontSize: 13, marginTop: 4, display: "block" }}>
            {t("subtitle", "Danh sách mentors đang mở kết nối và hàng chờ duyệt — đối soát qua nhật ký kiểm toán.")}
          </Text>
        </div>
        <Space size={8} wrap>
          <Link href={`/${locale}/audit-log`}>
            <Button icon={<AuditOutlined />} style={{ borderRadius: 10, fontWeight: 600, height: 38 }}>
              {t("openAuditLog", "Mở nhật ký kiểm toán")}
            </Button>
          </Link>
          <Button icon={<ReloadOutlined />} onClick={handleRetry} loading={isFetching || queue.isFetching} style={{ borderRadius: 10, fontWeight: 600, height: 38 }}>
            {t("refresh", "Làm mới")}
          </Button>
        </Space>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as QueueTab)}
        items={[
          { key: "mentors", label: t("tabs.mentors", "Mentors") },
          {
            key: "requests",
            label: (
              <Space size={6}>
                <span>{t("tabs.queue", "Hàng chờ")}</span>
                {pendingTotal > 0 && (
                  <Badge
                    count={pendingTotal}
                    overflowCount={99}
                    style={{ backgroundColor: "#faad14" }}
                    title={t("tabs.pendingBadgeTitle", `${pendingTotal} yêu cầu đang chờ duyệt`, { count: pendingTotal })}
                  />
                )}
              </Space>
            ),
          },
        ]}
      />

      {activeTab === "mentors" ? (
        <Card bordered={false} style={{ borderRadius: 20, border: "1px solid #E2E8F0", backgroundColor: "#FFFFFF" }}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16, alignItems: "center" }}>
            <Input
              prefix={<SearchOutlined style={{ color: "#0066CC" }} />}
              placeholder={t("searchPlaceholder", "Tìm tên mentor, công ty, chủ đề...")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 300, borderRadius: 10 }}
              allowClear
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {t("mentorCount", `${filtered.length}/${mentors.length} mentors mở kết nối`, { filtered: filtered.length, total: mentors.length })}
            </Text>
          </div>

          {isLoading ? (
            <Skeleton active paragraph={{ rows: 6 }} />
          ) : error ? (
            <Alert
              type="error"
              showIcon
              message={t("error.mentorsTitle", "Không thể tải danh sách mentors")}
              description={t("error.desc", "Vui lòng kiểm tra kết nối và thử lại.")}
              action={
                <Button size="small" danger onClick={handleRetry} loading={isFetching}>
                  {t("retry", "Thử lại")}
                </Button>
              }
            />
          ) : filtered.length === 0 ? (
            <Empty description={search ? t("empty.searchNoMatch", "Không có mentor nào khớp tìm kiếm hiện tại.") : t("empty.noMentors", "Chưa có mentor nào mở kết nối.")}>
              {search && (
                <Button type="primary" ghost onClick={handleClearSearch}>
                  {t("clearSearch", "Xóa tìm kiếm")}
                </Button>
              )}
            </Empty>
          ) : (
            <Table
              columns={mentorColumns}
              dataSource={filtered}
              rowKey={(record) => record._id}
              loading={isFetching}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                pageSizeOptions: ["10", "20", "50"],
                showTotal: (total) => t("mentorPaginationTotal", `Tổng cộng ${total} mentors`, { total }),
              }}
              scroll={{ x: 900 }}
              style={{ borderRadius: 12, overflow: "hidden" }}
            />
          )}
        </Card>
      ) : (
        <Card bordered={false} style={{ borderRadius: 20, border: "1px solid #E2E8F0", backgroundColor: "#FFFFFF" }}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16, alignItems: "center" }}>
            <Text strong style={{ fontSize: 13, color: "#475569" }}>{t("statusFilterLabel", "Lọc trạng thái:")}</Text>
            <Radio.Group
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as StatusFilter);
                setPage(1);
              }}
              buttonStyle="solid"
            >
              <Radio.Button value="pending">{pendingTotal > 0 ? t("filterPendingWithCount", `Chờ duyệt (${pendingTotal})`, { count: pendingTotal }) : t("filterPending", "Chờ duyệt")}</Radio.Button>
              <Radio.Button value="accepted">{t("filterAccepted", "Đã duyệt")}</Radio.Button>
              <Radio.Button value="declined">{t("filterDeclined", "Đã từ chối")}</Radio.Button>
              <Radio.Button value="all">{t("filterAll", "Tất cả")}</Radio.Button>
            </Radio.Group>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {t("queueCount", `${queueTotal} yêu cầu`, { count: queueTotal })}
            </Text>
          </div>

          {queue.isLoading ? (
            <Skeleton active paragraph={{ rows: 6 }} />
          ) : queue.error ? (
            <Alert
              type="error"
              showIcon
              message={t("error.queueTitle", "Không thể tải hàng chờ mentorship")}
              description={t("error.desc", "Vui lòng kiểm tra kết nối và thử lại.")}
              action={
                <Button size="small" danger onClick={handleRetry} loading={queue.isFetching}>
                  {t("retry", "Thử lại")}
                </Button>
              }
            />
          ) : requests.length === 0 ? (
            <Empty description={t("empty.noRequests", "Không có yêu cầu nào khớp bộ lọc hiện tại.")} />
          ) : (
            <Table
              columns={requestColumns}
              dataSource={requests}
              rowKey={(record) => record._id}
              loading={queue.isFetching || reviewingId !== null}
              pagination={{
                current: page,
                pageSize,
                total: queueTotal,
                showSizeChanger: false,
                showTotal: (total) => t("queueTotal", `${total} yêu cầu`, { count: total }),
              }}
              onChange={(pagination) => {
                setPage(pagination.current ?? 1);
                if (pagination.pageSize) setPageSize(pagination.pageSize);
              }}
              scroll={{ x: 1100 }}
              style={{ borderRadius: 12, overflow: "hidden" }}
            />
          )}
        </Card>
      )}
    </div>
  );
}
