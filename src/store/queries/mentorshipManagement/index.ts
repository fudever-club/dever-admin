"use client";

import { endpointMentorship } from "@/helpers/enpoints";
import { baseApi } from "../base";

export interface MentorshipMentor {
  _id: string;
  name?: string;
  headline?: string;
  bio?: string;
  quote?: string;
  workplace?: string;
  avatar?: string;
  graduationGen?: string;
  mentoringTopics?: string[];
}

export interface MentorshipMentorsResponse {
  status: string;
  results?: number;
  data?: MentorshipMentor[] | null;
}

export type MentorshipRequestStatus = "pending" | "accepted" | "declined";

export interface MentorshipRequestMentor {
  _id?: string;
  name?: string;
  headline?: string;
  avatar?: string;
  workplace?: string;
}

export interface MentorshipRequester {
  _id?: string;
  firstname?: string;
  lastname?: string;
  email?: string;
  gen?: string;
}

export interface MentorshipRequestItem {
  _id: string;
  alumniId?: MentorshipRequestMentor | string | null;
  requesterId?: MentorshipRequester | string | null;
  topic?: string;
  message?: string;
  status?: MentorshipRequestStatus;
  createdAt?: string;
}

export interface MentorshipRequestsParams {
  status?: MentorshipRequestStatus;
  alumniId?: string;
  page?: number;
  limit?: number;
}

export interface MentorshipRequestsResponse {
  status: string;
  results?: number;
  total?: number;
  currentPage?: number;
  totalPages?: number;
  data?: MentorshipRequestItem[] | null;
}

export const mentorshipManagementApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // GET /api/v1/mentorship/mentors — public, dùng được với Bearer admin.
    // Chỉ trả mentors đã xuất bản (isMentor + isPublished), không kèm contact.
    getMentors: build.query<MentorshipMentorsResponse, void>({
      query: () => ({
        url: endpointMentorship.MENTORS,
        method: "GET",
      }),
      providesTags: ["Mentorship"],
    }),
    // GET /api/v1/mentorship/requests — admin queue, filter status + server pagination.
    listRequests: build.query<MentorshipRequestsResponse, MentorshipRequestsParams | void>({
      query: (params) => ({
        url: endpointMentorship.REQUESTS,
        method: "GET",
        params: {
          ...(params?.status ? { status: params.status } : {}),
          ...(params?.alumniId ? { alumniId: params.alumniId } : {}),
          page: params?.page ?? 1,
          limit: params?.limit ?? 10,
        },
      }),
      providesTags: ["Mentorship"],
    }),
    // PATCH /api/v1/mentorship/requests/:id/review { status: accepted|declined }.
    reviewRequest: build.mutation<unknown, { id: string; status: "accepted" | "declined" }>({
      query: ({ id, status }) => ({
        url: endpointMentorship.REQUEST_REVIEW.replace("{id}", id),
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: ["Mentorship"],
    }),
  }),
});

export const { useGetMentorsQuery, useListRequestsQuery, useReviewRequestMutation } =
  mentorshipManagementApi;
