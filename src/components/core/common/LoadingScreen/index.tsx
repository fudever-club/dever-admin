"use client";

import React from "react";
import * as S from "./style";

interface LoadingScreenProps {
  message?: string;
  fadeOut?: boolean;
}

function LoadingScreen({ message, fadeOut = false }: LoadingScreenProps) {
  const displayMessage = message || "Đang xác thực quyền quản trị...";

  return (
    <S.wrapper role="status" aria-live="polite" $fadeOut={fadeOut}>
      {/* Central Modern Micro Dual-Ring Spinner */}
      <S.SpinnerContainer>
        <S.OuterRing />
        <S.InnerRing />
        <S.CenterBadge>&lt;/&gt;</S.CenterBadge>
      </S.SpinnerContainer>

      {/* Brand & Status Text */}
      <S.BrandTitle>DEVER ADMIN CONSOLE</S.BrandTitle>
      <S.StatusText>{displayMessage}</S.StatusText>

      {/* Modern Shimmer Progress Indicator */}
      <S.ShimmerBarWrapper>
        <S.ShimmerBar />
      </S.ShimmerBarWrapper>
    </S.wrapper>
  );
}

export default LoadingScreen;
