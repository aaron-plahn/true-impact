import { Given, Then, When } from "@wdio/cucumber-framework";

import loginPage from "../../login/login.page";
import { surveyManagementIndexPage } from "../survey-management/survey-builder.page";
import { surveyCompletionPage } from "./survey-completion.page";

Given("There is a survey named {string}", async (surveyName) => {
  await browser.deleteAllCookies();

  await loginPage.open();

  await loginPage.logInAsAdmin();

  await expect(loginPage.avatarMenuControl).toBeExisting();

  await surveyManagementIndexPage.open();

  await surveyManagementIndexPage.beginNewSurvey(surveyName);
});

Given("It has a question {string}: {string}", async (label, prompt) => {
  await surveyManagementIndexPage.addQuestion({ label, prompt });
});

Given(
  "Question {string} has an option {string}: {string}",
  async (questionLabel, optionLabel, text) => {
    await surveyManagementIndexPage.addOptionForQuestion({
      questionLabel,
      optionLabel,
      text,
    });
  },
);

Given("The survey has been finalized", async () => {
  await surveyManagementIndexPage.finalize();
});

Given("The survey is open with a one-time passcode", async () => {
  await surveyManagementIndexPage.openToAnonymousParticipant();
});

Given("I am on the survey response page", async () => {
  await surveyManagementIndexPage.goToResponsePage();
});

When("I begin the survey {string}", async (_surveyName: string) => {
  await surveyCompletionPage.beginSurvey();
});

Then(
  "It should display the question {string}: {string}",
  async (questionLabel, text) => {
    await expect($(`*=${questionLabel}`)).toBeExisting();

    await expect($(`*=${text}`)).toBeExisting();
  },
);

When(
  "I answer question {string} by choosing option {string}",
  async (questionLabel, chosenOptionLabel) => {
    await surveyCompletionPage.answerQuestion({
      questionLabel,
      chosenOptionLabel,
    });
  },
);

Then("It should display the survey submission button", async () => {
  await expect(surveyCompletionPage.surveySubmissionButton).toBeExisting();
});

When("I submit the survey", async () => {
  await surveyCompletionPage.surveySubmissionButton.click();

  const cookies = await browser.getCookies(["survey-response-session"]);

  // Ensure that sucessfully submitting the survey logs the user out of the session
  expect(cookies).toHaveLength(0);
});

When("I refresh at the home screen", () => {
  browser.url("http://localhost:4200");
});

Then(
  "It should display the an acknowledgement that the submission was received",
  async () => {
    await expect(surveyCompletionPage.submissionAcknowledgement).toBeExisting();
  },
);
