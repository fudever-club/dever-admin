"use client";

import React, { useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Progress,
  Row,
  Select,
  Skeleton,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useParams } from "next/navigation";
import { useTranslation } from "@/app/i18n/client";
import {
  useGetAdminAuditSummaryQuery,
  type AdminAuditSummarySeriesItem,
} from "@/store/queries/adminAudit";

const { Text } = Typography;

function isInviteAction(action: string): boolean {
  return (
    action.startsWith("invite.") ||
    action.startsWith("user.invite") ||
    action === "user.accepted"
  );
}

function getGroupKey(action: string): "user" | "fund" | "blog" | "opensource" | "invite" | "other" {
  if (isInviteAction(action)) return "invite";
  if (action.startsWith("user.")) return "user";
  if (action.startsWith("fund.")) return "fund";
  if (action.startsWith("blog.")) return "blog";
  if (action.startsWith("opensource.")) return "opensource";
  return "other";
}

function getActionColor(action?: string): string {
  if (!action) return "default";
  const group = getGroupKey(action);
  if (group === "user") return "blue";
  if (group === "fund") return "gold";
  if (group === "blog") return "purple";
  if (group === "opensource") return "green";
  if (group === "invite") return "cyan";
  return "default";
}

const GROUP_FALLBACK = {
  user: "Người dùng",
  fund: "Quỹ",
  blog: "Blog",
  opensource: "Opensource",
  invite: "Mời",
} as const;

type GroupKey = keyof typeof GROUP_FALLBACK;
const GROUP_KEYS: GroupKey[] = ["user", "fund", "blog", "opensource", "invite"];

export default function AuditFunnelSummary() {
  const params = useParams();
  const { t } = useTranslation(params?.locale as string, "auditLog");
  const [days, setDays] = useState<number>(30);

  // Cùng query client (baseApi/RTK Query) với bảng log bên dưới.
  // Không có fetch tay: RTK Query tự abort request cũ khi days đổi/unmount
  // (cùng đảm bảo stale-guard như ExecutiveAnalytics AbortController).
  const { data, error, isLoading, isFetching, refetch } =
    useGetAdminAuditSummaryQuery({ days });

  const hasData = Boolean(data?.data);

  // Defensive: backend làm song song nên byAction/series có thể thiếu —
  // thiếu thì honest empty/0, không crash, không nhầm số 0 hợp lệ thành lỗi
  // (giữ `??` như ExecutiveAnalytics: chỉ null/undefined mới là "không rõ").
  const byAction: Record<string, number> = useMemo(() => {
    const raw = data?.data?.byAction;
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
    return raw;
  }, [data]);
  const byActionValid = Boolean(
    data?.data?.byAction &&
      typeof data.data.byAction === "object" &&
      !Array.isArray(data.data.byAction)
  );
  const series: AdminAuditSummarySeriesItem[] = useMemo(() => {
    const raw = data?.data?.series;
    if (!Array.isArray(raw)) return [];
    return raw.filter(
      (item): item is AdminAuditSummarySeriesItem =>
        Boolean(item) &&
        typeof item.date === "string" &&
        typeof item.action === "string" &&
        Number.isSafeInteger(item.count) &&
        item.count >= 0
    );
  }, [data]);
  const seriesValid = Array.isArray(data?.data?.series);
  // Partial-failure honest như ExecutiveAnalytics: có data nhưng 1 nhánh
  // malformed → vẫn hiện phần hợp lệ + cảnh báo, không fail cả widget.
  const isPartial = hasData && (!byActionValid || !seriesValid);

  const groups = useMemo(() => {
    const totals: Record<GroupKey, number> = {
      user: 0,
      fund: 0,
      blog: 0,
      opensource: 0,
      invite: 0,
    };
    let total = 0;
    for (const [action, count] of Object.entries(byAction)) {
      if (!Number.isSafeInteger(count) || count < 0) continue;
      total += count;
      const group = getGroupKey(action);
      if (group in totals) totals[group as keyof typeof totals] += count;
    }
    return { totals, total };
  }, [byAction]);

  const dayOptions = useMemo(
    () => [
      { value: 7, label: t("funnel.days7", "7 ngày qua") },
      { value: 30, label: t("funnel.days30", "30 ngày qua") },
      { value: 90, label: t("funnel.days90", "90 ngày qua") },
    ],
    [t]
  );

  // Bảng series gần nhất: mới nhất trước (backend trả ascending).
  const recentSeries = useMemo(
    () =>
      [...series].sort((a, b) =>
        a.date === b.date
          ? a.action.localeCompare(b.action)
          : b.date.localeCompare(a.date)
      ),
    [series]
  );

  const handleRetry = () => {
    if (!isFetching) refetch();
  };

  if (isLoading && !hasData) {
    return (
      <Card
        bordered={false}
        style={{
          borderRadius: 20,
          border: "1px solid #E2E8F0",
          marginBottom: 16,
        }}
      >
        <Skeleton active paragraph={{ rows: 4 }} />
      </Card>
    );
  }

  if (error && !hasData) {
    return (
      <Card
        bordered={false}
        style={{
          borderRadius: 20,
          border: "1px solid #E2E8F0",
          marginBottom: 16,
        }}
      >
        <Alert
          type="error"
          showIcon
          message={t("funnel.loadError", "Không thể tải phễu kiểm toán")}
          description={t("funnel.loadErrorDesc", "Vui lòng kiểm tra kết nối và thử lại.")}
          action={
            <Button size="small" danger onClick={handleRetry} loading={isFetching}>
              {t("retry", "Thử lại")}
            </Button>
          }
        />
      </Card>
    );
  }

  return (
    <Card
      bordered={false}
      style={{
        borderRadius: 20,
        boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
        border: "1px solid #E2E8F0",
        backgroundColor: "#FFFFFF",
        marginBottom: 16,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div>
          <Text strong style={{ fontSize: 15, color: "#0F172A" }}>
            {t("funnel.title", "Phễu kiểm toán")}
          </Text>
          <Text type="secondary" style={{ fontSize: 12, display: "block" }}>
            {t("funnel.subtitle", "Tổng thao tác theo nhóm trong kỳ (không biểu đồ, chỉ số + bảng).")}
          </Text>
        </div>
        <Space size={8}>
          <Select
            value={days}
            onChange={(v) => setDays(v)}
            style={{ width: 150 }}
            options={dayOptions}
            aria-label={t("funnel.periodLabel", "Chọn kỳ thống kê")}
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={handleRetry}
            loading={isFetching}
            aria-label={t("funnel.refreshLabel", "Làm mới phễu kiểm toán")}
          />
        </Space>
      </div>

      {isPartial && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message={t("funnel.partialTitle", "Một phần dữ liệu phễu không khả dụng")}
          description={t("funnel.partialDesc", "Phần hợp lệ vẫn hiển thị; thử làm mới để lấy đủ số liệu.")}
          action={
            <Button size="small" onClick={handleRetry} loading={isFetching}>
              {t("retry", "Thử lại")}
            </Button>
          }
        />
      )}

      <Row gutter={[12, 12]} style={{ marginBottom: series.length === 0 ? 0 : 16 }}>
        {GROUP_KEYS.map((key) => {
          const value = groups.totals[key];
          const percent =
            groups.total > 0 ? Math.round((value / groups.total) * 100) : 0;
          const label = t(`funnel.groups.${key}`, GROUP_FALLBACK[key]);
          return (
            <Col key={key} xs={24} sm={12} lg={8} xl={8}>
              <Card size="small" style={{ borderRadius: 12 }}>
                <Statistic
                  title={`${label} (${percent}%)`}
                  value={value ?? 0}
                />
                <Progress percent={percent} showInfo={false} size="small" />
              </Card>
            </Col>
          );
        })}
      </Row>

      {series.length === 0 ? (
        <Empty description={t("funnel.empty", `Chưa có hoạt động nào trong ${days} ngày qua.`, { days })} />
      ) : (
        <Table
          size="small"
          rowKey={(record) => `${record.date}-${record.action}`}
          dataSource={recentSeries}
          loading={isFetching}
          pagination={{
            pageSize: 5,
            size: "small",
            showTotal: (totalCount) => t("funnel.paginationTotal", `Tổng cộng ${totalCount} dòng`, { total: totalCount }),
          }}
          scroll={{ x: 750 }}
          columns={[
            {
              title: t("funnel.tableDate", "Ngày"),
              dataIndex: "date",
              key: "date",
              width: 140,
              render: (value: string) => {
                const d = dayjs(value, "YYYY-MM-DD", true);
                return (
                  <Text style={{ fontSize: 12 }}>
                    {d.isValid() ? d.format("DD/MM/YYYY") : value || "—"}
                  </Text>
                );
              },
            },
            {
              title: t("funnel.tableAction", "Hành động"),
              dataIndex: "action",
              key: "action",
              render: (value: string) => (
                <Tag color={getActionColor(value)}>{value || "—"}</Tag>
              ),
            },
            {
              title: t("funnel.tableCount", "Số lượng"),
              dataIndex: "count",
              key: "count",
              width: 120,
              align: "right" as const,
              sorter: (a: AdminAuditSummarySeriesItem, b: AdminAuditSummarySeriesItem) =>
                a.count - b.count,
              render: (value: number) => (
                <Text strong style={{ fontSize: 13 }}>
                  {Number.isSafeInteger(value) ? value : "—"}
                </Text>
              ),
            },
          ]}
        />
      )}
    </Card>
  );
}
