import Page from "../../login/page";

class ClientIndexPage extends Page {
  open() {
    return super.open("clients");
  }
}

export const clientIndexPage = new ClientIndexPage();
