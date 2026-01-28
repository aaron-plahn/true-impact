import {
  NormalisedGetRedirectionURLContext,
  SuccessRedirectContextInApp,
  SuperTokensConfig,
} from "supertokens-auth-react/lib/build/types";
import EmailPassword from "supertokens-auth-react/recipe/emailpassword";
import Session from "supertokens-auth-react/recipe/session";
import { config as trueImpactConfig } from "./config.local";

export const getSupertokensConfig = () => {
  const { apiDomain, webClientDomain } = trueImpactConfig;

  return {
    appInfo: {
      appName: "SuperTokens Demo App",
      apiDomain,
      apiBasePath: "/auth",
      websiteDomain: webClientDomain,
      websiteBasePath: "/auth",
    },

    recipeList: [EmailPassword.init(), Session.init()],
    getRedirectionURL: async (
      context: NormalisedGetRedirectionURLContext<SuccessRedirectContextInApp>,
    ) => {
      /**
       * Note that the type in the generic above is too specific. The underlying library's type is a mess of
       * TS vomit.
       */
      if (context.action === "SUCCESS") {
        return context.redirectToPath;
      }

      return undefined;
    },
  } as unknown as SuperTokensConfig;
};
