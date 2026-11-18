import { Given } from "@wdio/cucumber-framework";
import { importClients } from "../../../utils/import-clients.ts";
import loginPage from "../../login/login.page.ts";
import Page from "../../login/page.ts";

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
