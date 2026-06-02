import { Given, Then, When } from "@wdio/cucumber-framework";

import loginPage from "../../login/login.page";
import { surveyPage } from "../survey-management/survey-builder.page";
import { surveyCompletionPage } from "./survey-completion.page";

Given("There is a survey named {string}", async (surveyName) => {
  await loginPage.open();

  await loginPage.login(
    process.env.TRUE_IMPACT_ADMIN_USERNAME as string,
    process.env.TRUE_IMPACT_ADMIN_PASSWORD as string,
  );

  await surveyPage.open();

  await surveyPage.beginNewSurvey(surveyName);
});

Given("It has a question {string}: {string}", async (label, prompt) => {
  await surveyPage.addQuestion({ label, prompt });
});

Given(
  "Question {string} has an option {string}: {string}",
  async (questionLabel, optionLabel, text) => {
    await surveyPage.addOptionForQuestion({ questionLabel, optionLabel, text });
  },
);

Given("The survey is published", async () => {
  await surveyPage.publish();
});

Given("The survey is open with a one-time passcode", async () => {
  await surveyPage.openToAnonymousParticipant();
});

Given("I am on the survey response page", async () => {
  await surveyPage.goToResponsePage();
});

When("I begin the survey {string}", async (surveyName: string) => {
  await surveyCompletionPage.open(surveyName);

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

    await surveyCompletionPage.goToNextQuestion();
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

Then(
  "It should display the an acknowledgement that the submission was received",
  async () => {
    await expect(surveyCompletionPage.submissionAcknowledgement).toBeExisting();
  },
);
