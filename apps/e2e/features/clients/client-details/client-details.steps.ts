import { Then, When } from "@wdio/cucumber-framework";

When("I begin the command with label {string}", async (commandLabel) => {
  const targetButton = $(`button*=${commandLabel}`);

  await targetButton.click();
});

Then(
  "The client's {string} should appear as {string}",
  async (propertyLabel, expectedText) => {
    const targetEl = $(`[data-testid="client-details-${propertyLabel}"]`);

    // i.e. expect(targetEl).toContainText(communityName)
    await expect(targetEl).toHaveText(expectedText, { containing: true });
  },
);
