"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Alert, Button, Card, Col, Flex, Row, Skeleton, Statistic, Typography } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import { useParams } from "next/navigation";
import { useTranslation } from "@/app/i18n/client";
import { constants } from "@/settings";
import webStorageClient from "@/utils/webStorageClient";

interface AdminMetrics {
  totalUsers: number | null;
  activeEvents: number | null;
  pendingBlogs: number | null;
  leetcodeSubmissions: number | null;
}

const unavailableMetrics: AdminMetrics = {
  totalUsers: null, activeEvents: null, pendingBlogs: null, leetcodeSubmissions: null,
};

export default function ExecutiveAnalytics() {
  const [stats, setStats] = useState<AdminMetrics>(unavailableMetrics);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const request = useRef<AbortController | null>(null);
  const params = useParams();
  const { t } = useTranslation(params?.locale as string, "dashboard");

  const fetchLiveMetrics = useCallback(async () => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setLoading(true);
    setError(false);
    const token = webStorageClient.getToken();
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    const get = async (path: string) => {
      const response = await fetch(`${constants.API_SERVER.replace(/\/+$/, "")}/api/v1/${path}`, {
        headers, signal: controller.signal,
      });
      if (!response.ok) throw new Error(`Metrics request failed: ${response.status}`);
      return response.json();
    };
    const list = (body: { data?: unknown }): Record<string, unknown>[] => {
      if (!Array.isArray(body?.data)) throw new Error("Invalid metrics response");
      return body.data;
    };

    const results = await Promise.allSettled([
      // The count is server-wide; avoid downloading a full page of private profiles.
      get("users?limit=1").then((body) => {
        if (!Number.isSafeInteger(body.total) || body.total < 0) throw new Error("Missing user total");
        return body.total as number;
      }),
      get("events").then((body) => list(body).filter((event) =>
        event.status === "Đang mở đăng ký" || event.status === "Đang diễn ra").length),
      get("blogs/admin/review-queue").then((body) => list(body).filter((blog) =>
        blog.status === "pending_review").length),
      get("leetcode/leaderboard").then((body) => list(body).reduce((sum, entry) => {
        if (!Array.isArray(entry.acSubmissionList)) throw new Error("Missing submission list");
        return sum + entry.acSubmissionList.length;
      }, 0)),
    ]);
    // A slower refresh or an unmounted widget must never overwrite newer data.
    if (controller.signal.aborted) return;
    const value = (index: number) => {
      const result = results[index];
      return result.status === "fulfilled" ? result.value : null;
    };
    setStats({ totalUsers: value(0), activeEvents: value(1), pendingBlogs: value(2), leetcodeSubmissions: value(3) });
    setError(results.some((result) => result.status === "rejected"));
    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchLiveMetrics();
    return () => request.current?.abort();
  }, [fetchLiveMetrics]);

  return (
    <Flex vertical gap={16} style={{ marginBottom: 24 }}>
      <Flex wrap="wrap" justify="space-between" align="center" gap={12}>
        <Typography.Title level={3} style={{ margin: 0 }}>{t("overview")}</Typography.Title>
        <Button icon={<ReloadOutlined />} onClick={fetchLiveMetrics} disabled={loading}>
          {t(loading ? "refreshing" : "refresh")}
        </Button>
      </Flex>
      {error && <Alert type="warning" showIcon message={t("loadError")}
        action={<Button onClick={fetchLiveMetrics} disabled={loading}>{t("retry")}</Button>} />}
      <Row gutter={[16, 16]}>
        {(Object.keys(stats) as (keyof AdminMetrics)[]).map((key) => (
          <Col key={key} xs={24} sm={12} xl={6}>
            <Card>
              {loading ? <Skeleton active paragraph={{ rows: 2 }} /> : (
                <Statistic title={t(key)} value={stats[key] ?? t("unavailable")} />
              )}
            </Card>
          </Col>
        ))}
      </Row>
    </Flex>
  );
}
