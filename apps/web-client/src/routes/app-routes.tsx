import * as reactRouterDom from "react-router-dom";
import { useRoutes } from "react-router-dom";
import { EmailPasswordPreBuiltUI } from "supertokens-auth-react/recipe/emailpassword/prebuiltui";
import { SessionAuth } from "supertokens-auth-react/recipe/session";
import { getSuperTokensRoutesForReactRouterDom } from "supertokens-auth-react/ui";
import { Home } from "../components/pages";
import {
  UserManagementDashboard,
  UserProfile,
} from "../components/user-management";

export const AppRoutes = () => {
  const authRoutes = getSuperTokensRoutesForReactRouterDom(reactRouterDom, [
    EmailPasswordPreBuiltUI,
  ]);

  /**
   * Note that one can use the session context to make further decisions about user access
   * inside any route wrapped with `<SessionAuth>...</SessionAuth>`
   *
   * See [here](https://supertokens.com/docs/auth-react/modules/recipe_session.html)
   * and [here](https://supertokens.com/docs/auth-react/modules/recipe_userroles.html)
   */

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
