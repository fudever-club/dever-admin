"use client";

import React, { useEffect, useState, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import styled, { keyframes } from "styled-components";

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const slideDown = keyframes`
  0% { opacity: 0; transform: translate(-50%, -8px); }
  100% { opacity: 1; transform: translate(-50%, 0); }
`;

const BarContainer = styled.div<{ $visible: boolean }>`
  pointer-events: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  z-index: 999999;
  background: transparent;
  overflow: hidden;
  opacity: ${(props) => (props.$visible ? 1 : 0)};
  transition: opacity 0.2s ease-out;
`;

const BarFill = styled.div<{ $width: number }>`
  height: 100%;
  width: ${(props) => props.$width}%;
  background: linear-gradient(90deg, #0066CC 0%, #0080FF 50%, #38BDF8 100%);
  box-shadow: 0 0 12px #38BDF8, 0 0 6px #0080FF;
  transition: width 0.2s ease-out;
`;

const FloatingPill = styled.div`
  position: fixed;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-radius: 9999px;
  background: rgba(15, 23, 42, 0.9);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 10px 25px -5px rgba(0, 102, 204, 0.25);
  color: #FFFFFF;
  font-size: 12px;
  font-weight: 600;
  animation: ${slideDown} 0.2s ease-out;
  z-index: 999999;
  pointer-events: none;
`;

const MiniSpinner = styled.div`
  width: 14px;
  height: 14px;
  border: 2px solid transparent;
  border-top-color: #38BDF8;
  border-right-color: #0080FF;
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
`;

/**
 * Trigger programmatic route loading indicator
 */
export function triggerDeverRouteLoader() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("dever:nav-start"));
  }
}

/**
 * DeverRouteLoader for Admin Dashboard
 *
 * Provides instant feedback during route changes across:
 * - Clicks on standard anchor tags
 * - Clicks on Ant Design sidebar menu items
 * - Logo & switcher navigation
 */
export default function DeverRouteLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [showPill, setShowPill] = useState<boolean>(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pillTimerRef = useRef<NodeJS.Timeout | null>(null);

  const startProgress = () => {
    setIsNavigating(true);
    setProgress(20);

    if (timerRef.current) clearInterval(timerRef.current);
    if (pillTimerRef.current) clearTimeout(pillTimerRef.current);

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev < 65) return prev + Math.random() * 15;
        if (prev < 88) return prev + Math.random() * 5;
        if (prev < 96) return prev + 0.5;
        return prev;
      });
    }, 120);

    pillTimerRef.current = setTimeout(() => {
      setShowPill(true);
    }, 180);
  };

  useEffect(() => {
    setProgress(100);
    const finishTimer = setTimeout(() => {
      setIsNavigating(false);
      setShowPill(false);
      setProgress(0);
    }, 280);

    return () => clearTimeout(finishTimer);
  }, [pathname, searchParams]);

  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      if (!el) return;

      // 1. Check for standard <a> tag
      const anchor = el.closest("a");
      if (anchor) {
        const href = anchor.getAttribute("href");
        if (
          !href ||
          href.startsWith("#") ||
          href.startsWith("mailto:") ||
          href.startsWith("tel:") ||
          anchor.getAttribute("target") === "_blank" ||
          e.metaKey ||
          e.ctrlKey ||
          e.shiftKey
        ) {
          return;
        }

        try {
          const targetUrl = new URL(href, window.location.href);
          const currentUrl = new URL(window.location.href);

          if (
            targetUrl.origin === currentUrl.origin &&
            (targetUrl.pathname !== currentUrl.pathname || targetUrl.search !== currentUrl.search)
          ) {
            startProgress();
            return;
          }
        } catch {
          // ignore
        }
      }

      // 2. Check for Ant Design Menu Items or Logo clicks
      const menuItem = el.closest(".ant-menu-item, [role='menuitem'], .ant-layout-sider-children");
      if (menuItem) {
        startProgress();
      }
    };

    const handleCustomNav = () => {
      startProgress();
    };

    document.addEventListener("click", handleDocumentClick, { capture: true });
    window.addEventListener("dever:nav-start", handleCustomNav);

    return () => {
      document.removeEventListener("click", handleDocumentClick, { capture: true });
      window.removeEventListener("dever:nav-start", handleCustomNav);
      if (timerRef.current) clearInterval(timerRef.current);
      if (pillTimerRef.current) clearTimeout(pillTimerRef.current);
    };
  }, []);

  return (
    <>
      <BarContainer aria-hidden="true" $visible={isNavigating}>
        <BarFill $width={progress} />
      </BarContainer>

      {showPill && isNavigating && (
        <FloatingPill>
          <MiniSpinner />
          <span>Đang chuyển trang quản trị DEVER...</span>
        </FloatingPill>
      )}
    </>
  );
}
