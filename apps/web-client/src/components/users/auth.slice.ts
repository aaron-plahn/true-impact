import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface User {
  id: string;
  username: string;
  fullName: {
    firstName: string;
    middleNames: string[];
    lastName: string;
  };
  role: string;
  // permissions?
}

export interface Session {
  user: User;
}

export type AuthSliceState = {
  user?: User;
  // in the future, `token`. currently we use sessions
};

const buildInitialAuthState = (): AuthSliceState => ({
  // user is undefined initially
});

const authSlice = createSlice({
  name: "auth",
  initialState: buildInitialAuthState(),
  reducers: {
    setSession: (state: AuthSliceState, action: PayloadAction<Session>) => {
      const {
        payload: { user },
      } = action;

      state.user = user;
    },
    clearSession: (state: AuthSliceState) => {
      state = buildInitialAuthState();
    },
  },
});

export const { setSession, clearSession } = authSlice.actions;

export const selectCurrentUser = (state: { auth: AuthSliceState }) =>
  state.auth.user;

export const selectIsAuthenticated = (state: { auth: AuthSliceState }) => {
  const user = selectCurrentUser(state);

  return user !== null && typeof user !== "undefined";
};
