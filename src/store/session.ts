import type { AppDispatch } from "./index";
import { baseApi } from "./queries/base";
import { clearAuthenticatedUser } from "./slices/auth";
import webStorageClient from "@/utils/webStorageClient";
import { constants } from "@/settings";

export const clearSession = () => (dispatch: AppDispatch) => {
  webStorageClient.remove(constants.ACCESS_TOKEN);
  webStorageClient.remove(constants.USER_INFO);
  dispatch(clearAuthenticatedUser());
  dispatch(baseApi.util.resetApiState());
};
