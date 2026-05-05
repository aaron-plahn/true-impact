import { Given, When, Then } from '@wdio/cucumber-framework';
import { expect, $ } from '@wdio/globals'

import loginPage from '../pageobjects/login.page.js';
import SecurePage from '../pageobjects/secure.page.js';

const pages= {
    login: loginPage
} as const;

Given("I am on the login page", async () => {
    await pages.login.open()
});

When("When I login with valid admin credentials", async (username, password) => {
    await loginPage.login(username, password)
});

Then("Then I should see a flash message saying: 'Logged In'", async (message) => {
    await expect(SecurePage.flashAlert).toBeExisting();
    await expect(SecurePage.flashAlert).toHaveText(expect.stringContaining(message));
});

