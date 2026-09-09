import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { constants } from "@/settings";
import webStorageClient from "@/utils/webStorageClient";

export const api = createApi({
  reducerPath: "otherServicesApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${constants.API_SERVER}/api/v1/upload/`,
    prepareHeaders: (headers) => {
      const token = webStorageClient.getToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: (build) => ({
    uploadImage: build.mutation<{ status: string; data: { url: string } }, FormData>({
      query: (formData) => ({
        url: "image",
        method: "POST",
        body: formData,
      }),
    }),
  }),
});

export const { useUploadImageMutation } = api;
