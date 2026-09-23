import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

interface AuthSlickInterface {
  userInfo: any;
  access_token: any;
}

const initialState: AuthSlickInterface = {
  userInfo: null,
  access_token: null,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    actionLogin: (
      state,
      action: PayloadAction<{
        username: string;
        password: string;
        isRemember: boolean;
      }>
    ) => {},
    setAuthenticatedUser: (state, action: PayloadAction<any>) => {
      state.userInfo = action.payload;
    },
    clearAuthenticatedUser: () => initialState,
  },
});

export const { actionLogin, setAuthenticatedUser, clearAuthenticatedUser } = authSlice.actions;

export default authSlice.reducer;
