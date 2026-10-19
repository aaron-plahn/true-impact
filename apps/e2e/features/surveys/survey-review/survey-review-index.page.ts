import Page from "../../login/page";

class SurveyReviewIndexPage extends Page {
  public async viewMostRecentSurveyResponse() {
    const firstRow = $("table tbody tr:nth-child(1)");

    await firstRow.click();
  }

  public async open() {
    await expect($('//a[text()="Review a Survey"]')).toBeExisting();

    await $('//a[text()="Review a Survey"]').click();
  }
}

export const surveyReviewIndexPage = new SurveyReviewIndexPage();
