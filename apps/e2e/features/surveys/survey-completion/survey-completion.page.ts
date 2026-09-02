import { Key } from "webdriverio";
import Page from "../../login/page";

class SurveyCompletionPage extends Page {
  public async beginSurvey() {
    await $("a").click();
  }

  public async answerQuestion({
    questionLabel: _,
    chosenOptionLabel,
  }: {
    questionLabel: string;
    chosenOptionLabel: string;
  }) {
    await $(
      `input[name="chosenOptionLabel"][value="${chosenOptionLabel}"]`,
    ).click();

    await $("button*=Submit").click();
  }

  public get surveySubmissionButton() {
    return $("button*=Submit");
  }

  public get submissionAcknowledgement() {
    return $("*=Succesfully submitted survey");
  }

  public async open(_surveyName: string) {
    await $('[name="accessCode"]').click();

    const isMac = process.platform == "darwin";

    await browser.keys([isMac ? Key.Ctrl : Key.Control, "v"]);

    await $("button*=Begin").click();

    const cookies = await browser.getCookies(["survey-response-session"]);

    expect(cookies.length).toBeGreaterThan(0);
  }
}

export const surveyCompletionPage = new SurveyCompletionPage();
