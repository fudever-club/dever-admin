import { constants } from "@/settings";
import webStorageClient from "@/utils/webStorageClient";
import { isAuthEndpoint, refreshSession } from "@/utils/sessionRefresh";
import {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
  createApi,
  fetchBaseQuery,
} from "@reduxjs/toolkit/query/react";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: constants.API_SERVER,
  // Send httpOnly session cookies; the server also accepts the legacy header.
  credentials: "include",
  prepareHeaders: (headers) => {
    const accessToken = webStorageClient.getToken();

    if (accessToken) {
      headers.set("Authorization", `Bearer ${accessToken}`);
    }

    return headers;
  },
});

/** One silent refresh attempt on 401 (never for auth endpoints); callers keep
 *  their existing error handling — this only recovers expired sessions. */
const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const url = typeof args === "string" ? args : args.url;
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401 && !isAuthEndpoint(url)) {
    if (await refreshSession()) {
      result = await rawBaseQuery(args, api, extraOptions);
    }
  }

  return result;
};

export const baseApi = createApi({
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "Notifications",
    "Users",
    "Content",
    "Position",
    "Department",
    "Major",
    "Social",
  ],
  endpoints: () => ({}),
});
