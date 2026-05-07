import { Given, Then, When } from "@wdio/cucumber-framework";

import loginPage from "../../login/login.page";

import { surveyPage } from "./survey-management.page";

const testSurveyName = "Weekly Questionnaire";

Given("I am logged in as an admin", async () => {
  await loginPage.open();

  await loginPage.login(
    process.env.TRUE_IMPACT_ADMIN_USERNAME as string,
    process.env.TRUE_IMPACT_ADMIN_PASSWORD as string,
  );
});

Given("I am on the survey management index page", async () => {
  await surveyPage.open();
});

// TODO Should this step require the <surveyName>?
When("I start a new survey", async () => {
  await surveyPage.beginNewSurvey(testSurveyName);
});

Then("It should display the newly created survey", async () => {
  await expect($("[data-testid=new-survey-page]")).toHaveText(testSurveyName, {
    containing: true,
  });
});
