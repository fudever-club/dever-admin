"use client";

import {
  endpointAlumniManagement,
  endpointProjectLabManagement,
  endpointOpenSourceManagement,
} from "@/helpers/enpoints";
import { baseApi } from "../base";

export const contentManagementApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getProjectLabs: build.query<any, void>({
      query: () => endpointProjectLabManagement.PROJECT_LAB,
      providesTags: ["Content"],
    }),
    createProjectLab: build.mutation<any, any>({
      query: (body) => ({ url: endpointProjectLabManagement.PROJECT_LAB, method: "POST", body }),
      invalidatesTags: ["Content"],
    }),
    updateProjectLab: build.mutation<any, { id: string; body: any }>({
      query: ({ id, body }) => ({ url: endpointProjectLabManagement.PROJECT_LAB_BY_ID.replace("{id}", id), method: "PATCH", body }),
      invalidatesTags: ["Content"],
    }),
    deleteProjectLab: build.mutation<any, string>({
      query: (id) => ({ url: endpointProjectLabManagement.PROJECT_LAB_BY_ID.replace("{id}", id), method: "DELETE" }),
      invalidatesTags: ["Content"],
    }),
    
    getAlumni: build.query<any, void>({
      query: () => endpointAlumniManagement.ALUMNI,
      providesTags: ["Content"],
    }),
    createAlumni: build.mutation<any, any>({
      query: (body) => ({ url: endpointAlumniManagement.ALUMNI, method: "POST", body }),
      invalidatesTags: ["Content"],
    }),
    updateAlumni: build.mutation<any, { id: string; body: any }>({
      query: ({ id, body }) => ({ url: endpointAlumniManagement.ALUMNI_BY_ID.replace("{id}", id), method: "PATCH", body }),
      invalidatesTags: ["Content"],
    }),
    deleteAlumni: build.mutation<any, string>({
      query: (id) => ({ url: endpointAlumniManagement.ALUMNI_BY_ID.replace("{id}", id), method: "DELETE" }),
      invalidatesTags: ["Content"],
    }),

    getOpenSourceProjects: build.query<any, void>({
      query: () => endpointOpenSourceManagement.OPEN_SOURCE_ADMIN_ALL,
      providesTags: ["Content"],
    }),
    createOpenSourceProject: build.mutation<any, any>({
      query: (body) => ({ url: endpointOpenSourceManagement.OPEN_SOURCE, method: "POST", body }),
      invalidatesTags: ["Content"],
    }),
    updateOpenSourceProject: build.mutation<any, { id: string; body: any }>({
      query: ({ id, body }) => ({ url: endpointOpenSourceManagement.OPEN_SOURCE_BY_ID.replace("{id}", id), method: "PUT", body }),
      invalidatesTags: ["Content"],
    }),
    deleteOpenSourceProject: build.mutation<any, string>({
      query: (id) => ({ url: endpointOpenSourceManagement.OPEN_SOURCE_BY_ID.replace("{id}", id), method: "DELETE" }),
      invalidatesTags: ["Content"],
    }),
  }),
});

export const {
  useGetProjectLabsQuery,
  useCreateProjectLabMutation,
  useUpdateProjectLabMutation,
  useDeleteProjectLabMutation,
  useGetAlumniQuery,
  useCreateAlumniMutation,
  useUpdateAlumniMutation,
  useDeleteAlumniMutation,
  useGetOpenSourceProjectsQuery,
  useCreateOpenSourceProjectMutation,
  useUpdateOpenSourceProjectMutation,
  useDeleteOpenSourceProjectMutation,
} = contentManagementApi;
