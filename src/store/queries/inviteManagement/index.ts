"use client";

import { endpointInvite } from "@/helpers/enpoints";
import { baseApi } from "../base";

export type InviteStatus = "pending" | "accepted" | "revoked";

export interface ListInvitesParams {
  page: number;
  limit: number;
  status?: InviteStatus | "";
}

export interface CreateInvitePayload {
  email: string;
  firstname?: string;
  lastname?: string;
}

export interface BulkInvitesPayload {
  users: CreateInvitePayload[];
}

export const inviteManagementApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listInvites: build.query<any, ListInvitesParams>({
      query: ({ page, limit, status }) => {
        const params: Record<string, string | number> = {
          page: Number.isSafeInteger(page) && page > 0 ? page : 1,
          limit: Number.isSafeInteger(limit) && limit > 0 ? limit : 10,
        };
        if (status) params.status = status;
        return {
          url: endpointInvite.LIST,
          params,
          method: "GET",
          flashError: true,
        };
      },
      providesTags: ["Invites"],
    }),
    createInvite: build.mutation<any, CreateInvitePayload>({
      query: (data) => ({
        url: endpointInvite.CREATE,
        method: "POST",
        body: data,
        flashError: true,
      }),
      invalidatesTags: ["Invites"],
    }),
    bulkInvites: build.mutation<any, BulkInvitesPayload>({
      query: (data) => ({
        url: endpointInvite.BULK,
        method: "POST",
        body: data,
        flashError: true,
      }),
      invalidatesTags: ["Invites"],
    }),
    revokeInvite: build.mutation<any, string>({
      query: (id: string) => ({
        url: endpointInvite.REVOKE.replace("{id}", id),
        method: "PATCH",
        flashError: true,
      }),
      invalidatesTags: ["Invites"],
    }),
    resendInvite: build.mutation<any, string>({
      query: (id: string) => ({
        url: endpointInvite.RESEND.replace("{id}", id),
        method: "POST",
        flashError: true,
      }),
      invalidatesTags: ["Invites"],
    }),
  }),
});

export const {
  useListInvitesQuery,
  useCreateInviteMutation,
  useBulkInvitesMutation,
  useRevokeInviteMutation,
  useResendInviteMutation,
} = inviteManagementApi;
