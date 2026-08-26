import Page from "../../login/page";

class SurveyResponseReportPage extends Page {
  public get heading() {
    return $("h3");
  }

  public getRowForCategory(category: string) {
    return $(`//tr[td[contains(., "${category}")]]`);
  }
}

export const surveyResponseReportPage = new SurveyResponseReportPage();
