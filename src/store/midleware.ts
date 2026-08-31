import { isRejectedWithValue } from "@reduxjs/toolkit";
import type { MiddlewareAPI, Middleware } from "@reduxjs/toolkit";
import { message } from "antd";

export const rtkQueryErrorLogger: Middleware =
  (api: MiddlewareAPI) => (next) => (action: any) => {
    if (isRejectedWithValue(action)) {
      const code = action?.payload?.data?.code;
      const serverMsg = action?.payload?.data?.message;
      if (code && serverMsg) {
        message.error(serverMsg);
      }
    }

    return next(action);
  };
