import { Tooltip } from "@mui/material";
import { JSX, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loading } from "../components/loading";
import { AuthContextData, useAuth } from "./auth-context";

export const AuthPage = (): JSX.Element => {
  const auth = useAuth() as AuthContextData;

  const navigate = useNavigate();

  // TODO We now need to do this via the RTK API we have introduced
  const { logIn, isLoading, user, error } = auth;

  const [username, setUsername] = useState<string>("");

  const [password, setPassword] = useState<string>("");

  if (isLoading) {
    return <Loading />;
  }

  if (user) {
    navigate("/");
  }

  return (
    <div id="auth-form-root">
      <form
        onSubmit={(e) => {
          e.preventDefault();

          logIn({ username, password }, () => {});
        }}
        method="POST"
      >
        <label htmlFor="username-input">
          username
          <input
            id="username-input"
            placeholder="Username"
            type="text"
            value={username}
            required
            onChange={(e) => {
              setUsername(e.target.value);
            }}
          />
        </label>
        <label htmlFor="password-input">
          password
          <input
            id="password-input"
            placeholder="Password"
            type="password"
            value={password}
            required
            onChange={(e) => {
              setPassword(e.target.value);
            }}
          />
        </label>
        <Tooltip title="Sign In!">
          <button type="submit">Sign In!</button>
        </Tooltip>
      </form>
      <div>{error ? error.message : null}</div>
    </div>
  );
};
