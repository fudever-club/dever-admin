import styled from "styled-components";

export const PageWrapper = styled.section`
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 16px 20px;
  box-sizing: border-box;
`;

export const Head = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
`;

export const TableWrapper = styled.div`
  width: 100%;
  margin-bottom: 24px;
`;

export const FilterWrapper = styled.div`
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
  margin-bottom: 16px;
`;
