import { $ } from "@wdio/globals";
import Page from "./page.js";

/**
 * sub page containing specific selectors and methods for a specific page
 */
class LoginPage extends Page {
  /**
   * define selectors using getter methods
   */
  public get inputUsername() {
    return $('[placeholder="Email address"]');
  }

  public get inputPassword() {
    return $('[placeholder="Password"]');
  }

  public get submitButton() {
    return $('button[type="submit"]');
  }

  public get logoutIcon() {
    return $('button[data-testid="sign-out-button"]');
  }

  /**
   * a method to encapsule automation code to interact with the page
   * e.g. to login using username and password
   */
  public async login(username: string, password: string) {
    await this.inputUsername.setValue(username);
    await this.inputPassword.setValue(password);
    await this.submitButton.click();
  }

  /**
   * overwrite specific options to adapt it to page object
   */
  public async open() {
    await super.open("");
    await $('div[data-testid="sign-in-menu-control"]').click();
    await $("*=Sign In").click();
  }
}

export default new LoginPage();
