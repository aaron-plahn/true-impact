import { Given, When } from "@wdio/cucumber-framework";
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
    // TODO implement this
    console.log({ fieldName, fieldContent });
  },
);

When(
  "I complete the multitext input field {string} with the value {string}",
  async (fieldName, fieldContent) => {
    console.log({
      type: "multitext input",
      fieldName,
      fieldContent,
    });
  },
);

When(
  "I complete the date picker field {string} with the value {string}",
  async (fieldName, valueAsDateString) => {
    console.log({
      type: "date picker",
      fieldName,
      valueAsFieldString: valueAsDateString,
    });
  },
);

When(
  "I complete the select field {string} by chosing the option with label {string}",
  (fieldName, chosenOptionLabel) => {
    console.log({
      type: "single select",
      fieldName,
      chosenOptionValue: chosenOptionLabel,
    });
  },
);

When("I submit the command {string}", async (commandLabel) => {
  console.log({
    submittingCommandWithLabel: commandLabel,
  });
});
