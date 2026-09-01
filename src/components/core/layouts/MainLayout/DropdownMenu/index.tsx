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
    <Flex vertical>
      <Flex gap={8} align="center">
        <Avatar
          size={28}
          src={
            <Image
              src={userInfo?.avatar || "/images/avatar/avatar.jpg"}
              alt="avatar"
              width={28}
              height={28}
            />
          }
        />
        <Flex vertical>
          <p>{[userInfo?.firstname, userInfo?.lastname].filter(Boolean).join(" ") || "Thành viên FU-DEVER"}</p>
          <span className="text-xs text-gray-500">@{userInfo?.email || "fudever-club"}</span>
        </Flex>
      </Flex>
      <Divider $margin={8} />
      <div className="flex flex-col gap-1 p-1">
        <a
          href={landingUrl}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-slate-700 hover:text-[#0066CC] flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors font-medium"
        >
          <GlobalOutlined aria-hidden="true" /> Trang Chủ Landing Page
        </a>
        <a
          href={`${clientAppUrl}/${locale}/dashboard`}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-slate-700 hover:text-[#0066CC] flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors font-medium"
        >
          <UserOutlined aria-hidden="true" /> Cổng Member Portal
        </a>
      </div>
      <Divider $margin={4} />
      <S.MenuCustom
        items={sideBarMenuFormat}
        onClick={(e) => handleClickItem(e?.key)}
      />
    </Flex>
  );
}

export default DropdownMenu;
