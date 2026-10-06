import React from "react";
import { MenuProps } from "antd";
import {
  TeamOutlined,
  UserOutlined,
  BookOutlined,
  ReadOutlined,
  IdcardOutlined,
  LinkOutlined,
  AimOutlined,
  CalendarOutlined,
  DashboardOutlined,
  FileImageOutlined,
  FileTextOutlined,
  GlobalOutlined,
  PictureOutlined,
  TrophyOutlined,
  WalletOutlined,
  AuditOutlined,
  MailOutlined,
  SolutionOutlined,
} from "@ant-design/icons";

// Order follows daily operating frequency: overview first, then daily
// member/fund/content queues, weekly review queues, and master-data config last.
// Icons are unique per entry (no shared LinkOutlined/BookOutlined/AimOutlined).
export const sidebarMenu: MenuProps["items"] = [
  {
    key: "dashboard",
    icon: React.createElement(DashboardOutlined),
    label: "dashboard",
  },
  {
    key: "user-management",
    icon: React.createElement(UserOutlined),
    label: "usersManagement",
  },
  {
    key: "invite-management",
    icon: React.createElement(MailOutlined),
    label: "inviteManagement",
  },
  {
    key: "fund-management",
    icon: React.createElement(WalletOutlined),
    label: "fundManagement",
  },
  {
    key: "blog-management",
    icon: React.createElement(FileTextOutlined),
    label: "blogManagement",
  },
  {
    key: "event-management",
    icon: React.createElement(CalendarOutlined),
    label: "eventManagement",
  },
  {
    key: "community-content",
    icon: React.createElement(GlobalOutlined),
    label: "communityContent",
  },
  {
    key: "mentorship-management",
    icon: React.createElement(SolutionOutlined),
    label: "mentorshipManagement",
  },
  {
    key: "audit-log",
    icon: React.createElement(AuditOutlined),
    label: "auditLog",
  },
  {
    key: "season-management",
    icon: React.createElement(TrophyOutlined),
    label: "seasonManagement",
  },
  {
    key: "project-management",
    icon: React.createElement(AimOutlined),
    label: "projectManagement",
  },
  {
    key: "resource-management",
    icon: React.createElement(BookOutlined),
    label: "resourceManagement",
  },
  {
    key: "album-management",
    icon: React.createElement(PictureOutlined),
    label: "albumManagement",
  },
  {
    key: "image-activity-management",
    icon: React.createElement(FileImageOutlined),
    label: "imageActivityManagement",
  },
  {
    key: "department-management",
    icon: React.createElement(TeamOutlined),
    label: "departmentManagement",
  },
  {
    key: "position-management",
    icon: React.createElement(IdcardOutlined),
    label: "positionManagement",
  },
  {
    key: "major-management",
    icon: React.createElement(ReadOutlined),
    label: "majorManagement",
  },
  {
    key: "social-management",
    icon: React.createElement(LinkOutlined),
    label: "socialManagement",
  },
];
