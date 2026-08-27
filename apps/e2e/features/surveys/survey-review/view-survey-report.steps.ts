import { Then, When } from "@wdio/cucumber-framework";
import { importSurvey } from "../../../utils/import-survey";
import loginPage from "../../login/login.page";
import Page from "../../login/page";
import { surveyManagementIndexPage } from "../survey-management/survey-builder.page";
import { surveyResponseReportPage } from "./survey-response-report.page";
import { surveyReviewIndexPage } from "./survey-review-index.page";

When(
  "I navigate to the detail page for survey {string}",
  async (surveyName) => {
    surveyManagementIndexPage.open();

    surveyManagementIndexPage.goToSurveyDetailPage(surveyName);
  },
);

When("I navigate to the survey review page", async () => {
  await surveyReviewIndexPage.open();
});

When("I select the most recently submitted survey response", async () => {
  await surveyReviewIndexPage.viewMostRecentSurveyResponse();
});

When("I log in as admin", async () => {
  await new Page().open("");

  await browser.deleteAllCookies();

  await loginPage.loginMenu.click();

  // TODO clean up the logic in this method
  await $("*=Sign In").click();

  await loginPage.logInAsAdmin();
});

When(
  "The survey in the fixture file {string} has been imported",
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

// TODO Standardize templates \ use of ":"
When(
  "I navigate to the response detail page for {string}",
  async (surveyName) => {
    await $(`*=${surveyName}`).click();
  },
);

When(
  "I navigate to the report detail for report {string}",
  async (reportName: string) => {
    await $(`*=${reportName}`).click();
  },
);

Then(
  "I should see the survey response detail page for: {string}",
  async (surveyName) => {
    await expect($(`*=${surveyName}`)).toBeExisting();
  },
);

Then("I should see the report name {string}", async (reportName: string) => {
  await expect($(`*=${reportName}`)).toBeExisting();
});

Then(
  "I should see a report item displaying the value {int} for the category {string}",
  async (value: number, category: string) => {
    const result = surveyResponseReportPage.getRowForCategory(category);

    const rowText = await result.getText();

    expect(rowText.includes(value.toString()));
  },
);
