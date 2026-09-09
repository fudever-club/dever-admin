import React, { useState, useEffect } from "react";
import { Avatar, Flex, message } from "antd";
import { GlobalOutlined, UserOutlined } from "@ant-design/icons";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useLocale } from "next-intl";
import { useRouter } from "next-nprogress-bar";

import Divider from "@/components/core/common/Divider";

import { useTranslation } from "@/app/i18n/client";
import { userDropdownMenu } from "@/helpers/data/userDropdownMenu";
import webStorageClient from "@/utils/webStorageClient";
import { useAppSelector } from "@/hooks/redux-toolkit";

import * as S from "./styles";

function DropdownMenu() {
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
  const userInfo = useAppSelector((state) => state.auth.userInfo);
  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => {
    setAvatarError(false);
  }, [userInfo?.avatar]);

  const safeMenuAvatar = !avatarError && userInfo?.avatar
    ? userInfo.avatar
    : "/images/avatar/avatar.jpg";

  const clientAppUrl = (process.env.NEXT_PUBLIC_CLIENT_APP_URL || process.env.NEXT_PUBLIC_CLIENT_URL || "https://client.fudever.com").replace(/\/$/, "");
  const landingUrl = (process.env.NEXT_PUBLIC_LANDING_URL || "https://fudever.com").replace(/\/$/, "");

  const { t } = useTranslation(params?.locale as string, "layout");

  const sideBarMenuFormat = userDropdownMenu?.map((item: any) => ({
    ...item,
    label: t(item.label),
    link: `/${item.key}`,
  }));

  const handleClickItem = (key: string) => {
    switch (key) {
      case "profile":
        if (!userInfo?._id) {
          message.error("Không thể xác định tài khoản hiện tại. Vui lòng đăng nhập lại.");
          return;
        }
        window.open(
          `${clientAppUrl}/${locale}/profile/${encodeURIComponent(userInfo._id)}`,
          "_blank",
          "noopener,noreferrer"
        );
        break;
      case "setting":
        window.open(`${clientAppUrl}/${locale}/settings`, "_blank", "noopener,noreferrer");
        break;
      case "logout":
        webStorageClient.remove("_access_token");
        router.push(`/${locale}/sign-in`);
        break;
      default:
        break;
    }
  };

  return (
    <div style={{ minWidth: 230, maxWidth: 280 }}>
      <Flex gap={10} align="center" style={{ padding: "4px 4px 6px 4px" }}>
        <Avatar
          size={36}
          src={
            <Image
              src={safeMenuAvatar}
              alt="avatar"
              width={36}
              height={36}
              unoptimized={safeMenuAvatar.endsWith('.svg') || safeMenuAvatar.startsWith('data:')}
              onError={() => setAvatarError(true)}
              style={{ objectFit: "cover", width: 36, height: 36, borderRadius: "50%" }}
            />
          }
        />
        <Flex vertical style={{ minWidth: 0, flex: 1 }}>
          <span
            style={{
              fontWeight: 700,
              fontSize: "14px",
              color: "#0f172a",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {[userInfo?.firstname, userInfo?.lastname].filter(Boolean).join(" ") || "Thành viên FU-DEVER"}
          </span>
          <span
            style={{
              fontSize: "12px",
              color: "#64748b",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              display: "block",
            }}
            title={userInfo?.email || undefined}
          >
            @{userInfo?.email || "fudever-club"}
          </span>
        </Flex>
      </Flex>
      <Divider $margin={6} />
      <Flex vertical gap={4} style={{ padding: "4px" }}>
        <a
          href={landingUrl}
          target="_blank"
          rel="noreferrer"
          style={{
            fontSize: "12.5px",
            color: "#334155",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 8px",
            borderRadius: "6px",
            textDecoration: "none",
            fontWeight: 500,
            transition: "background-color 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#f1f5f9";
            e.currentTarget.style.color = "#0066CC";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.color = "#334155";
          }}
        >
          <GlobalOutlined style={{ color: "#0066CC" }} aria-hidden="true" /> Trang Chủ Landing Page
        </a>
        <a
          href={`${clientAppUrl}/${locale}/dashboard`}
          target="_blank"
          rel="noreferrer"
          style={{
            fontSize: "12.5px",
            color: "#334155",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 8px",
            borderRadius: "6px",
            textDecoration: "none",
            fontWeight: 500,
            transition: "background-color 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#f1f5f9";
            e.currentTarget.style.color = "#0066CC";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.color = "#334155";
          }}
        >
          <UserOutlined style={{ color: "#0066CC" }} aria-hidden="true" /> Cổng Member Portal
        </a>
      </Flex>
      <Divider $margin={4} />
      <S.MenuCustom
        items={sideBarMenuFormat}
        onClick={(e) => handleClickItem(e?.key)}
      />
    </div>
  );
}

export default DropdownMenu;
