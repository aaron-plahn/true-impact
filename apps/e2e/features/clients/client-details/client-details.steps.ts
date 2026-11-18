import { Then, When } from "@wdio/cucumber-framework";

When("I begin the command with label {string}", async (commandLabel) => {
  const targetButton = $(`button*=${commandLabel}`);

  await targetButton.click();
});

Then(
  "The client's community should appear as {string}",
  async (communityName) => {
    const targetEl = $(`[data-testid="client-details-community"]`);

    // i.e. expect(targetEl).toContainText(communityName)
    await expect(targetEl).toHaveText(communityName, { containing: true });
  },
);
