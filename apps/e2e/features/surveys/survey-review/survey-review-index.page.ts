import Page from "../../login/page";

class SurveyReviewIndexPage extends Page {
  public async viewMostRecentSurveyResponse() {
    const firstRow = await $("table tbody tr:nth-child(1)");

    await firstRow.click();
  }

  public async open() {
    await super.open("surveys/review");
  }
}

export const surveyReviewIndexPage = new SurveyReviewIndexPage();
