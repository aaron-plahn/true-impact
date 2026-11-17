import { Given, Then, When } from "@wdio/cucumber-framework";
import { expect } from "@wdio/globals";
import { clearTestData } from "../../../utils/clear-surveys";
import loginPage from "../../login/login.page";
import Page from "../../login/page";
import { newClientPage } from "./new-client.page";

Given("I have cleared all existing clients", async () => {
  await new Page().open("");

  await browser.deleteCookies();

  await loginPage.open();

  await loginPage.logInAsAdmin();

  await expect(loginPage.avatarMenuControl).toBeExisting();

  const browserCookies = await browser.getCookies();

  const cookieHeader = browserCookies
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");

  await clearTestData(cookieHeader, ["clients/test-setup"]);
});

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
    console.log({
      type: "date picker",
      fieldName,
      valueAsFieldString: MMDDYYYY,
    });

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
    console.log({
      type: "single select",
      fieldName,
      chosenOptionValue: chosenOptionLabel,
    });

    const targetFormField = $(`[data-testid="${fieldName}-input"]`);

    await targetFormField.selectByVisibleText(chosenOptionLabel);
  },
);

When("I submit the command {string}", async (commandLabel) => {
  await $(`button=${commandLabel}`).click();
});

Then("I should see the text {string} on the screen", async (expectedText) => {
  const elementWithText = $(`*=${expectedText}`);

  await expect(elementWithText).toBeDisplayed();
});
