import { Given, Then } from "@wdio/cucumber-framework";

Given("I follow the link to the survey named {string}", async (surveyName) => {
  const link = $(`a*=${surveyName}`);

  await link.click();
});

Given(
  "I navigate to the detail page for client {string}",
  async (clientName) => {
    const row = $(`tr*=${clientName}`);

    const link = row.$(`a*=Link`);

    await link.click();
  },
);

Given(
  "I navigate to the response page for attempt number {int} of client survey {string}",
  async (_attemptNumber, surveyName) => {
    // TODO group respones by survey name and order by attempt number (chronologically)
    const link = $(`a*=${surveyName}`);

    await link.click();
  },
);

Given("I navigate to the survey report named {string}", async (reportName) => {
  const link = $(`a*=${reportName}`);

  await link.click();
});

Then(
  "The report's {string} should have the value {int}",
  async (categoryLabel: string, valueForCategory: number) => {
    const row = $(`tr*=${categoryLabel}`);

    const value = await row
      .$(`[data-testid="report-category-${categoryLabel}-value"]`)
      .getText();

    expect(value).toBe(valueForCategory.toString());
  },
);
