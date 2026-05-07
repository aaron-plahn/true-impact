import Page from "../../login/page";

class SurveyPage extends Page {
  public async beginNewSurvey(surveyName = "Test Survey") {
    await $('[data-testid="new-survey-button"]').click();
  }

  public async open() {
    // an alternative is to drill through the UX to get here
    await super.open("surveys/manage");
  }
}

export const surveyPage = new SurveyPage();
```````````````````````````````````````