import { Given, Then, When } from "@wdio/cucumber-framework";
import { clearSurveys } from "../../../../../../utils/clear-surveys";
import { importSurvey } from "../../../../../../utils/import-survey";
import loginPage from "../../../../../login/login.page";
import Page from "../../../../../login/page";
import { menuPage } from "../../../../common/menu.page";

Given("I have cleared all existing surveys", async () => {
  await new Page().open("");

  await browser.deleteCookies();

  await loginPage.open();

  await loginPage.logInAsAdmin();

  const browserCookies = await browser.getCookies();

  const cookieHeader = browserCookies
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");

  console.log({ cookieHeader });

  await clearSurveys(cookieHeader);
});

When(
  "I directly load the survey management detail page for a survey imported from the fixture path {string}",
  async (fixturePath: string) => {
    try {
      await new Page().open("");

      await browser.deleteCookies();

      await loginPage.open();

      await loginPage.logInAsAdmin();

      const browserCookies = await browser.getCookies();

      const cookieHeader = browserCookies
        .map((cookie) => `${cookie.name}=${cookie.value}`)
        .join("; ");

      const surveyId = await importSurvey(fixturePath, cookieHeader);

      const link = `surveys/manage/${surveyId}`;

      await loginPage.logOut();

      new Page().open(link);
    } catch {
      // todo
    }
  },
);

Then(
  "I should see a menu link to the survey management index page",
  async () => {
    await browser.setWindowSize(1920, 1080);

    await expect($('[data-testid="hamburger-menu"]')).not.toBeDisplayed();

    const link = menuPage.getLinkByText("Build a Survey");

    await link.scrollIntoView();

    await link.waitForClickable({ timeout: 10000 });

    await link.click();

    // data-testid?
    await expect($(`*=NEW`)).toBeExisting();
  },
);

Then(
  "I should not see a menu link to the survey management index page",
  async () => {
    await expect($('a[href="/surveys/manage"]')).not.toBeExisting();
  },
);
