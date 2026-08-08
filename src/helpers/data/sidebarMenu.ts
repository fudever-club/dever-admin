import React from "react";
import { MenuProps } from "antd";
import {
  TeamOutlined,
  UserOutlined,
  BookOutlined,
  IdcardOutlined,
  LinkOutlined,
  AimOutlined,
  CalendarOutlined,
} from "@ant-design/icons";

export const sidebarMenu: MenuProps["items"] = [
  {
    key: "user-management",
    icon: React.createElement(UserOutlined),
    label: "usersManagement",
  },
  {
    key: "event-management",
    icon: React.createElement(CalendarOutlined),
    label: "Quản lý Sự kiện & Workshop",
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
    icon: React.createElement(BookOutlined),
    label: "majorManagement",
  },
  {
    key: "social-management",
    icon: React.createElement(LinkOutlined),
    label: "socialManagement",
  },
  {
    key: "image-activity-management",
    icon: React.createElement(LinkOutlined),
    label: "imageActivityManagement",
  },
  {
    key: "album-management",
    icon: React.createElement(LinkOutlined),
    label: "albumManagement",
  },
  {
    key: "project-management",
    icon: React.createElement(AimOutlined),
    label: "projectManagement",
  },
  {
    key: "resource-management",
    icon: React.createElement(BookOutlined),
    label: "Quản lý Tài liệu & Slide",
  },
  {
    key: "community-content",
    icon: React.createElement(AimOutlined),
    label: "Nội dung cộng đồng",
  },
];
