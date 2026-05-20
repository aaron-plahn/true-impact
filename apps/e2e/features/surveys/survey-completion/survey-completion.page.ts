import Page from "../../login/page";

class SurveyCompletionPage extends Page {
  public async beginSurvey() {
    await $("button*=Begin").click();

    await $("button*=GO").click();
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

  public async goToNextQuestion() {
    await $(`button*=NEXT`).click();
  }

  public get surveySubmissionButton() {
    return $("button*=Submit");
  }

  public get submissionAcknowledgement() {
    return $("*=Succesfully submitted survey");
  }

  public async open(surveyName: string) {
    const path = `surveys/responses/participate`;

    await browser.url(`http://localhost:3234/${path}`);

    await $(`*=${surveyName}`).click();
  }
}

export const surveyCompletionPage = new SurveyCompletionPage();
