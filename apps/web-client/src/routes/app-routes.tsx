import { useRoutes } from "react-router-dom";
import { AuthPage } from "../auth";
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
  /**
   * Note that we will want to use the session context to make further decisions about user access.
   * We might want to introduce a wrapper `<SessionAuth>...</SessionAuth>` similar to that in Supertookens.
   *
   * See [here](https://supertokens.com/docs/auth-react/modules/recipe_session.html)
   * and [here](https://supertokens.com/docs/auth-react/modules/recipe_userroles.html)
   */

  const routes = useRoutes([
    // App-specific routes go here
    {
      path: "/auth",
      element: <AuthPage />,
    },
    {
      path: "/",
      element: <Home />,
    },
    {
      path: "/users",
      element: <UserManagementDashboard />,
    },
    {
      path: "/users/current",
      element: <UserProfile />,
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
