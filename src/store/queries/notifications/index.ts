"use client";

import { endpointNotifications } from "@/helpers/enpoints";
import { baseApi } from "../base";

export const adminNotificationsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getMyNotifications: build.query<any, { page?: number; limit?: number } | void>({
      query: (params) => ({
        url: endpointNotifications.MY_NOTIFICATIONS,
        params: params || { page: 1, limit: 20 },
      }),
      providesTags: ["Notifications"],
    }),
    markNotificationAsRead: build.mutation<any, string>({
      query: (id) => ({
        url: endpointNotifications.READ_ITEM.replace("{id}", id),
        method: "PUT",
      }),
      invalidatesTags: ["Notifications"],
    }),
    markAllNotificationsAsRead: build.mutation<any, void>({
      query: () => ({
        url: endpointNotifications.READ_ALL,
        method: "PUT",
      }),
      invalidatesTags: ["Notifications"],
    }),
    deleteNotification: build.mutation<any, string>({
      query: (id) => ({
        url: endpointNotifications.DELETE_ITEM.replace("{id}", id),
        method: "DELETE",
      }),
      invalidatesTags: ["Notifications"],
    }),
    testTelegramBot: build.mutation<any, { chatId?: string } | void>({
      query: (body) => ({
        url: endpointNotifications.TEST_TELEGRAM,
        method: "POST",
        body: body || {},
      }),
    }),
  }),
});

export const {
  useGetMyNotificationsQuery,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
  useDeleteNotificationMutation,
  useTestTelegramBotMutation,
} = adminNotificationsApi;
