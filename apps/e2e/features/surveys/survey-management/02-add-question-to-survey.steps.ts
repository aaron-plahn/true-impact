import { Given } from "@wdio/cucumber-framework";

Given("I follow the link for the survey named {string}", async (surveyName) => {
  const targetRow = $(`tr*=${surveyName}`);

  const link = targetRow.$("*=LINK");

  await link.click();
});
