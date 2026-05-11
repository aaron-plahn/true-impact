import * as reactRouterDom from "react-router-dom";
import { useRoutes } from "react-router-dom";
import { EmailPasswordPreBuiltUI } from "supertokens-auth-react/recipe/emailpassword/prebuiltui";
import { SessionAuth } from "supertokens-auth-react/recipe/session";
import { getSuperTokensRoutesForReactRouterDom } from "supertokens-auth-react/ui";
import { ClientIndex } from "../components/clients";
import { Home } from "../components/pages";
import { SurveyCompletionIndex } from "../components/surveys/completion";
import { SurveyManagementIndex } from "../components/surveys/management";
import { NewSurveyPage } from "../components/surveys/management/new-survey.page";
import { SurveyDetailPage } from "../components/surveys/management/survey-detail.page";
import { SurveyReviewIndex } from "../components/surveys/review";
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
      element: <Home />,
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
    {
      path: "/surveys/complete",
      element: <SurveyCompletionIndex />,
    },
    {
      path: "/surveys/manage/:id",
      element: <SurveyDetailPage />,
    },
    {
      path: "/surveys/manage",
      element: <SurveyManagementIndex />,
    },
    {
      path: "/surveys/manage/new",
      element: <NewSurveyPage />,
    },
    {
      path: "/surveys/review",
      element: <SurveyReviewIndex />,
    },
    {
      path: "/clients",
      element: <ClientIndex />,
    },
  ]);

  return routes;
};
