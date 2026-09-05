import styled, { keyframes } from "styled-components";

const spinClockwise = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const spinCounterClockwise = keyframes`
  0% { transform: rotate(360deg); }
  100% { transform: rotate(0deg); }
`;

const pulseGlow = keyframes`
  0%, 100% { opacity: 0.8; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.05); }
`;

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

export const wrapper = styled.div<{ $fadeOut?: boolean }>`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: fixed;
  z-index: 99999;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: radial-gradient(circle at 50% 40%, rgba(240, 247, 255, 0.98) 0%, rgba(255, 255, 255, 0.99) 100%);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  padding: 24px;
  box-sizing: border-box;
  transition: opacity 0.35s ease-out, visibility 0.35s ease-out;
  opacity: ${(props) => (props.$fadeOut ? 0 : 1)};
  pointer-events: ${(props) => (props.$fadeOut ? "none" : "auto")};

  .dark & {
    background: radial-gradient(circle at 50% 40%, rgba(10, 25, 47, 0.98) 0%, rgba(2, 12, 27, 0.99) 100%);
  }
`;

export const SpinnerContainer = styled.div`
  position: relative;
  width: 76px;
  height: 76px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
`;

export const OuterRing = styled.div`
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 3px solid transparent;
  border-top-color: #0066CC;
  border-right-color: #004C99;
  animation: ${spinClockwise} 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
  box-shadow: 0 0 16px rgba(0, 102, 204, 0.25);
`;

export const InnerRing = styled.div`
  position: absolute;
  inset: 10px;
  border-radius: 50%;
  border: 2.5px solid transparent;
  border-bottom-color: #38BDF8;
  border-left-color: #0066CC;
  animation: ${spinCounterClockwise} 1s cubic-bezier(0.5, 0, 0.5, 1) infinite;
`;

export const CenterBadge = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(235, 244, 255, 0.9), rgba(219, 234, 254, 0.9));
  display: flex;
  align-items: center;
  justify-content: center;
  color: #0066CC;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 13px;
  font-weight: 800;
  box-shadow: 0 4px 12px rgba(0, 102, 204, 0.15), inset 0 1px 2px rgba(255, 255, 255, 0.8);
  animation: ${pulseGlow} 2s ease-in-out infinite;

  .dark & {
    background: linear-gradient(135deg, rgba(15, 30, 60, 0.9), rgba(30, 58, 138, 0.6));
    color: #38BDF8;
    box-shadow: 0 4px 16px rgba(56, 189, 248, 0.25);
  }
`;

export const BrandTitle = styled.h2`
  font-size: 18px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  background: linear-gradient(135deg, #004C99 0%, #0066CC 50%, #0080FF 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0 0 6px 0;
  font-family: inherit;

  .dark & {
    background: linear-gradient(135deg, #60A5FA 0%, #38BDF8 50%, #93C5FD 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
`;

export const StatusText = styled.p`
  font-size: 13px;
  font-weight: 600;
  color: #64748B;
  margin: 0 0 20px 0;
  letter-spacing: 0.02em;

  .dark & {
    color: #94A3B8;
  }
`;

export const ShimmerBarWrapper = styled.div`
  width: 140px;
  height: 3px;
  background: rgba(226, 232, 240, 0.8);
  border-radius: 9999px;
  overflow: hidden;
  position: relative;

  .dark & {
    background: rgba(30, 41, 59, 0.8);
  }
`;

export const ShimmerBar = styled.div`
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent 0%,
    #0066CC 40%,
    #38BDF8 50%,
    #0066CC 60%,
    transparent 100%
  );
  background-size: 200% 100%;
  animation: ${shimmer} 1.6s infinite linear;
`;
