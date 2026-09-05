"use client";

import React from "react";
import styled, { keyframes } from "styled-components";

const spinClockwise = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const spinCounterClockwise = keyframes`
  0% { transform: rotate(360deg); }
  100% { transform: rotate(0deg); }
`;

const Container = styled.div`
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #F8FAFC;
`;

const SpinnerWrapper = styled.div`
  position: relative;
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
`;

const OuterRing = styled.div`
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2.5px solid transparent;
  border-top-color: #0066CC;
  border-right-color: #0080FF;
  animation: ${spinClockwise} 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
`;

const InnerRing = styled.div`
  position: absolute;
  inset: 8px;
  border-radius: 50%;
  border: 2px solid transparent;
  border-bottom-color: #38BDF8;
  border-left-color: #0066CC;
  animation: ${spinCounterClockwise} 1s cubic-bezier(0.5, 0, 0.5, 1) infinite;
`;

const CodeBadge = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: #EFF6FF;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #0066CC;
  font-family: monospace;
  font-size: 11px;
  font-weight: 800;
`;

const Label = styled.p`
  font-size: 13px;
  font-weight: 600;
  color: #64748B;
  margin: 0;
`;

export default function RootLocaleAdminLoading() {
  return (
    <Container>
      <SpinnerWrapper>
        <OuterRing />
        <InnerRing />
        <CodeBadge>&lt;/&gt;</CodeBadge>
      </SpinnerWrapper>
      <Label>Đang khởi tạo hệ thống quản trị...</Label>
    </Container>
  );
}
