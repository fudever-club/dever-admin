"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { MenuFoldOutlined, MenuUnfoldOutlined, CloseOutlined } from "@ant-design/icons";
import { Flex, Layout, Menu, Popover, message } from "antd";
import { useParams, usePathname } from "next/navigation";
import { AppProgressBar, useRouter } from "next-nprogress-bar";
import { useLocale } from "next-intl";

import DropdownMenu from "./DropdownMenu";
import SelectLanguage from "./SelectLanguage";
import NotificationBell from "@/components/ui/NotificationBell";
import Typography from "../../common/Typography";
import LoadingScreen from "../../common/LoadingScreen";
import DeverRouteLoader from "@/components/ui/DeverRouteLoader";
import ErrorBoundary from "../../common/ErrorBoundary";

import { sidebarMenu } from "@/helpers/data/sidebarMenu";
import { useTranslation } from "@/app/i18n/client";
import { themes } from "@/style/themes";
import { useVerifyTokenMutation } from "@/store/queries/auth";
import { useAppDispatch, useAppSelector } from "@/hooks/redux-toolkit";
import { setAuthenticatedUser } from "@/store/slices/auth";
import { clearSession } from "@/store/session";
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
  const { userInfo } = useAppSelector((state) => state.auth);
  const [headerAvatarError, setHeaderAvatarError] = useState<boolean>(false);

  useEffect(() => {
    setHeaderAvatarError(false);
  }, [userInfo?.avatar]);

  const safeHeaderAvatar = !headerAvatarError && userInfo?.avatar
    ? userInfo.avatar
    : "/images/avatar/avatar.jpg";
  const localActive = useLocale();
  const pathname = usePathname();

  const { t } = useTranslation(params?.locale as string, "layout");

  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const [isShowMenu, setIsShowMenu] = useState<boolean>(false);
  const [isAuth, setIsAuth] = useState<boolean>(false);
  const [loadingVisible, setLoadingVisible] = useState<boolean>(true);
  const [loadingFadeOut, setLoadingFadeOut] = useState<boolean>(false);

  const [verifyToken] = useVerifyTokenMutation();

  useEffect(() => {
    let active = true;
    let request: ReturnType<typeof verifyToken> | undefined;
    let revealTimer: ReturnType<typeof setTimeout> | undefined;
    let hideTimer: ReturnType<typeof setTimeout> | undefined;
    const startTime = Date.now();
    setIsAuth(false);
    setLoadingVisible(true);
    setLoadingFadeOut(false);

    const verify = async () => {
      try {
        const token = webStorageClient.getToken();
        if (!token) throw new Error("Missing session");
        request = verifyToken(token);
        const res = await request.unwrap();
        if (!active) return;
        if (res?.data?.isAdmin !== true) throw new Error("Administrator access required");

        revealTimer = setTimeout(() => {
          dispatch(setAuthenticatedUser(res.data));
          setIsAuth(true);
          setLoadingFadeOut(true);
          hideTimer = setTimeout(() => setLoadingVisible(false), 350);
        }, Math.max(0, 450 - (Date.now() - startTime)));
      } catch {
        if (!active) return;
        dispatch(clearSession());
        setIsAuth(false);
        router.replace(`/${localActive}/sign-in`);
      }
    };
    void verify();
    return () => {
      active = false;
      request?.abort();
      clearTimeout(revealTimer);
      clearTimeout(hideTimer);
    };
  }, [dispatch, localActive, router, verifyToken]);

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
      {loadingVisible && <LoadingScreen fadeOut={loadingFadeOut} />}
      {isAuth && userInfo?.isAdmin === true && (
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
            <S.LogoWrapper>
              <div className="demo-logo-vertical">
                <Flex align="center" justify="space-between">
                  <Flex
                    align="center"
                    gap={12}
                    onClick={() => {
                      setMobileOpen(false);
                      router?.push(`/${localActive}/user-management`);
                    }}
                    style={{ cursor: "pointer", flex: 1 }}
                  >
                    <Image
                      alt="DEVER Logo"
                      src={"/icons/layout/fu-dever-logo.png"}
                      width={36}
                      height={36}
                      priority
                      style={{ objectFit: "contain" }}
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
                  {mobileOpen && (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setMobileOpen(false);
                      }}
                      style={{
                        padding: "6px 8px",
                        cursor: "pointer",
                        borderRadius: "6px",
                        color: "#64748b",
                        fontSize: "16px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      aria-label="Đóng thanh điều hướng"
                    >
                      <CloseOutlined />
                    </div>
                  )}
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
                          src={safeHeaderAvatar}
                          alt="avatar"
                          width={36}
                          height={36}
                          unoptimized={safeHeaderAvatar.endsWith('.svg') || safeHeaderAvatar.startsWith('data:')}
                          onError={() => setHeaderAvatarError(true)}
                          style={{ objectFit: "cover", width: 36, height: 36, borderRadius: "50%" }}
                        />
                      }
                    />
                  </Flex>
                </Popover>
              </Flex>
            </S.HeaderCustom>

            <S.ContentCustom>
              <ErrorBoundary scope="page">{children}</ErrorBoundary>
            </S.ContentCustom>

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
