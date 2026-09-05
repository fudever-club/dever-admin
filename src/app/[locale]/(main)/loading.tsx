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
  min-height: 70vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 16px;
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
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
`;

const Label = styled.p`
  font-size: 13px;
  font-weight: 600;
  color: #64748B;
  margin: 0 0 24px 0;
  letter-spacing: 0.02em;
`;

const SkeletonGrid = styled.div`
  width: 100%;
  max-width: 960px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  opacity: 0.5;
`;

const SkeletonCard = styled.div`
  padding: 20px;
  border-radius: 16px;
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
`;

const SkeletonBlock = styled.div<{ height?: string; width?: string; mb?: string }>`
  height: ${(props) => props.height || "16px"};
  width: ${(props) => props.width || "100%"};
  margin-bottom: ${(props) => props.mb || "12px"};
  background: #F1F5F9;
  border-radius: 8px;
`;

export default function AdminLoading() {
  return (
    <Container>
      <SpinnerWrapper>
        <OuterRing />
        <InnerRing />
        <CodeBadge>&lt;/&gt;</CodeBadge>
      </SpinnerWrapper>

      <Label>Đang tải dữ liệu quản trị...</Label>

      <SkeletonGrid>
        {[1, 2, 3].map((i) => (
          <SkeletonCard key={i}>
            <SkeletonBlock height="120px" mb="16px" />
            <SkeletonBlock width="70%" />
            <SkeletonBlock width="45%" mb="0px" />
          </SkeletonCard>
        ))}
      </SkeletonGrid>
    </Container>
  );
}
