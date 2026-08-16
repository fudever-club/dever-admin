import styled from "styled-components";
import { Avatar, Layout } from "antd";

export const MobileBackdrop = styled.div<{ $visible: boolean }>`
  display: none;
  @media (max-width: 991.9px) {
    display: ${(props) => (props.$visible ? "block" : "none")};
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 1000;
    backdrop-filter: blur(3px);
    transition: opacity 0.3s ease;
  }
`;

export const SiderCustom = styled(Layout.Sider)<{ $mobileOpen?: boolean }>`
  height: 100vh;
  background-color: ${(props) =>
    props?.theme?.colors?.backgroundSecondary} !important;
  border-right: 1px solid ${(props) => props?.theme?.colors?.secondary} !important;
  position: fixed !important;
  left: 0;
  top: 0;
  bottom: 0;
  z-index: 1001 !important;
  overflow: auto;
  transition: transform 0.3s ease, width 0.2s ease !important;

  @media (max-width: 991.9px) {
    transform: translateX(${(props) => (props.$mobileOpen ? "0" : "-100%")});
    box-shadow: ${(props) =>
      props.$mobileOpen ? "0 0 24px rgba(0,0,0,0.3)" : "none"};
  }
`;

export const LogoWrapper = styled.div`
  padding: 16px;
  cursor: pointer;
`;

export const ButtonWrap = styled.div<{ $collapsed: boolean }>`
  width: fit-content;
  line-height: normal;
  padding: 6px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  transform: scaleX(${(props) => (props?.$collapsed ? -1 : 1)});

  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }
`;

export const LayoutCustom = styled(Layout)<{ $collapsed: boolean }>`
  margin-left: 0;
  transition: margin-left 0.2s ease;
  min-width: 0;
  min-height: 100vh;
  background-color: ${(props) =>
    props?.theme?.colors?.backgroundPrimary} !important;

  @media (min-width: 992px) {
    margin-left: ${(props) => (props?.$collapsed ? "80px" : "200px")};
  }
`;

export const HeaderCustom = styled(Layout.Header)<{ $collapsed: boolean }>`
  width: 100% !important;
  height: 64px !important;
  padding: 12px 16px !important;
  background-color: ${(props) =>
    props?.theme?.colors?.backgroundSecondary} !important;
  border-bottom: 1px solid ${(props) => props?.theme?.colors?.secondary} !important;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: fixed !important;
  top: 0;
  left: 0;
  z-index: 999 !important;
  line-height: normal !important;
  transition: width 0.2s ease, left 0.2s ease;

  @media (min-width: 992px) {
    left: ${(props) => (props?.$collapsed ? "80px" : "200px")};
    width: calc(
      100% - ${(props) => (props?.$collapsed ? "80px" : "200px")}
    ) !important;
    padding: 16px 24px !important;
  }
`;

export const ContentCustom = styled(Layout.Content)`
  min-height: calc(100vh - 140px) !important;
  margin: 76px 12px 16px 12px;
  min-width: 0;
  overflow-x: auto;

  @media (min-width: 640px) {
    margin: 80px 16px 20px 16px;
  }

  @media (min-width: 1024px) {
    margin: 80px 24px 24px 24px;
  }
`;

export const FooterCustom = styled(Layout.Footer)`
  background-color: ${(props) =>
    props?.theme?.colors?.backgroundSecondary} !important;
  border-top: 1px solid ${(props) => props?.theme?.colors?.secondary} !important;
  padding: 16px 24px;
  text-align: center;
  font-size: 13px;
  color: #64748b;
`;

export const AvatarCustom = styled(Avatar)`
  border: 1px solid ${(props) => props?.theme?.colors?.primaryLight} !important;
  cursor: pointer;
`;
