"use client";

import React, { useCallback, useLayoutEffect, useState } from "react";
import Image from "next/image";
import { MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";
import { Flex, Layout, Menu, Popover, message } from "antd";
import { useParams, usePathname } from "next/navigation";
import { AppProgressBar, useRouter } from "next-nprogress-bar";
import { useLocale } from "next-intl";

import DropdownMenu from "./DropdownMenu";
import SelectLanguage from "./SelectLanguage";
import NotificationBell from "@/components/ui/NotificationBell";
import Typography from "../../common/Typography";
import LoadingScreen from "../../common/LoadingScreen";

import { sidebarMenu } from "@/helpers/data/sidebarMenu";
import { useTranslation } from "@/app/i18n/client";
import { themes } from "@/style/themes";
import { useVerifyTokenMutation } from "@/store/queries/auth";
import { useAppDispatch, useAppSelector } from "@/hooks/redux-toolkit";
import { setAuthenticatedUser } from "@/store/slices/auth";
import webStorageClient from "@/utils/webStorageClient";
import themeColors from "@/style/themes/default/colors";

import * as S from "./styles";

const MainLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const userInfo = useAppSelector((state) => state.auth.userInfo);
  const localActive = useLocale();
  const pathname = usePathname();

  const { t } = useTranslation(params?.locale as string, "layout");

  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const [isShowMenu, setIsShowMenu] = useState<boolean>(false);
  const [isAuth, setIsAuth] = useState<boolean>(false);

  const [verifyToken] = useVerifyTokenMutation();

  const handleVerifyToken = useCallback(async () => {
    try {
      if (!webStorageClient.get("_access_token")) {
        message.error("Bạn cần đăng nhập để truy cập trang này");
        throw new Error("Bạn cần đăng nhập để truy cập trang này");
      }
      const res: any = await verifyToken(
        webStorageClient.get("_access_token") || "??"
      ).unwrap();
      if (!res?.data?.isAdmin) {
        message.error("Bạn không có quyền truy cập trang này");
        throw new Error("Bạn không có quyền truy cập trang này");
      }
      dispatch(setAuthenticatedUser(res.data));
      setIsAuth(true);
    } catch (error) {
      setIsAuth(false);
      webStorageClient.remove("_access_token");
      router.push(`/${localActive}/sign-in`);
    }
  }, [dispatch, localActive, router, verifyToken]);

  useLayoutEffect(() => {
    handleVerifyToken();
  }, [handleVerifyToken]);

  const sideBarMenuFormat = sidebarMenu?.map((item: any) => ({
    ...item,
    label: t(item.label),
    link: `/${item.key}`,
  }));

  const handleToggle = () => {
    if (typeof window !== "undefined" && window.innerWidth < 992) {
      setMobileOpen((prev) => !prev);
    } else {
      setCollapsed((prev) => !prev);
    }
  };

  const handleMenuClick = (key: string) => {
    setMobileOpen(false);
    router?.push(`/${localActive}/${key}`);
  };

  return (
    <>
      {!isAuth ? (
        <LoadingScreen />
      ) : (
        <Layout hasSider style={{ minHeight: "100vh" }}>
          <S.MobileBackdrop
            $visible={mobileOpen}
            onClick={() => setMobileOpen(false)}
          />

          <S.SiderCustom
            trigger={null}
            collapsible
            collapsed={collapsed}
            $mobileOpen={mobileOpen}
            width={200}
            collapsedWidth={80}
          >
            <S.LogoWrapper
              onClick={() => {
                setMobileOpen(false);
                router?.push(`/${localActive}/user-management`);
              }}
            >
              <div className="demo-logo-vertical">
                <Flex align="center" justify="space-between">
                  <Flex align="center" gap={12}>
                    <Image
                      alt="Logo"
                      src={"/icons/layout/logo.svg"}
                      width={36}
                      height={36}
                    />
                    {!collapsed && (
                      <Typography.Title
                        level={4}
                        $color={themes?.default?.colors?.primary}
                        style={{ margin: 0, fontWeight: 800 }}
                      >
                        DEVER ADMIN
                      </Typography.Title>
                    )}
                  </Flex>
                </Flex>
              </div>
            </S.LogoWrapper>

            <Menu
              mode="inline"
              selectedKeys={[pathname?.split("/")[2] || "user-management"]}
              items={sideBarMenuFormat}
              onClick={(e) => handleMenuClick(e?.key)}
            />
          </S.SiderCustom>

          <S.LayoutCustom $collapsed={collapsed}>
            <AppProgressBar
              height="4px"
              color={themeColors.primary}
              options={{ showSpinner: false }}
              shallowRouting
            />
            <S.HeaderCustom $collapsed={collapsed}>
              <S.ButtonWrap onClick={handleToggle} $collapsed={collapsed}>
                {collapsed ? (
                  <MenuUnfoldOutlined style={{ fontSize: "18px" }} />
                ) : (
                  <MenuFoldOutlined style={{ fontSize: "18px" }} />
                )}
              </S.ButtonWrap>

              <Flex align="center" gap={12}>
                <NotificationBell />
                <SelectLanguage />
                <Popover
                  content={<DropdownMenu />}
                  trigger="click"
                  open={isShowMenu}
                  onOpenChange={() => setIsShowMenu(!isShowMenu)}
                  placement="bottomRight"
                >
                  <Flex>
                    <S.AvatarCustom
                      size={36}
                      src={
                        <Image
                          src={userInfo?.avatar || "/images/avatar/avatar.jpg"}
                          alt="avatar"
                          width={64}
                          height={64}
                        />
                      }
                    />
                  </Flex>
                </Popover>
              </Flex>
            </S.HeaderCustom>

            <S.ContentCustom>{children}</S.ContentCustom>

            <S.FooterCustom>
              <p style={{ margin: 0 }}>
                Hệ thống Quản trị Ban Chủ nhiệm & Điều hành FU-DEVER Club
              </p>
            </S.FooterCustom>
          </S.LayoutCustom>
        </Layout>
      )}
    </>
  );
};

export default MainLayout;
