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
    return $("*=Fuck yeah@!");
  }

  public async open(surveyId: string) {
    // await super.open(`surveys/begin/${surveyId}`);

    const path = `surveys/responses/begin/${surveyId}`;

    return browser.url(`http://localhost:3234/${path}`);
  }
}

export const surveyCompletionPage = new SurveyCompletionPage();
