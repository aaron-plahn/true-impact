import { Then, When } from "@wdio/cucumber-framework";

import loginPage from "./login.page.js";

When(
  "I enter invalid credentials: username {string}, password {string}",
  async (username, password) => {
    await loginPage.login(username, password);
  },
);

// TODO Add cases where the username or password are left blank

Then(
  "I should see an authentication error message saying {string}",
  async (message) => {
    await expect($("#auth-form-root")).toHaveText(message, {
      ignoreCase: true,
      containing: true,
    });
  },
);
