import { Given, When, Then } from "@wdio/cucumber-framework";
import { expect } from "@wdio/globals";

import loginPage from "../pageobjects/login.page.js";

const pages = {
  login: loginPage,
} as const;

Given("I am on the login page", async () => {
  await pages.login.open();
});

When("I login with valid admin credentials", async () => {
  await loginPage.login(
    process.env.TRUE_IMPACT_ADMIN_USERNAME as string,
    process.env.TRUE_IMPACT_ADMIN_PASSWORD as string,
  );
});

Then("I should see the log out icon", async () => {
  await expect(loginPage.logoutIcon).toBeExisting();
});
