"use client";

import styled from "styled-components";

export const Wrapper = styled.section`
  width: 100%;

  display: flex;
  flex-direction: column;

  h4 {
    margin-top: 32px;
    margin-bottom: 16px;

    font-size: 24px;
  }
  > p {
    margin-bottom: 32px;
  }

  .ant-form-item {
    margin-bottom: 20px;
  }

  .ant-input:focus,
  .ant-input-affix-wrapper-focused {
    border-color: ${(prop) => prop.theme?.colors?.primary};
    box-shadow: 0 0 0 3px ${(prop) => prop.theme?.colors?.primaryOpacity} !important;
  }

  a:focus-visible,
  button:focus-visible,
  .ant-checkbox-input:focus-visible + .ant-checkbox-inner {
    outline: 3px solid ${(prop) => prop.theme?.colors?.primaryOpacity} !important;
    outline-offset: 2px;
  }
`;

export const AccessNotice = styled.div`
  display: grid;
  gap: 4px;
  margin-bottom: 24px;
  padding: 12px 14px;

  color: #004c99;
  background: #edf6ff;
  border: 1px solid #9dceff;
  border-radius: 8px;

  span {
    color: #315a85;
    line-height: 1.5;
  }
`;

export const RecoveryHint = styled.p`
  max-width: 230px;
  margin: 0;

  color: #52677d;
  font-size: 13px;
  line-height: 1.45;
  text-align: right;
`;

export const AccountHint = styled.p`
  margin: 4px 0 0;

  color: #52677d;
  font-size: 14px;
  line-height: 1.5;
  text-align: center;
`;
