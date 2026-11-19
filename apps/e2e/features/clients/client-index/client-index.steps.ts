import { Given, Then, When } from "@wdio/cucumber-framework";
import { expect } from "@wdio/globals";
import { importClients } from "../../../utils/import-clients.ts";
import loginPage from "../../login/login.page.ts";
import Page from "../../login/page.ts";
import { clientIndexPage } from "./client-index.page.ts";

Given(
  "The clients in fixture file {string} have been imported",
  async (fixtureFile) => {
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

    await importClients(fixtureFile, cookieHeader);
  },
);

When("I visit the client index page", async () => {
  await clientIndexPage.open();
});

When(
  "I complete the text search field {string} with the value {string}",
  async (fieldName, searchText) => {
    const targetField = $(`[data-testid="search-${fieldName}"]`);

    await targetField.setValue(searchText);

    const loading = $(`[data-testid="loading"]`);

    await expect(loading).not.toBeExisting();
  },
);

When(
  "I complete the select search field {string} with the value labeled {string}",
  async (fieldName, labelForTargetValue) => {
    const targetField = $(`[data-testid="search-${fieldName}"]`);

    await targetField.selectByVisibleText(labelForTargetValue);
  },
);

/**
 * TODO Ideally, we would check the contents of the rows we find.
 * We need to update our test helpers so we can seed data with known contents
 * instead of using magic fixture files. At that point, we will have a shared reference
 * to the data in each row and we can add a helper that checks that the specific row is visible.
 * This will most likely involve using the hidden `id` property on the view as a `data-testid`.
 */
Then(
  "{int} results should be visible in the {string} table",
  async (expectedNumberOfResults, viewName) => {
    await expect(
      $$(`[data-testid="${viewName}-search-results"] tr`),
    ).toBeElementsArrayOfSize(expectedNumberOfResults);
  },
);
