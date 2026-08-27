import { Given, Then, When } from "@wdio/cucumber-framework";
import Page from "../../login/page";
import { menuPage } from "../common/menu.page";

Given("I am on the home page", async () => {
  await new Page().open("");
});

// Do we need this, too? Or just the one above?
When("I load the home page", async () => {
  await new Page().open("");
});

When("I open the menu", async () => {
  // currently, the menu is open by default, but this might not always be the case
});

Then("I should see a menu link to the survey review index page", async () => {
  const link = menuPage.getLinkByText("Review a Survey");

  await link.click();

  await expect($('*="Review a Survey"')).toBeExisting();
});

Then(
  "I should not see a menu link to the survey review index page",
  async () => {
    await expect($('a[href="/surveys/review"]')).not.toBeExisting();
  },
);
