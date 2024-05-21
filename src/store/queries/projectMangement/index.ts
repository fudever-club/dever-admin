"use client";

import {
  endpointAuth,
  endpointDepartmentManagement,
  endpointProjectManagement,
  endpointUsersManagement,
} from "@/helpers/enpoints";
import { baseApi } from "../base";

export const authAPI = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getAllProjects: build.query<any, any>({
      query: (params) => ({
        url: endpointProjectManagement.GET_ALL_PROJECT,
        params: params,
        method: "GET",
        flashError: true,
      }),
    }),
    getProjectById: build.query<any, string>({
      query: (id) => ({
        url: endpointProjectManagement.GET_PROJECT_DETAIL.replace("{id}", id),
        method: "GET",
        flashError: true,
      }),
    }),
    deleteProject: build.mutation({
      query: (id: string) => ({
        url: endpointProjectManagement.DELETE_PROJECT.replace("{id}", id),
        method: "DELETE",
        flashError: true,
      }),
    }),
    createProject: build.mutation({
      query: (data: any) => ({
        url: endpointProjectManagement.PROJECT,
        method: "POST",
        body: data,
        flashError: true,
      }),
    }),
    editProject: build.mutation({
      query: (data: any) => ({
        url: endpointProjectManagement.EDIT_PROJECT.replace(
          "{id}",
          data?.params?.id
        ),
        method: "PATCH",
        body: data?.body,
        flashError: true,
      }),
    }),
  }),
});

export const {
  useGetAllProjectsQuery,
  useGetProjectByIdQuery,
  useDeleteProjectMutation,
  useCreateProjectMutation,
  useEditProjectMutation,
} = authAPI;
