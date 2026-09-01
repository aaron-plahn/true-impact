import Page from "../../login/page";

class MenuPage extends Page {
  public getLinkByText(text: string) {
    return $(`a*=${text}`);
  }
}

export const menuPage = new MenuPage();
