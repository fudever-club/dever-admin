"use client";

import { endpointAlumniManagement, endpointProjectLabManagement } from "@/helpers/enpoints";
import { baseApi } from "../base";

export const contentManagementApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getProjectLabs: build.query<any, void>({ query: () => endpointProjectLabManagement.PROJECT_LAB }),
    createProjectLab: build.mutation<any, any>({ query: (body) => ({ url: endpointProjectLabManagement.PROJECT_LAB, method: "POST", body }) }),
    updateProjectLab: build.mutation<any, { id: string; body: any }>({ query: ({ id, body }) => ({ url: endpointProjectLabManagement.PROJECT_LAB_BY_ID.replace("{id}", id), method: "PATCH", body }) }),
    deleteProjectLab: build.mutation<any, string>({ query: (id) => ({ url: endpointProjectLabManagement.PROJECT_LAB_BY_ID.replace("{id}", id), method: "DELETE" }) }),
    getAlumni: build.query<any, void>({ query: () => endpointAlumniManagement.ALUMNI }),
    createAlumni: build.mutation<any, any>({ query: (body) => ({ url: endpointAlumniManagement.ALUMNI, method: "POST", body }) }),
    updateAlumni: build.mutation<any, { id: string; body: any }>({ query: ({ id, body }) => ({ url: endpointAlumniManagement.ALUMNI_BY_ID.replace("{id}", id), method: "PATCH", body }) }),
    deleteAlumni: build.mutation<any, string>({ query: (id) => ({ url: endpointAlumniManagement.ALUMNI_BY_ID.replace("{id}", id), method: "DELETE" }) }),
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
} = contentManagementApi;
