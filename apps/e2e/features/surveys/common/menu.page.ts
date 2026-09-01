import Page from "../../login/page";

class MenuPage extends Page {
  public getLinkByText(text: string) {
    // This is a hack to attempt to fix the below selector which is flakey in the CI
    if (text === "Build a Survey") {
      return $(`a[href="/surveys/manage"]`);
    }

    return $(`a*=${text}`);
  }
}

export const menuPage = new MenuPage();
