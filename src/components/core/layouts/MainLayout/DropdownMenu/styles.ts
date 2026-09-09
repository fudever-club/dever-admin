import { Menu, Popover } from "antd";
import styled from "styled-components";

export const MenuCustom = styled(Menu)`
  border-inline-end: none !important;

  .ant-menu-item {
    padding: 0 10px !important;
    height: 40px !important;
    line-height: 40px !important;
    display: flex !important;
    align-items: center !important;
    border-radius: 8px !important;
    margin: 4px 0 !important;
    font-size: 13.5px !important;
    transition: all 0.2s ease !important;

    &:active {
      transform: scale(0.98);
    }
  }
`;

export const PopoverCustom = styled(Popover)`
  cursor: pointer;
`;
