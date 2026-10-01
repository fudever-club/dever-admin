"use client";

import React, { useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Empty,
  Form,
  Input,
  Modal,
  Pagination,
  Popconfirm,
  Select,
  Skeleton,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd";
import {
  MailOutlined,
  ReloadOutlined,
  SendOutlined,
  StopOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  InviteStatus,
  useBulkInvitesMutation,
  useCreateInviteMutation,
  useListInvitesQuery,
  useResendInviteMutation,
  useRevokeInviteMutation,
} from "@/store/queries/inviteManagement";

const { Title, Text } = Typography;
const { TextArea } = Input;

// TODO(i18n): hardcode tiếng Việt như FundManagement/AuditLog để giữ scope; full i18n (vi/en inviteManagement.json) làm sau.
// TODO(config): settings/constants chưa có client base URL nên hardcode + cho phép
// override qua NEXT_PUBLIC_CLIENT_BASE_URL; chuyển vào settings khi route invite bên client chốt.
const CLIENT_BASE_URL =
  process.env.NEXT_PUBLIC_CLIENT_BASE_URL || "https://client.fudever.com";
const buildInviteLink = (token: string): string =>
  `${CLIENT_BASE_URL}/vi/invite/${token}`;

const MAX_BULK_ROWS = 200;
const EMAIL_RE = /^\S+@\S+\.\S+$/;

interface BulkInviteUser {
  email: string;
  firstname?: string;
  lastname?: string;
}

interface InviteLinkResult {
  email: string;
  link: string;
}

interface InviteEntry {
  _id: string;
  email?: string;
  firstname?: string;
  lastname?: string;
  status?: string;
  expiresAt?: string;
  acceptedAt?: string;
  isExpired?: boolean;
  invitedBy?: unknown;
}

function parseBulkInput(source: string): {
  totalLines: number;
  users: BulkInviteUser[];
  errors: string[];
} {
  const lines = source
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  const users: BulkInviteUser[] = [];
  const errors: string[] = [];
  lines.forEach((line, index) => {
    const parts = line.split(",").map((part) => part.trim());
    const email = (parts[0] || "").toLowerCase();
    const firstname = parts[1] || "";
    const lastname = parts[2] || "";
    const rowNumber = index + 1;
    if (!email || !EMAIL_RE.test(email)) {
      errors.push(`Dòng ${rowNumber}: email không hợp lệ.`);
      return;
    }
    users.push({
      email,
      ...(firstname ? { firstname } : {}),
      ...(lastname ? { lastname } : {}),
    });
  });
  return { totalLines: lines.length, users, errors };
}

function resolveInviter(invitedBy: unknown): { name: string; email: string } {
  if (!invitedBy) return { name: "—", email: "" };
  if (typeof invitedBy === "string") return { name: invitedBy, email: "" };
  if (typeof invitedBy === "object") {
    const record = invitedBy as Record<string, unknown>;
    const name = [record.firstname, record.lastname]
      .filter((part) => typeof part === "string" && part)
      .join(" ");
    const email = typeof record.email === "string" ? record.email : "";
    return { name: name || (typeof record._id === "string" ? record._id : "—"), email };
  }
  return { name: "—", email: "" };
}

function formatDateTime(value?: string): string {
  if (!value) return "—";
  const parsed = dayjs(value);
  if (!parsed.isValid()) return "—";
  return parsed.format("HH:mm DD/MM/YYYY");
}

function getStatusTag(status?: string): { color: string; label: string } {
  if (status === "accepted") return { color: "green", label: "Đã chấp nhận" };
  if (status === "revoked") return { color: "red", label: "Đã thu hồi" };
  return { color: "blue", label: "Chờ xác nhận" };
}

async function copyText(text: string, successLabel: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    message.success(`Đã sao chép liên kết của ${successLabel}`);
    return;
  } catch {
    // Fallback cho trình duyệt chặn Clipboard API (http / thiếu quyền).
  }
  try {
    const fallback = document.createElement("textarea");
    fallback.value = text;
    fallback.style.position = "fixed";
    fallback.style.opacity = "0";
    document.body.appendChild(fallback);
    fallback.select();
    document.execCommand("copy");
    document.body.removeChild(fallback);
    message.success(`Đã sao chép liên kết của ${successLabel}`);
  } catch {
    message.error("Không thể sao chép tự động. Hãy copy thủ công liên kết bên dưới.");
  }
}

function InviteLinkResultModal({
  title,
  summary,
  results,
  onClose,
}: {
  title: string;
  summary?: string;
  results: InviteLinkResult[];
  onClose: () => void;
}) {
  return (
    <Modal
      title={title}
      open={results.length > 0}
      closable={false}
      maskClosable={false}
      width="min(560px, 95vw)"
      centered
      footer={[
        <Button key="acknowledge" type="primary" onClick={onClose} style={{ minHeight: 44 }}>
          Tôi đã lưu liên kết
        </Button>,
      ]}
    >
      <Alert
        type="warning"
        showIcon
        message="Token chỉ hiển thị một lần"
        description="Mỗi liên kết chứa token chỉ được backend trả về đúng một lần lúc tạo. Hãy sao chép và gửi cho thành viên qua kênh an toàn; đóng cửa sổ này sẽ không xem lại được."
      />
      {summary && (
        <Alert type="info" showIcon message={summary} style={{ marginTop: 12 }} />
      )}
      <Space className="mt-4 w-full" direction="vertical" size={12} style={{ marginTop: 12 }}>
        {results.map((result) => (
          <div
            className="rounded-lg border border-slate-200 bg-slate-50 p-4"
            key={`${result.email}-${result.link}`}
            style={{ border: "1px solid #E2E8F0", borderRadius: 12, padding: 12, background: "#F8FAFC" }}
          >
            <Text strong>{result.email}</Text>
            <Typography.Paragraph
              className="mb-3 mt-2"
              copyable={false}
              ellipsis={{ rows: 2, expandable: true }}
              style={{ marginTop: 8, marginBottom: 8, wordBreak: "break-all" }}
            >
              <Text code>{result.link}</Text>
            </Typography.Paragraph>
            <Button onClick={() => copyText(result.link, result.email)} style={{ minHeight: 44 }}>
              Sao chép liên kết
            </Button>
          </div>
        ))}
      </Space>
    </Modal>
  );
}

export default function InviteManagement() {
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [statusFilter, setStatusFilter] = useState<InviteStatus | undefined>(undefined);
  const [bulkSource, setBulkSource] = useState<string>("");
  const [bulkSummary, setBulkSummary] = useState<string | null>(null);
  const [linkResults, setLinkResults] = useState<InviteLinkResult[]>([]);
  const [resultTitle, setResultTitle] = useState<string>("Liên kết thư mời");
  const [resultSummary, setResultSummary] = useState<string | undefined>(undefined);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [singleForm] = Form.useForm();

  const validPaging =
    Number.isSafeInteger(page) && page >= 1 && Number.isSafeInteger(limit) && limit >= 1;
  const queryArgs = useMemo(
    () => ({ page, limit, ...(statusFilter ? { status: statusFilter } : {}) }),
    [page, limit, statusFilter]
  );

  const { data, error, isLoading, isFetching, refetch } = useListInvitesQuery(queryArgs, {
    skip: !validPaging,
  });

  const [createInvite, { isLoading: isCreating }] = useCreateInviteMutation();
  const [bulkInvites, { isLoading: isBulking }] = useBulkInvitesMutation();
  const [revokeInvite] = useRevokeInviteMutation();
  const [resendInvite] = useResendInviteMutation();

  const entries: InviteEntry[] = useMemo(
    () => (data && Array.isArray(data.data) ? data.data : []),
    [data]
  );
  const total: number = useMemo(
    () => (data && Number.isSafeInteger(data.total) && data.total >= 0 ? data.total : 0),
    [data]
  );
  const hasActiveFilter = Boolean(statusFilter);

  const bulkPreview = useMemo(() => parseBulkInput(bulkSource), [bulkSource]);
  const bulkOverLimit = bulkPreview.totalLines > MAX_BULK_ROWS;

  const handleRetry = () => {
    if (!isFetching) refetch();
  };

  const handleClearFilters = () => {
    setStatusFilter(undefined);
    setPage(1);
  };

  const handleCreateSingle = async (values: {
    email: string;
    firstname?: string;
    lastname?: string;
  }) => {
    try {
      const response: any = await createInvite({
        email: values.email.trim().toLowerCase(),
        ...(values.firstname?.trim() ? { firstname: values.firstname.trim() } : {}),
        ...(values.lastname?.trim() ? { lastname: values.lastname.trim() } : {}),
      }).unwrap();
      const token: string | undefined = response?.data?.token;
      const invite = response?.data?.invite;
      const email: string = invite?.email || values.email.trim().toLowerCase();
      if (token) {
        setResultTitle("Liên kết thư mời mới");
        setResultSummary(undefined);
        setLinkResults([{ email, link: buildInviteLink(token) }]);
      } else {
        message.success("Đã tạo thư mời.");
      }
      singleForm.resetFields();
      refetch();
    } catch (err: any) {
      message.error(err?.data?.message || "Không thể tạo thư mời. Vui lòng thử lại.");
    }
  };

  const handleBulkSubmit = async () => {
    if (bulkOverLimit) {
      message.error(`Tối đa ${MAX_BULK_ROWS} thư mời mỗi lần. Hãy chia nhỏ danh sách.`);
      return;
    }
    if (bulkPreview.users.length === 0) {
      message.error("Chưa có dòng hợp lệ nào. Mỗi dòng nhập theo dạng: email, firstname, lastname.");
      return;
    }
    try {
      const response: any = await bulkInvites({ users: bulkPreview.users }).unwrap();
      const rows: any[] = Array.isArray(response?.data?.rows) ? response.data.rows : [];
      const links: InviteLinkResult[] = [];
      rows.forEach((row) => {
        const token: string | undefined = row?.created?.token;
        const email: string | undefined =
          row?.created?.invite?.email || row?.email;
        if (token && email) links.push({ email, link: buildInviteLink(token) });
      });
      const createdCount = Number(response?.data?.created ?? links.length);
      const skippedCount = Number(response?.data?.skipped ?? 0);
      const errorCount = Number(response?.data?.errors ?? 0);
      const summary = [
        `Đã tạo ${createdCount} thư mời`,
        skippedCount > 0 ? `bỏ qua ${skippedCount}` : null,
        errorCount > 0 ? `lỗi ${errorCount}` : null,
        bulkPreview.errors.length > 0
          ? `${bulkPreview.errors.length} dòng lỗi client (${bulkPreview.errors.slice(0, 2).join(" ")})`
          : null,
      ]
        .filter(Boolean)
        .join("; ");
      setBulkSummary(`${summary}.`);
      if (links.length > 0) {
        setResultTitle("Liên kết thư mời hàng loạt");
        setResultSummary(summary);
        setLinkResults(links);
      } else if (skippedCount > 0 || errorCount > 0 || bulkPreview.errors.length > 0) {
        message.warning(`${summary}.`);
      } else {
        message.success("Tạo thư mời hàng loạt thành công.");
      }
      setBulkSource("");
      refetch();
    } catch (err: any) {
      message.error(err?.data?.message || "Không thể tạo thư mời hàng loạt. Vui lòng thử lại.");
    }
  };

  const handleRevoke = async (id: string) => {
    if (!id || revokingId) return;
    setRevokingId(id);
    try {
      await revokeInvite(id).unwrap();
      refetch();
      message.success("Đã thu hồi thư mời.");
    } catch (err: any) {
      message.error(err?.data?.message || "Không thể thu hồi thư mời. Vui lòng thử lại.");
    } finally {
      setRevokingId(null);
    }
  };

  const handleResend = async (record: InviteEntry) => {
    const id = record?._id;
    if (!id || resendingId) return;
    setResendingId(id);
    try {
      const response: any = await resendInvite(id).unwrap();
      const token: string | undefined = response?.data?.token;
      const email: string = response?.data?.invite?.email || record?.email || "";
      refetch();
      if (token && email) {
        setResultTitle("Liên kết thư mời mới (gửi lại)");
        setResultSummary(undefined);
        setLinkResults([{ email, link: buildInviteLink(token) }]);
      } else {
        message.success("Đã gửi lại thư mời.");
      }
    } catch (err: any) {
      message.error(err?.data?.message || "Không thể gửi lại thư mời. Vui lòng thử lại.");
    } finally {
      setResendingId(null);
    }
  };

  const columns = [
    {
      title: "STT",
      key: "stt",
      width: 70,
      render: (_: unknown, __: InviteEntry, index: number) => (
        <Text type="secondary">{(page - 1) * limit + index + 1}</Text>
      ),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      width: 220,
      render: (value: string) => <Text strong>{value || "—"}</Text>,
    },
    {
      title: "Tên",
      key: "name",
      width: 180,
      render: (_: unknown, record: InviteEntry) => {
        const fullName = [record.firstname, record.lastname].filter(Boolean).join(" ");
        return <Text>{fullName || "—"}</Text>;
      },
    },
    {
      title: "Trạng thái",
      key: "status",
      width: 200,
      render: (_: unknown, record: InviteEntry) => {
        const tag = getStatusTag(record.status);
        return (
          <Space size={4} wrap>
            <Tag color={tag.color}>{tag.label}</Tag>
            {record.isExpired && record.status === "pending" && (
              <Tag color="volcano">Hết hạn</Tag>
            )}
          </Space>
        );
      },
    },
    {
      title: "Hết hạn lúc",
      dataIndex: "expiresAt",
      key: "expiresAt",
      width: 160,
      render: (value: string) => (
        <Text style={{ fontSize: 12, color: "#475569" }}>{formatDateTime(value)}</Text>
      ),
    },
    {
      title: "Người mời",
      key: "invitedBy",
      width: 200,
      render: (_: unknown, record: InviteEntry) => {
        const inviter = resolveInviter(record.invitedBy);
        return (
          <Space direction="vertical" size={0}>
            <Text style={{ fontSize: 13 }}>{inviter.name}</Text>
            {inviter.email && (
              <Text type="secondary" style={{ fontSize: 11 }}>
                {inviter.email}
              </Text>
            )}
          </Space>
        );
      },
    },
    {
      title: "Thao tác",
      key: "action",
      width: 180,
      fixed: "right" as const,
      render: (_: unknown, record: InviteEntry) => (
        <Space size={8} wrap>
          <Tooltip
            title={
              record.status === "accepted"
                ? "Thư mời đã được chấp nhận"
                : "Tạo token mới và hiển thị liên kết một lần"
            }
          >
            <Button
              size="small"
              icon={<SendOutlined />}
              loading={resendingId === record._id}
              disabled={record.status === "accepted" || resendingId === record._id}
              onClick={() => handleResend(record)}
            >
              Gửi lại
            </Button>
          </Tooltip>
          <Popconfirm
            title="Thu hồi thư mời"
            description="Bạn có chắc chắn muốn thu hồi thư mời này?"
            okText="Đồng ý"
            cancelText="Huỷ bỏ"
            okButtonProps={{ danger: true, loading: revokingId === record._id }}
            onConfirm={() => handleRevoke(record._id)}
          >
            <Button
              size="small"
              danger
              icon={<StopOutlined />}
              disabled={record.status !== "pending"}
            >
              Thu hồi
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: "24px", maxWidth: 1300, margin: "0 auto", backgroundColor: "#F8FAFC", minHeight: "100vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <Title level={3} style={{ margin: 0, color: "#0F172A", display: "flex", alignItems: "center", gap: 10, fontWeight: 800 }}>
            <MailOutlined style={{ color: "#0066CC" }} /> Quản lý thư mời
          </Title>
          <Text type="secondary" style={{ fontSize: 13, marginTop: 4, display: "block" }}>
            Tạo thư mời lẻ hoặc hàng loạt, theo dõi trạng thái và gửi lại khi cần. Token chỉ hiển thị một lần lúc tạo.
          </Text>
        </div>
        <Button icon={<ReloadOutlined />} onClick={handleRetry} loading={isFetching} style={{ borderRadius: 10, fontWeight: 600, height: 38 }}>
          Làm mới
        </Button>
      </div>

      <Card bordered={false} style={{ borderRadius: 20, marginBottom: 16, border: "1px solid #E2E8F0" }}>
        <Title level={5} style={{ marginTop: 0 }}>Tạo thư mời lẻ</Title>
        <Form form={singleForm} layout="inline" onFinish={handleCreateSingle} style={{ rowGap: 12 }}>
          <Form.Item
            name="email"
            rules={[
              { required: true, message: "Vui lòng nhập email." },
              { type: "email", message: "Email không hợp lệ." },
            ]}
            style={{ minWidth: 240, flex: 1 }}
          >
            <Input placeholder="Email *" allowClear />
          </Form.Item>
          <Form.Item name="firstname" style={{ minWidth: 160 }}>
            <Input placeholder="Tên (firstname)" allowClear />
          </Form.Item>
          <Form.Item name="lastname" style={{ minWidth: 160 }}>
            <Input placeholder="Họ (lastname)" allowClear />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={isCreating} style={{ backgroundColor: "#0066CC" }}>
              Tạo thư mời
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card bordered={false} style={{ borderRadius: 20, marginBottom: 16, border: "1px solid #E2E8F0" }}>
        <Title level={5} style={{ marginTop: 0 }}>Tạo hàng loạt (tối đa {MAX_BULK_ROWS})</Title>
        <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 8 }}>
          Mỗi dòng một người theo dạng: email, firstname, lastname (firstname/lastname không bắt buộc).
        </Text>
        <TextArea
          rows={5}
          value={bulkSource}
          onChange={(e) => setBulkSource(e.target.value)}
          placeholder={"an.nguyen@fpt.edu.vn, An, Nguyen\nbinh.tran@fpt.edu.vn, Binh, Tran"}
          aria-label="Danh sách thư mời hàng loạt"
        />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, flexWrap: "wrap", gap: 8 }}>
          <Text type={bulkOverLimit ? "danger" : "secondary"} style={{ fontSize: 12 }}>
            {bulkOverLimit
              ? `Vượt giới hạn: ${bulkPreview.totalLines}/${MAX_BULK_ROWS} dòng. Hãy chia nhỏ danh sách.`
              : `Hợp lệ: ${bulkPreview.users.length}/${bulkPreview.totalLines} dòng.`}
            {bulkPreview.errors.length > 0 && !bulkOverLimit && ` Lỗi: ${bulkPreview.errors.slice(0, 2).join(" ")}`}
          </Text>
          <Button
            type="primary"
            onClick={handleBulkSubmit}
            loading={isBulking}
            disabled={bulkOverLimit || bulkPreview.users.length === 0}
            style={{ backgroundColor: "#0066CC" }}
          >
            Tạo {bulkPreview.users.length} thư mời
          </Button>
        </div>
        {bulkSummary && (
          <Alert
            type="info"
            showIcon
            message={bulkSummary}
            closable
            onClose={() => setBulkSummary(null)}
            style={{ marginTop: 12 }}
          />
        )}
      </Card>

      <Card bordered={false} style={{ borderRadius: 20, border: "1px solid #E2E8F0", backgroundColor: "#FFFFFF" }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
          <Select
            allowClear
            placeholder="Tất cả trạng thái"
            value={statusFilter}
            onChange={(value) => {
              setStatusFilter((value || undefined) as InviteStatus | undefined);
              setPage(1);
            }}
            style={{ width: 220 }}
            options={[
              { value: "", label: "Tất cả" },
              { value: "pending", label: "Chờ xác nhận" },
              { value: "accepted", label: "Đã chấp nhận" },
              { value: "revoked", label: "Đã thu hồi" },
            ]}
          />
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
            message="Không thể tải danh sách thư mời"
            description="Vui lòng kiểm tra kết nối và thử lại."
            action={
              <Button size="small" danger onClick={handleRetry} loading={isFetching}>
                Thử lại
              </Button>
            }
          />
        ) : entries.length === 0 ? (
          <Empty
            description={hasActiveFilter ? "Không có thư mời nào khớp bộ lọc hiện tại." : "Chưa có thư mời nào."}
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
                pageSizeOptions={[10, 25, 50]}
                showTotal={(t) => `Tổng cộng ${t} thư mời`}
                onChange={(nextPage, nextSize) => {
                  setPage(nextPage);
                  setLimit(nextSize);
                }}
                onShowSizeChange={(nextPage, nextSize) => {
                  setPage(nextPage);
                  setLimit(nextSize);
                }}
              />
            </div>
          </>
        )}
      </Card>

      <InviteLinkResultModal
        title={resultTitle}
        summary={resultSummary}
        results={linkResults}
        onClose={() => {
          setLinkResults([]);
          setResultSummary(undefined);
        }}
      />
    </div>
  );
}
