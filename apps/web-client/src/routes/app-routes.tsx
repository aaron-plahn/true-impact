import React from "react";

import { useRoutes } from "react-router-dom";
import { getSuperTokensRoutesForReactRouterDom } from "supertokens-auth-react/ui";
import * as reactRouterDom from "react-router-dom";
import { EmailPasswordPreBuiltUI } from "supertokens-auth-react/recipe/emailpassword/prebuiltui";
import { Home } from "../components/pages";
import { SessionAuth } from "supertokens-auth-react/recipe/session";
import {
  UserManagementDashboard,
  UserProfile,
} from "../components/user-management";

export const AppRoutes = () => {
  const authRoutes = getSuperTokensRoutesForReactRouterDom(reactRouterDom, [
    EmailPasswordPreBuiltUI,
  ]);

  const routes = useRoutes([
    // Supertoken routes from UI recipes
    ...authRoutes.map((route) => route.props),
    // App-specific routes go here
    {
      path: "/",
      Component: Home,
    },
    {
      path: "/users",
      element: (
        <SessionAuth>
          <UserManagementDashboard />
        </SessionAuth>
      ),
    },
    {
      path: "/users/current",
      element: (
        <SessionAuth>
          <UserProfile />
        </SessionAuth>
      ),
    },
  ]);

  return routes;
};
