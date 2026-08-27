import { Given, Then, When } from "@wdio/cucumber-framework";

import loginPage from "../../login/login.page";

import Page from "../../login/page";
import { surveyManagementIndexPage } from "./survey-builder.page";

const testSurveyName = "Weekly Questionnaire";

const question1 = "What is your favorite programming language?";

const option1a = "JavaScript";
const option1b = "Rust";
const option1c = "C++";
const option1d = "Python";

Given("I am logged in as an admin", async () => {
  await new Page().open("");

  await browser.deleteCookies();

  await loginPage.open();

  await loginPage.logInAsAdmin();
});

Given("I am on the survey management index page", async () => {
  await surveyManagementIndexPage.open();
});

/**
 * TODO Should this step require the <surveyName>?
 *
 * Note that ideally we would test this at a more granular level.
 *
 * Do we want to parametrize this step so that we can reuse local
 * fixtures in other tests?
 */
When("I start a new survey", async () => {
  await surveyManagementIndexPage.beginNewSurvey(testSurveyName);

  await surveyManagementIndexPage.addQuestion({
    label: "1",
    prompt: question1,
  });

  await surveyManagementIndexPage.addOptionForQuestion({
    questionLabel: "1",
    optionLabel: "a",
    text: option1a,
  });

  await surveyManagementIndexPage.addOptionForQuestion({
    questionLabel: "1",
    optionLabel: "b",
    text: option1b,
  });

  await surveyManagementIndexPage.addOptionForQuestion({
    questionLabel: "1",
    optionLabel: "c",
    text: option1c,
  });

  await surveyManagementIndexPage.addOptionForQuestion({
    questionLabel: "1",
    optionLabel: "d",
    text: option1d,
  });

  await surveyManagementIndexPage.finalize();

  await surveyManagementIndexPage.openToAnonymousParticipant();
});

Then("It should display the newly created survey", async () => {
  [
    question1,
    option1a,
    option1b,
    option1c,
    option1d,
    "** FINALIZED FOR USE**",
  ].forEach(async (textToFind) => {
    await expect($('[data-testid="survey-management-detail-page"]')).toHaveText(
      textToFind,
      {
        containing: true,
      },
    );
  });

  // TODO assert no command buttons are active.
});
