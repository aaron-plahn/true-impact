import { Given, Then, When } from "@wdio/cucumber-framework";

import loginPage from "../../login/login.page";

import { surveyPage } from "./survey-builder.page";

const testSurveyName = "Weekly Questionnaire";

const question1 = "What is your favorite programming language?";

const option1a = "JavaScript";
const option1b = "Rust";
const option1c = "C++";
const option1d = "Python";

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

  await surveyPage.addQuestion({ label: "1", prompt: question1 });

  await surveyPage.addOptionForQuestion({
    questionLabel: "1",
    optionLabel: "a",
    text: option1a,
  });

  await surveyPage.addOptionForQuestion({
    questionLabel: "1",
    optionLabel: "b",
    text: option1a,
  });

  await surveyPage.addOptionForQuestion({
    questionLabel: "1",
    optionLabel: "c",
    text: option1a,
  });

  await surveyPage.addOptionForQuestion({
    questionLabel: "1",
    optionLabel: "d",
    text: option1a,
  });

  await surveyPage.publish();
});

Then("It should display the newly created survey", async () => {
  [
    question1,
    option1a,
    option1b,
    option1c,
    option1d,
    "** PUBLISHED FOR USE**",
  ].forEach(async (textToFind) => {
    await expect($('[data-testid="survey-management-detail-page"]')).toHaveText(
      textToFind,
      {
        containing: true,
      },
    );
  });
});
