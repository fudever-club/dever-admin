"use client";

import {
  endpointAlbumManagement,
  endpointMajorManagement,
} from "@/helpers/enpoints";
import { baseApi } from "../base";

export const authAPI = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getAllAlbums: build.query<any, any>({
      query: (params) => ({
        url: endpointAlbumManagement.GET_ALL_Album,
        params: params,
        method: "GET",
        flashError: true,
      }),
    }),
    getAlbumDetail: build.query<any, string>({
      query: (id) => ({
        url: endpointAlbumManagement.GET_ALBUM_DETAIL.replace("{id}", id),
        method: "GET",
        flashError: true,
      }),
    }),
    deleteAlbum: build.mutation({
      query: (id) => ({
        url: endpointAlbumManagement.DELETE_ALBUM.replace("{id}", id),
        method: "DELETE",
        flashError: true,
      }),
    }),
    createAlbum: build.mutation({
      query: (data: any) => ({
        url: endpointAlbumManagement.ALBUM,
        method: "POST",
        body: data,
        flashError: true,
      }),
    }),
    editAlbum: build.mutation({
      query: (data: {
        body: {
          password: string;
          conf: string;
        };
        params: { id: string };
      }) => ({
        url: endpointAlbumManagement.EDIT_ALBUM.replace(
          "{id}",
          data?.params?.id
        ),
        method: "PATCH",
        body: data?.body,
        flashError: true,
      }),
    }),
    deleteManyImagesInAlbum: build.mutation({
      query: (data: any) => ({
        url: endpointAlbumManagement.DELETE_MANY_IMAGES_IN_ALBUM.replace(
          "{slug}",
          data?.params?.slug
        ),
        method: "DELETE",
        body: data?.body,
        flashError: true,
      }),
    }),
    uploadImageForAlbum: build.mutation({
      query: (data: any) => ({
        url: endpointAlbumManagement.UPLOAD_IMAGES_FOR_ALBUM.replace(
          "{slug}",
          data?.params?.slug
        ),
        method: "POST",
        body: data?.body,
        flashError: true,
      }),
    }),
  }),
});

export const {
  useGetAllAlbumsQuery,
  useGetAlbumDetailQuery,
  useDeleteAlbumMutation,
  useCreateAlbumMutation,
  useEditAlbumMutation,
  useDeleteManyImagesInAlbumMutation,
  useUploadImageForAlbumMutation,
} = authAPI;
