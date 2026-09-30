"use client";

import { endpointSeasonManagement } from "@/helpers/enpoints";
import { baseApi } from "../base";

export type SeasonStatus = "upcoming" | "active" | "ended";

export interface SeasonScoring {
  easy: number;
  medium: number;
  hard: number;
}

export interface Season {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: SeasonStatus;
  scoring: SeasonScoring;
}

export interface ListSeasonsResponse {
  status: string;
  results?: number;
  data: Season[];
}

export interface CreateSeasonPayload {
  name: string;
  startDate: string;
  endDate: string;
  status?: "upcoming" | "active";
  scoring?: Partial<SeasonScoring>;
}

export interface UpdateSeasonPayload {
  id: string;
  body: {
    name?: string;
    startDate?: string;
    endDate?: string;
    status?: SeasonStatus;
    scoring?: Partial<SeasonScoring>;
  };
}

export const seasonManagementApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listSeasons: build.query<ListSeasonsResponse, void>({
      query: () => ({
        url: endpointSeasonManagement.SEASONS,
        method: "GET",
        flashError: true,
      }),
      providesTags: ["Seasons"],
    }),
    createSeason: build.mutation<any, CreateSeasonPayload>({
      query: (data) => ({
        url: endpointSeasonManagement.SEASONS,
        method: "POST",
        body: data,
        flashError: true,
      }),
      invalidatesTags: ["Seasons"],
    }),
    updateSeason: build.mutation<any, UpdateSeasonPayload>({
      query: ({ id, body }) => ({
        url: endpointSeasonManagement.SEASON_BY_ID.replace("{id}", id),
        method: "PATCH",
        body,
        flashError: true,
      }),
      invalidatesTags: ["Seasons"],
    }),
  }),
});

export const {
  useListSeasonsQuery,
  useCreateSeasonMutation,
  useUpdateSeasonMutation,
} = seasonManagementApi;
