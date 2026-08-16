"use client";

import React, { useState } from "react";
import {
  Badge,
  Button,
  Popover,
  Tabs,
  Typography,
  Skeleton,
  Empty,
  message,
} from "antd";
import {
  BellOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  TrophyOutlined,
  FireOutlined,
  InfoCircleOutlined,
  CheckOutlined,
  SendOutlined,
  DeleteOutlined,
  RobotOutlined,
  LinkOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import {
  useGetMyNotificationsQuery,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
  useDeleteNotificationMutation,
  useTestTelegramBotMutation,
} from "@/store/queries/notifications";

const { Text } = Typography;

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("all");
  const locale = useLocale();
  const router = useRouter();

  const {
    data: notifData,
    isLoading,
    isError,
    refetch,
  } = useGetMyNotificationsQuery(undefined, {
    pollingInterval: 15000,
  });

  const [markAsRead] = useMarkNotificationAsReadMutation();
  const [markAllAsRead, { isLoading: isMarkingAll }] = useMarkAllNotificationsAsReadMutation();
  const [deleteNotif] = useDeleteNotificationMutation();
  const [testTelegram, { isLoading: isTestingTelegram }] = useTestTelegramBotMutation();

  const notifications = notifData?.data || [];
  const unreadCount = notifData?.unreadCount || 0;

  const filteredNotifications =
    activeTab === "unread"
      ? notifications.filter((n: any) => !n.isRead)
      : notifications;

  const handleItemClick = async (notif: any) => {
    if (!notif.isRead) {
      try {
        await markAsRead(notif._id).unwrap();
      } catch (e) {
        console.warn("Failed to mark as read", e);
      }
    }
    if (notif.link) {
      setOpen(false);
      if (notif.link.startsWith("http")) {
        window.open(notif.link, "_blank");
      } else {
        const targetPath = notif.link.startsWith(`/${locale}`)
          ? notif.link
          : `/${locale}${notif.link.startsWith("/") ? "" : "/"}${notif.link}`;
        router.push(targetPath);
      }
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead().unwrap();
      message.success("Đã đánh dấu tất cả là đã đọc");
    } catch (e) {
      message.error("Không thể cập nhật trạng thái thông báo");
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await deleteNotif(id).unwrap();
      message.success("Đã xóa thông báo");
    } catch (e) {
      message.error("Lỗi khi xóa thông báo");
    }
  };

  const handleTestTelegram = async () => {
    try {
      const res = await testTelegram().unwrap();
      message.success(res?.message || "Đã gửi tin nhắn test qua @Fudever_bot thành công!");
    } catch (err: any) {
      message.error(err?.data?.message || "Không thể gửi tin nhắn qua Telegram Bot");
    }
  };

  const renderIcon = (type: string) => {
    switch (type) {
      case "blog_submitted":
        return (
          <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <FileTextOutlined style={{ fontSize: 16 }} />
          </div>
        );
      case "blog_approved":
        return (
          <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: "#ecfdf5", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <CheckCircleOutlined style={{ fontSize: 16 }} />
          </div>
        );
      case "blog_rejected":
        return (
          <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: "#fff1f2", color: "#e11d48", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <CloseCircleOutlined style={{ fontSize: 16 }} />
          </div>
        );
      case "badge_unlocked":
      case "level_up":
        return (
          <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: "#fef3c7", color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <TrophyOutlined style={{ fontSize: 16 }} />
          </div>
        );
      case "streak_milestone":
        return (
          <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: "#fff7ed", color: "#ea580c", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <FireOutlined style={{ fontSize: 16 }} />
          </div>
        );
      default:
        return (
          <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: "#f1f5f9", color: "#475569", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <InfoCircleOutlined style={{ fontSize: 16 }} />
          </div>
        );
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    try {
      const now = new Date();
      const date = new Date(dateStr);
      const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
      if (diffSec < 60) return "Vừa xong";
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin} phút trước`;
      const diffHours = Math.floor(diffMin / 60);
      if (diffHours < 24) return `${diffHours} giờ trước`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 7) return `${diffDays} ngày trước`;
      return date.toLocaleDateString("vi-VN");
    } catch {
      return "";
    }
  };

  const popoverContent = (
    <div style={{ width: 380 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontWeight: 600, color: "#1e293b", fontSize: 15 }}>Thông báo Ban Quản Trị</span>
          {unreadCount > 0 && (
            <span style={{ borderRadius: 999, backgroundColor: "#dbeafe", padding: "2px 8px", fontSize: 11, fontWeight: 600, color: "#0066CC" }}>
              {unreadCount} mới
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            type="text"
            size="small"
            icon={<CheckOutlined style={{ fontSize: 12 }} />}
            loading={isMarkingAll}
            onClick={handleMarkAllRead}
            style={{ fontSize: 12, color: "#0066CC" }}
          >
            Đọc tất cả
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        size="small"
        style={{ marginBottom: 4 }}
        items={[
          { key: "all", label: `Tất cả (${notifications.length})` },
          { key: "unread", label: `Chưa đọc (${unreadCount})` },
        ]}
      />

      {/* Content Body */}
      <div style={{ maxHeight: 340, overflowY: "auto", paddingRight: 4 }}>
        {isLoading ? (
          <div style={{ padding: "8px 0" }}>
            <Skeleton avatar active paragraph={{ rows: 1 }} />
            <Skeleton avatar active paragraph={{ rows: 1 }} />
          </div>
        ) : isError ? (
          <div style={{ padding: "24px 0", textAlign: "center" }}>
            <ExclamationCircleOutlined style={{ fontSize: 24, color: "#f43f5e", marginBottom: 8 }} />
            <Text type="secondary" style={{ display: "block", fontSize: 12, marginBottom: 8 }}>
              Không thể tải danh sách thông báo
            </Text>
            <Button size="small" onClick={() => refetch()}>
              Thử lại
            </Button>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div style={{ padding: "24px 0" }}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <span style={{ fontSize: 12, color: "#94a3b8" }}>
                  {activeTab === "unread"
                    ? "Không có thông báo chưa đọc nào"
                    : "Hàng đợi thông báo quản trị đang trống"}
                </span>
              }
            />
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {filteredNotifications.map((item: any) => (
              <div
                key={item._id}
                onClick={() => handleItemClick(item)}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  padding: "8px 10px",
                  borderRadius: 10,
                  cursor: "pointer",
                  backgroundColor: !item.isRead ? "#f0f7ff" : "#f8fafc",
                  transition: "all 0.2s ease",
                  position: "relative",
                }}
              >
                {renderIcon(item.type)}
                <div style={{ flex: 1, minWidth: 0, paddingRight: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <p
                      style={{
                        fontSize: 12,
                        margin: 0,
                        fontWeight: !item.isRead ? 700 : 500,
                        color: !item.isRead ? "#0f172a" : "#334155",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {item.title}
                    </p>
                    {!item.isRead && (
                      <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#0066CC", flexShrink: 0 }} />
                    )}
                  </div>
                  <p style={{ fontSize: 11, color: "#64748b", margin: "2px 0 0", lineHeight: 1.4 }}>
                    {item.message}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                    <span style={{ fontSize: 10, color: "#94a3b8" }}>
                      {formatTimeAgo(item.createdAt)}
                    </span>
                    {item.link && (
                      <span style={{ fontSize: 10, color: "#0066CC", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 2 }}>
                        Xử lý ngay <LinkOutlined style={{ fontSize: 9 }} />
                      </span>
                    )}
                  </div>
                </div>

                <Button
                  type="text"
                  size="small"
                  icon={<DeleteOutlined style={{ fontSize: 12, color: "#94a3b8" }} />}
                  onClick={(e) => handleDelete(e, item._id)}
                  style={{ position: "absolute", right: 4, top: 6 }}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Actions: Test Telegram Bot */}
      <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11, color: "#64748b", display: "flex", alignItems: "center", gap: 4 }}>
          <RobotOutlined style={{ color: "#0088cc" }} /> @Fudever_bot
        </span>
        <Button
          size="small"
          type="primary"
          ghost
          icon={<SendOutlined style={{ fontSize: 11 }} />}
          loading={isTestingTelegram}
          onClick={handleTestTelegram}
          style={{ fontSize: 11 }}
        >
          Test Gửi Bot Telegram
        </Button>
      </div>
    </div>
  );

  return (
    <Popover
      content={popoverContent}
      trigger="click"
      open={open}
      onOpenChange={setOpen}
      placement="bottomRight"
    >
      <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
        <Badge
          count={unreadCount}
          overflowCount={99}
          offset={[-2, 4]}
          size="small"
          styles={{
            indicator: {
              backgroundColor: "#0066CC",
              fontSize: "10px",
              height: "16px",
              minWidth: "16px",
              lineHeight: "16px",
            },
          }}
        >
          <Button
            type="text"
            shape="circle"
            size="large"
            aria-label="Thông báo Quản trị"
            icon={<BellOutlined style={{ fontSize: 18, color: "#334155" }} />}
          />
        </Badge>
      </div>
    </Popover>
  );
}
