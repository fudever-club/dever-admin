import { Avatar, Flex } from "antd";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useLocale } from "next-intl";
import { useRouter } from "next-nprogress-bar";

import Divider from "@/components/core/common/Divider";

import { useTranslation } from "@/app/i18n/client";
import { userDropdownMenu } from "@/helpers/data/userDropdownMenu";
import webStorageClient from "@/utils/webStorageClient";

import * as S from "./styles";

function DropdownMenu() {
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();

  const { t } = useTranslation(params?.locale as string, "layout");

  const sideBarMenuFormat = userDropdownMenu?.map((item: any) => ({
    ...item,
    label: t(item.label),
    link: `/${item.key}`,
  }));

  const handleClickItem = (key: string) => {
    switch (key) {
      case "profile":
        console.log("profile");
        break;
      case "setting":
        console.log("setting");
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
              src={"/images/avatar/avatar.jpg"}
              alt="avatar"
              width={28}
              height={28}
            />
          }
        />
        <Flex vertical>
          <p>Tran Van Bao Thang</p>
          <a href="https://github.com/fudever-club" target="_blank" rel="noreferrer">
            @fudever-club
          </a>
        </Flex>
      </Flex>
      <Divider $margin={8} />
      <div className="flex flex-col gap-1 p-1">
        <a
          href="https://fu-dever-landingpage-v2.vercel.app"
          target="_blank"
          rel="noreferrer"
          className="text-xs text-gray-700 hover:text-[#0098FF] flex items-center gap-2 p-1.5 rounded hover:bg-blue-50 transition-colors"
        >
          <span>🌐</span> Trang Chủ Landing Page
        </a>
        <a
          href="https://dever-client-taupe.vercel.app/vi/sign-in"
          target="_blank"
          rel="noreferrer"
          className="text-xs text-gray-700 hover:text-[#0098FF] flex items-center gap-2 p-1.5 rounded hover:bg-blue-50 transition-colors"
        >
          <span>👤</span> Cổng Member Portal
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
