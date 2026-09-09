import styled from "styled-components";
import { Select as SelectFromAntd } from "antd";

export const PageWrapper = styled.section`
  display: flex;
  flex-direction: column;

  width: 100%;
  height: 100%;

  padding-bottom: 16px;

  .ant-select {
    width: 100%;
  }
`;

export const Head = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    margin-bottom: 16px;

    h2 {
      font-size: 22px !important;
      margin-bottom: 0 !important;
      text-align: left;
    }

    button {
      width: 100%;
      height: 42px;
      font-weight: 600;
      border-radius: 10px;
    }
  }
`;

export const TableWrapper = styled.div`
  width: 100%;
  margin-bottom: 24px;
  margin-top: 20px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;

  .ant-table-wrapper {
    width: 100%;
  }

  .ant-table {
    border-radius: 12px;
    overflow: hidden;
  }
`;

export const FilterWrapper = styled.div`
  width: 100%;

  display: flex;
  justify-content: space-between;
  align-items: flex-start;

  gap: 8px;
  margin-bottom: 20px;

  input[type="file"] {
    width: 0;
    height: 0;
  }

  .item {
    width: 25%;
  }

  .input_csv {
    text-align: right;
  }

  @media (max-width: 640px) {
    align-items: stretch;
    flex-direction: column;
    gap: 16px;
    margin-bottom: 16px;

    .item {
      width: 100%;
    }

    .input_csv {
      text-align: left;

      .ant-space {
        width: 100%;
        align-items: stretch !important;
      }

      .ant-space-item {
        width: 100%;
      }

      button {
        flex: 1;
        height: 40px;
        border-radius: 8px;
      }
    }
  }
`;
export const Select = styled(SelectFromAntd)`
  width: 100%;
`;
