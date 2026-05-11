import Page from "../../login/page";

class SurveyBuilderPage extends Page {
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
    questionLabel: _,
    optionLabel,
    text,
  }: {
    questionLabel: string;
    optionLabel: string;
    text: string;
  }) {
    await $("#ADD_OPTION_TO_SURVEY_QUESTION_command-executor-button").click();

    await $("#optionLabel-input").click();
    await $("#optionLabel-input").setValue(optionLabel);

    await $("#text-input").click();
    await $("#text-input").setValue(text);

    await $("*=Add Option").click();
  }

  public async publish() {
    await $("#PUBLISH_SURVEY_command-executor-button").click();
    await $("*=Publish").click();
  }

  public async open() {
    // an alternative is to drill through the UX to get here
    await super.open("surveys/manage");
  }
}

export const surveyPage = new SurveyBuilderPage();
