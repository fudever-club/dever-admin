"use client";

import React, { useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Empty,
  Input,
  Pagination,
  Select,
  Skeleton,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import { AuditOutlined, ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useGetAdminAuditLogQuery } from "@/store/queries/adminAudit";

const { Title, Text } = Typography;

// TODO(i18n): hardcode tiếng Việt như FundManagement để giữ scope; full i18n (vi/en auditLog.json) làm sau.
// TODO(audit-detail): drawer chi tiết hiển thị before/after diff khi backend mới ổn định shape { before, after }.

interface AuditActor {
  firstname?: string;
  lastname?: string;
  email?: string;
}

interface AuditEntry {
  _id: string;
  actorId?: AuditActor | string | null;
  action?: string;
  targetType?: string;
  targetId?: string | { _id?: string } | null;
  summary?: string;
  ip?: string;
  createdAt?: string;
  // Defensive fallbacks cho backend fund-audit hiện tại (làm song song):
  // FundAuditLog { payerId, actorId, campaignId, paymentId, action }.
  payerId?: unknown;
  campaignId?: string | { _id?: string; title?: string } | null;
  paymentId?: string | { _id?: string } | null;
}

const ACTION_OPTIONS = [
  { value: "user.created", label: "user.created" },
  { value: "user.updated", label: "user.updated" },
  { value: "user.deleted", label: "user.deleted" },
  { value: "fund.submitted", label: "fund.submitted" },
  { value: "fund.approved", label: "fund.approved" },
  { value: "fund.rejected", label: "fund.rejected" },
  { value: "blog.submitted", label: "blog.submitted" },
  { value: "blog.approved", label: "blog.approved" },
  { value: "blog.rejected", label: "blog.rejected" },
  { value: "opensource.submitted", label: "opensource.submitted" },
  { value: "opensource.approved", label: "opensource.approved" },
  { value: "opensource.rejected", label: "opensource.rejected" },
];

const TARGET_TYPE_OPTIONS = [
  { value: "user", label: "user" },
  { value: "fund", label: "fund" },
  { value: "blog", label: "blog" },
  { value: "opensource", label: "opensource" },
];

function getActionColor(action?: string): string {
  if (!action) return "default";
  if (action.startsWith("user")) return "blue";
  if (action.startsWith("fund")) return "gold";
  if (action.startsWith("blog")) return "purple";
  if (action.startsWith("opensource")) return "green";
  return "default";
}

function getIdString(id: AuditEntry["targetId"]): string {
  if (!id) return "";
  if (typeof id === "string") return id;
  return id._id || "";
}

function shortenId(id: string): string {
  if (!id) return "—";
  return id.length > 8 ? `${id.slice(0, 8)}…` : id;
}

function resolveTargetType(entry: AuditEntry): string {
  if (entry.targetType) return entry.targetType;
  if (entry.campaignId || entry.paymentId) return "fund";
  return "";
}

function resolveTargetId(entry: AuditEntry): string {
  const direct = getIdString(entry.targetId);
  if (direct) return direct;
  const payment = typeof entry.paymentId === "string" ? entry.paymentId : entry.paymentId?._id || "";
  if (payment) return payment;
  const campaign = typeof entry.campaignId === "string" ? entry.campaignId : entry.campaignId?._id || "";
  return campaign;
}

export default function AuditLogManagement() {
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(20);
  const [action, setAction] = useState<string | undefined>(undefined);
  const [targetType, setTargetType] = useState<string | undefined>(undefined);
  const [draftTargetId, setDraftTargetId] = useState<string>("");
  const [draftActorId, setDraftActorId] = useState<string>("");
  const [appliedTargetId, setAppliedTargetId] = useState<string | undefined>(undefined);
  const [appliedActorId, setAppliedActorId] = useState<string | undefined>(undefined);

  // Guard args: trang/limit không hợp lệ thì skip (không bắn request rác).
  const validPaging = Number.isSafeInteger(page) && page >= 1 && Number.isSafeInteger(limit) && limit >= 1;
  const queryArgs = useMemo(
    () => ({
      page,
      limit,
      ...(action ? { action } : {}),
      ...(targetType ? { targetType } : {}),
      ...(appliedTargetId ? { targetId: appliedTargetId } : {}),
      ...(appliedActorId ? { actorId: appliedActorId } : {}),
    }),
    [page, limit, action, targetType, appliedTargetId, appliedActorId]
  );

  const { data, error, isLoading, isFetching, refetch } = useGetAdminAuditLogQuery(queryArgs, {
    skip: !validPaging,
  });

  // Backend làm song song nên defensive: data null/không phải mảng → empty honest, không crash.
  const entries: AuditEntry[] = useMemo(
    () => (data && Array.isArray(data.data) ? data.data : []),
    [data]
  );
  const total: number = useMemo(
    () => (data && Number.isSafeInteger(data.total) && data.total >= 0 ? data.total : 0),
    [data]
  );
  const hasActiveFilter = Boolean(action || targetType || appliedTargetId || appliedActorId);

  const handleSearch = () => {
    setAppliedTargetId(draftTargetId.trim() || undefined);
    setAppliedActorId(draftActorId.trim() || undefined);
    setPage(1);
  };

  const handleClearFilters = () => {
    setAction(undefined);
    setTargetType(undefined);
    setDraftTargetId("");
    setDraftActorId("");
    setAppliedTargetId(undefined);
    setAppliedActorId(undefined);
    setPage(1);
  };

  // Không có mutation nên không cần concurrency lock; RTK Query tự abort
  // request cũ khi args đổi/unmount (cùng đảm bảo như ExecutiveAnalytics AbortController).
  const handleRetry = () => {
    if (!isFetching) refetch();
  };

  const columns = [
    {
      title: "STT",
      key: "stt",
      width: 70,
      render: (_: unknown, __: AuditEntry, index: number) => (
        <Text type="secondary">{(page - 1) * limit + index + 1}</Text>
      ),
    },
    {
      title: "Thời gian",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 160,
      render: (value: string) => {
        if (!value) return <Text type="secondary">—</Text>;
        const d = dayjs(value);
        if (!d.isValid()) return <Text type="secondary">—</Text>;
        return (
          <Text style={{ fontSize: 12, color: "#475569" }}>
            {d.format("HH:mm DD/MM/YYYY")}
          </Text>
        );
      },
    },
    {
      title: "Hành động",
      dataIndex: "action",
      key: "action",
      width: 180,
      render: (value: string) => <Tag color={getActionColor(value)}>{value || "—"}</Tag>,
    },
    {
      title: "Đối tượng",
      key: "target",
      width: 220,
      render: (_: unknown, record: AuditEntry) => {
        const type = resolveTargetType(record);
        const fullId = resolveTargetId(record);
        return (
          <Space direction="vertical" size={2}>
            <Text style={{ fontSize: 12 }}>{type || "—"}</Text>
            {fullId ? (
              <Tooltip title={fullId}>
                <Text code copyable={{ text: fullId }} style={{ fontSize: 11 }}>
                  {shortenId(fullId)}
                </Text>
              </Tooltip>
            ) : (
              <Text type="secondary" style={{ fontSize: 11 }}>—</Text>
            )}
          </Space>
        );
      },
    },
    {
      title: "Người thực hiện",
      key: "actor",
      width: 220,
      render: (_: unknown, record: AuditEntry) => {
        const actor = record.actorId;
        if (!actor) return <Text type="secondary">Hệ thống</Text>;
        if (typeof actor === "string") {
          return (
            <Tooltip title={actor}>
              <Text code style={{ fontSize: 11 }}>{shortenId(actor)}</Text>
            </Tooltip>
          );
        }
        const fullName = [actor.firstname, actor.lastname].filter(Boolean).join(" ") || "—";
        return (
          <Space direction="vertical" size={0}>
            <Text strong style={{ fontSize: 13 }}>{fullName}</Text>
            <Text type="secondary" style={{ fontSize: 11 }}>{actor.email || ""}</Text>
          </Space>
        );
      },
    },
    {
      title: "Tóm tắt",
      dataIndex: "summary",
      key: "summary",
      ellipsis: true,
      render: (value: string) => (
        <Tooltip title={value || ""}>
          <Text style={{ fontSize: 12 }} ellipsis>
            {value || "—"}
          </Text>
        </Tooltip>
      ),
    },
    {
      title: "IP",
      dataIndex: "ip",
      key: "ip",
      width: 130,
      render: (value: string) => <Text style={{ fontSize: 12 }}>{value || "—"}</Text>,
    },
  ];

  return (
    <div style={{ padding: "24px", maxWidth: 1300, margin: "0 auto", backgroundColor: "#F8FAFC", minHeight: "100vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <Title level={3} style={{ margin: 0, color: "#0F172A", display: "flex", alignItems: "center", gap: 10, fontWeight: 800 }}>
            <AuditOutlined style={{ color: "#0066CC" }} /> Nhật ký kiểm toán
          </Title>
          <Text type="secondary" style={{ fontSize: 13, marginTop: 4, display: "block" }}>
            Tra cứu lịch sử thao tác quản trị (chỉ đọc, phân trang server).
          </Text>
        </div>
        <Space size={12}>
          <Button icon={<ReloadOutlined />} onClick={handleRetry} loading={isFetching} style={{ borderRadius: 10, fontWeight: 600, height: 38 }}>
            Làm mới
          </Button>
        </Space>
      </div>

      <Card bordered={false} style={{ borderRadius: 20, boxShadow: "0 4px 20px rgba(0,0,0,0.04)", border: "1px solid #E2E8F0", backgroundColor: "#FFFFFF" }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
          <Select
            allowClear
            placeholder="Tất cả hành động"
            value={action}
            onChange={(v) => {
              setAction(v || undefined);
              setPage(1);
            }}
            style={{ width: 220 }}
            options={[{ value: "", label: "Tất cả" }, ...ACTION_OPTIONS]}
          />
          <Select
            allowClear
            placeholder="Tất cả đối tượng"
            value={targetType}
            onChange={(v) => {
              setTargetType(v || undefined);
              setPage(1);
            }}
            style={{ width: 200 }}
            options={[{ value: "", label: "Tất cả" }, ...TARGET_TYPE_OPTIONS]}
          />
          <Input
            allowClear
            placeholder="Tìm theo targetId..."
            value={draftTargetId}
            onChange={(e) => setDraftTargetId(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 220 }}
          />
          <Input
            allowClear
            placeholder="Tìm theo actorId..."
            value={draftActorId}
            onChange={(e) => setDraftActorId(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 220 }}
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch} style={{ backgroundColor: "#0066CC", borderRadius: 10, fontWeight: 600 }}>
            Tìm
          </Button>
          <Button onClick={handleRetry} loading={isFetching} style={{ borderRadius: 10 }}>
            Làm mới
          </Button>
        </div>

        {isLoading ? (
          <Skeleton active paragraph={{ rows: 6 }} />
        ) : error ? (
          <Alert
            type="error"
            showIcon
            message="Không thể tải nhật ký kiểm toán"
            description="Vui lòng kiểm tra kết nối và thử lại."
            action={
              <Button size="small" danger onClick={handleRetry} loading={isFetching}>
                Thử lại
              </Button>
            }
          />
        ) : entries.length === 0 ? (
          <Empty
            description={hasActiveFilter ? "Không có bản ghi nào khớp bộ lọc hiện tại." : "Chưa có bản ghi kiểm toán nào."}
          >
            {hasActiveFilter && (
              <Button type="primary" ghost onClick={handleClearFilters}>
                Xóa bộ lọc
              </Button>
            )}
          </Empty>
        ) : (
          <>
            <Table
              columns={columns}
              dataSource={entries}
              rowKey={(record) => record._id}
              loading={isFetching}
              pagination={false}
              scroll={{ x: 1100 }}
              style={{ borderRadius: 12, overflow: "hidden" }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
              <Pagination
                current={page}
                pageSize={limit}
                total={total}
                showSizeChanger
                pageSizeOptions={[10, 20, 50]}
                showTotal={(t) => `Tổng cộng ${t} bản ghi`}
                onChange={(p, ps) => {
                  setPage(p);
                  setLimit(ps);
                }}
                onShowSizeChange={(p, ps) => {
                  setPage(p);
                  setLimit(ps);
                }}
              />
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
