import { Before } from "@wdio/cucumber-framework";
import { importSurvey } from "../../utils/import-survey.ts";

Before({ tags: "@import-survey" }, async () => {
  const browserCookies = await browser.getCookies();

  const cookieHeader = browserCookies
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");

  await importSurvey("fixtures/medicine-wheel-survey.json", cookieHeader);
});
