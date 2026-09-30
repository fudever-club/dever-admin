"use client";

import { endpointAdminAudit } from "@/helpers/enpoints";
import { baseApi } from "../base";

export interface AdminAuditLogParams {
  page: number;
  limit: number;
  action?: string;
  targetType?: string;
  actorId?: string;
  targetId?: string;
}

export interface AdminAuditSummaryParams {
  days: number;
}

export interface AdminAuditSummarySeriesItem {
  date: string;
  action: string;
  count: number;
}

export interface AdminAuditSummaryData {
  days: number;
  byAction: Record<string, number>;
  series: AdminAuditSummarySeriesItem[];
}

export interface AdminAuditSummaryResponse {
  status: string;
  data: AdminAuditSummaryData;
}

export const adminAuditApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getAdminAuditLog: build.query<any, AdminAuditLogParams>({
      query: ({ page, limit, action, targetType, actorId, targetId }) => {
        // Whitelist only — empty strings are dropped so the backend
        // never receives ?action=&targetType= noise. fetchBaseQuery
        // encodes params (URLSearchParams), no manual querystring concat.
        const params: Record<string, string | number> = {
          page: Number.isSafeInteger(page) && page > 0 ? page : 1,
          limit: Number.isSafeInteger(limit) && limit > 0 ? limit : 20,
        };
        if (action) params.action = action;
        if (targetType) params.targetType = targetType;
        if (actorId) params.actorId = actorId;
        if (targetId) params.targetId = targetId;
        return {
          url: endpointAdminAudit.AUDIT_LOG,
          params,
          method: "GET",
        };
      },
      providesTags: ["AdminAudit"],
    }),
    getAdminAuditSummary: build.query<AdminAuditSummaryResponse, AdminAuditSummaryParams>({
      query: ({ days }) => {
        // Backend chấp nhận days=1..90; clamp defensive để không bắn request rác.
        const safeDays =
          Number.isSafeInteger(days) && days >= 1 && days <= 90 ? days : 30;
        return {
          url: endpointAdminAudit.SUMMARY,
          params: { days: safeDays },
          method: "GET",
        };
      },
      providesTags: ["AdminAudit"],
    }),
  }),
});

export const { useGetAdminAuditLogQuery, useGetAdminAuditSummaryQuery } = adminAuditApi;
