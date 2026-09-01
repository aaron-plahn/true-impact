import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { config } from "../../config";
import { Session, setSession } from "./auth.slice";

export interface UserLoginCredentials {
  username: string;
  password: string;
}

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: fetchBaseQuery({ baseUrl: config.API_URL }),
  endpoints: (builder) => ({
    logIn: builder.mutation<Session, UserLoginCredentials>({
      query: (userLoginCredentials) => ({
        url: "/auth/login",
        method: "POST",
        body: userLoginCredentials,
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;

          dispatch(setSession(data));
        } catch (err) {
          // TODO more robust network \ auth error handling
          console.error(err);
        }
      },
    }),
    // TODO We need logOut as well so the server state stays in sync
  }),
});

export const { useLogInMutation: logIn } = authApi;
