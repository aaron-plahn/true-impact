import Page from "../../login/page";

class SurveyManagementIndexPage extends Page {
  public async goToSurveyDetailPage(surveyName: string) {
    await $(`*=${surveyName}`).click();
  }

  public async beginNewSurvey(surveyName = "Test Survey") {
    await $('[data-testid="new-survey-button"]').click();

    await $("#name-input").click();

    await $("#name-input").setValue(surveyName);

    await $('[type="submit"]').click();
  }

  public async addQuestion({
    label,
    prompt,
  }: {
    label: string;
    prompt: string;
  }) {
    await $("#ADD_QUESTION_TO_SURVEY_command-executor-button").click();

    await $("#label-input").click();
    await $("#label-input").setValue(label);

    await $("#prompt-input").click();
    await $("#prompt-input").setValue(prompt);

    await $("*=Add Question").click();
  }

  public async addOptionForQuestion({
    questionLabel,
    optionLabel,
    text,
  }: {
    questionLabel: string;
    optionLabel: string;
    text: string;
  }) {
    await $(`#ADD_OPTION_TO_SURVEY_QUESTION_${questionLabel}`).click();

    await $("#optionLabel-input").click();
    await $("#optionLabel-input").setValue(optionLabel);

    await $("#text-input").click();
    await $("#text-input").setValue(text);

    await $("*=Add Option").click();
  }

  public async finalize() {
    await $("#FINALIZE_SURVEY_command-executor-button").click();
    await $("*=Finalize").click();
  }

  public async openToAnonymousParticipant() {
    await $(
      "#OPEN_SURVEY_TO_ANONYMOUS_INDIVIDUAL_command-executor-button",
    ).click();

    await $("*=Open for Anonymous Individual").click();
  }

  public async goToResponsePage() {
    await $("#copyAccessCode").click();

    /**
     * If we click this, it opens in a new tab.
     */
    const responsePageLink = await $("#surveyResponseLink");

    const responsePageUrl = await responsePageLink.getAttribute("href");

    if (responsePageUrl === null) {
      throw Error(
        `The test has failed because the link element with ID #surveyResponseLink is missing an href attribute`,
      );
    }

    /**
     * We are simulating the effect of following the link.
     * We need a second test that proves that clicking the link logs the user out in the original tab.
     */
    await browser.deleteAllCookies();

    await browser.url(responsePageUrl);
  }

  public async getDetailLinkForSurvey(
    surveyName: string,
  ): Promise<string | null> {
    const link = await $(`*=${surveyName}`).getAttribute("href");

    return link;
  }

  public async open() {
    // an alternative is to drill through the UX to get here
    await super.open("surveys/manage");
  }
}

export const surveyManagementIndexPage = new SurveyManagementIndexPage();
