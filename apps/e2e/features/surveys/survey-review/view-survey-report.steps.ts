import { Then, When } from "@wdio/cucumber-framework";
import { importSurvey } from "../../../utils/import-survey";
import loginPage from "../../login/login.page";
import Page from "../../login/page";
import { surveyManagementIndexPage } from "../survey-management/survey-builder.page";
import { surveyReviewIndexPage } from "./survey-review-index.page";

When("I navigate to the detail page for survey ", async (surveyName) => {
  surveyManagementIndexPage.open();

  surveyManagementIndexPage.goToSurveyDetailPage(surveyName);
});

When("I navigate to the survey review page", async () => {
  await surveyReviewIndexPage.open();
});

When("I select the most recently submitted survey response", async () => {
  await surveyReviewIndexPage.viewMostRecentSurveyResponse();
});

When("I log in as admin", async () => {
  await new Page().open("");

  await browser.deleteAllCookies();

  await loginPage.logInAsAdmin();
});

When(
  "The survey in the fixture file: {string} has been imported",
  async (fixturePath: string) => {
    await new Page().open("");

    await browser.deleteCookies();

    await loginPage.open();

    await loginPage.logInAsAdmin();

    const browserCookies = await browser.getCookies();

    const cookieHeader = browserCookies
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join("; ");

    await importSurvey(fixturePath, cookieHeader);

    await loginPage.logOut();
  },
);

Then(
  "I should see the survey response detail page for: {string}",
  async (surveyName) => {
    await expect($(`*=${surveyName}`)).toBeExisting();
  },
);
