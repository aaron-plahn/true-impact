import { Given, Then, When } from "@wdio/cucumber-framework";
import Page from "../../login/page";
import { menuPage } from "../common/menu.page";

Given("I am a public user", async () => {
  await browser.deleteAllCookies();
});

Given("I am on the home page", async () => {
  await new Page().open("");
});

When("I directly load the page {string}", async (path: string) => {
  await new Page().open(path);
});

When("I load the home page", async () => {
  await new Page().open("");
});

When("I open the menu", async () => {
  /**
   * Currently, the menu is open by default at `md` resolution, but not at smaller resolutions.
   * Further, the e2e (headless) defaults to smaller resolution with most attempts to change this futile.
   * We avoid this issue currently by forcing the screen resolution in the conf for e2e.
   * A better way to handle this might be to conditionally click the hamburger menu if it's found.
   * An even better approach is to test with both screen size. Testing responsive behavioru is currently
   * out-of-scope, though.
   */
});

Then("I should see a menu link to the survey review index page", async () => {
  const link = menuPage.getLinkByText("Review a Survey");

  // we not only validate that the link exists, but also that it works
  await link.click();

  await expect($("*=Choose a Survey Response to Review")).toBeExisting();
});

Then(
  "I should not see a menu link to the survey review index page",
  async () => {
    await expect($('a[href="/surveys/review"]')).not.toBeExisting();
  },
);

Then("I should be redirected to the home page", async () => {
  // TODO browser.config.baseUrl
  const expectedFullUrl = `http://localhost:4200/`;

  let url: string = await browser.getUrl();

  await browser.waitUntil(
    async () => {
      url = await browser.getUrl();

      return url === expectedFullUrl;
    },
    {
      timeout: 15000,
      timeoutMsg: `Timed out waiting for URL to change in the dashbaord.`,
    },
  );

  expect(url).toBe(expectedFullUrl);
});
