import { Given, Then, When } from "@wdio/cucumber-framework";
import { expect } from "@wdio/globals";
import { clearTestData } from "../../../utils/clear-test-data";
import { importCommunities } from "../../../utils/import-communities";
import loginPage from "../../login/login.page";
import Page from "../../login/page";
import { newClientPage } from "./new-client.page";

Given("I have cleared all existing clients and communities", async () => {
  await clearTestData(["clients/test-setup", "communities/test-setup"]);
});

Given(
  "The communities in the fixture file {string} has been imported",
  async (relativePath) => {
    // TODO share the login \ logout logic with other helpers
    await new Page().open("");

    await browser.deleteCookies();

    await loginPage.open();

    await loginPage.logInAsAdmin();

    // avoid a race-condition by waiting for the login response to load
    await expect(loginPage.avatarMenuControl).toBeExisting();

    const browserCookies = await browser.getCookies();

    const cookieHeader = browserCookies
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join("; ");

    await importCommunities(relativePath, cookieHeader);

    await loginPage.logOut();
  },
);

When("I open the new client page", async () => {
  await newClientPage.open();
});

When(
  "I complete the text input field {string} with the value {string}",
  async (fieldName, fieldContent) => {
    const targetFormField = $(`[data-testid="${fieldName}-input"]`);

    await targetFormField.setValue(fieldContent);
  },
);

When(
  "I complete the multitext input field {string} with the value {string}",
  async (fieldName, fieldContent) => {
    const targetFormField = $(`[data-testid="${fieldName}-input"]`);

    await targetFormField.setValue(fieldContent);
  },
);

When(
  "I complete the date picker field {string} with the value {string}",
  // Note that this is not the same order as a date string (YYYY-MM-DD)
  async (fieldName, MMDDYYYY) => {
    const targetFormField = $(`[data-testid="${fieldName}-input"]`);

    /**
     * This is a workaround for the following issue.
     *
     * `setValue` will type the values into the date picker field using the
     * keyboard if we include `-`s in the value.
     */
    const valueWithoutDashes = MMDDYYYY.replace("-", "");

    await targetFormField.setValue(valueWithoutDashes);
  },
);

When(
  "I complete the select field {string} by chosing the option with label {string}",
  async (fieldName, chosenOptionLabel) => {
    const targetFormField = $(`[data-testid="${fieldName}-input"]`);

    await targetFormField.selectByVisibleText(chosenOptionLabel);
  },
);

When("I submit the command {string}", async (commandLabel) => {
  await $(`button=${commandLabel}`).click();
});

When(
  "I complete the switch field {string} by switching it",
  async (fieldName) => {
    const targetFormField = $(`[data-testid="${fieldName}-input"]`);

    await targetFormField.click();
  },
);

When(
  "I complete the dynamic selector field {string} by typing {string} and choosing the result {string}",
  async (fieldName, searchText, resultingLabel) => {
    const targetFormField = $(`[data-testid="${fieldName}-input"]`);

    await targetFormField.click();

    await targetFormField.setValue(searchText);

    const textElem = $(`*=${resultingLabel}`);

    await textElem.waitForDisplayed({ timeout: 5000 }); // ms

    const chosenOption = $(
      `[data-testid="${fieldName}-option-${resultingLabel}"]`,
    );

    await chosenOption.click();
  },
);

Then("I should see the text {string} on the screen", async (expectedText) => {
  const elementWithText = $(`*=${expectedText}`);

  await expect(elementWithText).toBeDisplayed();
});

Then("The {string} button should be disabled", async (label) => {
  const button = await $(`button=${label}`);

  await expect(button).toBeDisabled();
});

Then(
  "The field {string} should have the validation message {string}",
  async (fieldName, validationMessage) => {
    const input = $(`[data-testid=${fieldName}-input]`);

    await input.waitForExist({ timeout: 500 }); // ms

    await expect(input).toHaveElementProperty(
      "validationMessage",
      validationMessage,
    );
  },
);
