import { JSX } from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { selectCurrentUser } from "../users/auth.slice";

export const UserProfile = (): JSX.Element => {
  const user = useSelector(selectCurrentUser);

  if (!user) {
    return <Navigate to={"/auth"} />;
  }

  /**
   * This is not exactly what we want to do. This is just a placeholder for now. Remove this soon
   * in favour of hitting a `who-am-i` endpoint.
   *
   * Let's fix this.
   */
  return <div>{JSON.stringify(user)}</div>;
};
