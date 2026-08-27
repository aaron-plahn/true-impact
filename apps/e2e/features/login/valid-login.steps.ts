import { Given, Then, When } from "@wdio/cucumber-framework";
import { expect } from "@wdio/globals";

import loginPage from "./login.page.js";

const pages = {
  login: loginPage,
} as const;

Given("I am on the login page", async () => {
  await pages.login.open();
});

When("I log in with valid admin credentials", async () => {
  const adminUsername = process.env.SYSTEM_ADMIN_USERNAME as string;

  if (!adminUsername) {
    throw new Error(
      `Failed to read admin username for e2e test. Did you set $SYSTEM_ADMIN_USERNAME?`,
    );
  }

  const adminPassword = process.env.INITIAL_ADMIN_PASSWORD as string;

  if (!adminPassword) {
    throw new Error(
      `Failed to read admin password for e2e test. Did you set $INITIAL_ADMIN_PASSWORD?`,
    );
  }

  await loginPage.logIn(
    /**
     * Note that these credentials are the ones used by the server to automatically create a
     * first admin user on bootsrap if there are no users in the DB.
     */
    adminUsername,
    adminPassword,
  );
});

When("I log out", async () => {
  await loginPage.logOut();
});

Then("I should see the logout icon", async () => {
  await expect(loginPage.logoutIcon).toBeExisting();
});

Then("I should see the login menu", async () => {
  await expect(loginPage.loginMenu).toBeExisting();
});

Then("There should be no cookies", async () => {
  const cookies = await browser.getCookies();

  expect(cookies).toHaveLength(0);
});
