import Page from "../../login/page";

class NewClientPage extends Page {
  open() {
    return super.open(`clients/new`);
  }
}

export const newClientPage = new NewClientPage();
