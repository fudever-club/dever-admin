"use client";

import { endpointSocialManagement } from "@/helpers/enpoints";
import { baseApi } from "../base";

export const authAPI = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getAllSocials: build.query<any, any>({
      query: (params) => ({
        url: endpointSocialManagement.GET_ALL_SOCIAL,
        params: params,
        method: "GET",
        flashError: true,
      }),
      providesTags: ["Social"],
    }),
    getSocialById: build.query<any, string>({
      query: (id) => ({
        url: endpointSocialManagement.GET_SOCIAL_BY_ID.replace("{id}", id),
        method: "GET",
        flashError: true,
      }),
      providesTags: ["Social"],
    }),
    deleteSocial: build.mutation({
      query: (id: string) => ({
        url: endpointSocialManagement.DELETE_SOCIAL.replace("{id}", id),
        method: "DELETE",
        flashError: true,
      }),
      invalidatesTags: ["Social"],
    }),
    createSocial: build.mutation({
      query: (data: any) => ({
        url: endpointSocialManagement.SOCIAL,
        method: "POST",
        body: data,
        flashError: true,
      }),
      invalidatesTags: ["Social"],
    }),
    editSocial: build.mutation({
      query: (data: any) => ({
        url: endpointSocialManagement.EDIT_SOCIAL_BY_ID.replace(
          "{id}",
          data?.params?.id
        ),
        method: "PATCH",
        body: data?.body,
        flashError: true,
      }),
      invalidatesTags: ["Social"],
    }),
  }),
});

export const {
  useGetAllSocialsQuery,
  useGetSocialByIdQuery,
  useDeleteSocialMutation,
  useCreateSocialMutation,
  useEditSocialMutation,
} = authAPI;
