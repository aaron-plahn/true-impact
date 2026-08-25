import { Then, When } from "@wdio/cucumber-framework";
import { surveyReviewIndexPage } from "./survey-review-index.page";

When("I navigate to the survey review page", async () => {
  await surveyReviewIndexPage.open();
});

When("I select the most recently submitted survey response", async () => {
  await surveyReviewIndexPage.viewMostRecentSurveyResponse();
});

Then(
  "I should see the survey response detail page for: {string}",
  async (surveyName) => {
    await expect($(`*=${surveyName}`)).toBeExisting();
  },
);
