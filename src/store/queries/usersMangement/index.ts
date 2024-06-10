"use client";

import { endpointAuth, endpointUsersManagement } from "@/helpers/enpoints";
import { baseApi } from "../base";

export const authAPI = baseApi.injectEndpoints({
  endpoints: (build) => ({
    createManyUsersByCSV: build.mutation({
      query: (data: any) => ({
        url: endpointUsersManagement.CREATE_USERS_BY_CSV,
        method: "POST",
        body: data,
        flashError: true,
      }),
    }),
    verifyToken: build.mutation({
      query: (token: string) => ({
        url: endpointAuth.VERIFY_TOKEN,
        method: "POST",
        body: { token },
        flashError: true,
      }),
    }),
    getAllUsers: build.query<
      any,
      { page: number; limit: number; search: string; filter: any }
    >({
      query: (params) => ({
        url: endpointUsersManagement.GET_ALL_USERS,
        params: params,
        method: "GET",
        flashError: true,
      }),
    }),
    deleteUser: build.mutation({
      query: (id: string) => ({
        url: endpointUsersManagement.DELETE_USER.replace("{id}", id),
        method: "DELETE",
        flashError: true,
      }),
    }),
    editUser: build.mutation({
      query: (data: any) => ({
        url: endpointUsersManagement.EDIT_USER_BY_ID.replace(
          "{id}",
          data?.params?.id
        ),
        method: "PATCH",
        body: data?.body,
        flashError: true,
      }),
    }),
    resetPassword: build.mutation({
      query: (id: string) => ({
        url: endpointUsersManagement.RESET_PASSWORD.replace("{id}", id),
        method: "PATCH",
        flashError: true,
      }),
    }),
  }),
});

export const {
  useCreateManyUsersByCSVMutation,
  useVerifyTokenMutation,
  useGetAllUsersQuery,
  useDeleteUserMutation,
  useEditUserMutation,
  useResetPasswordMutation,
} = authAPI;
