import { $ } from "@wdio/globals";
import Page from "./page.js";

/**
 * sub page containing specific selectors and methods for a specific page
 */
class LoginPage extends Page {
  public get loginMenu() {
    return $('[data-testid="sign-in-menu-control"]');
  }

  /**
   * define selectors using getter methods
   */
  public get inputUsername() {
    return $('[placeholder="Username"]');
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

  public get avatarMenuControl() {
    return $('[data-testid="avatar-menu-control"]');
  }

  public async openAvatarMenu() {
    await this.avatarMenuControl.click();
  }

  /**
   * a method to encapsule automation code to interact with the page
   * e.g. to log in using username and password
   */
  public async logIn(username: string, password: string) {
    await this.inputUsername.setValue(username);
    await this.inputPassword.setValue(password);
    await this.submitButton.click();
  }

  public async logInAsAdmin() {
    const adminUsername = process.env.SYSTEM_ADMIN_USERNAME as string;

    if (!adminUsername) {
      throw new Error(
        `Failed to read admin username for e2e test. Did you set $SYSTEM_ADMIN_USERNAME?`,
      );
    }

    const adminPassword = process.env.INITIAL_ADMIN_PASSWORD as string;

    if (!adminPassword) {
      throw new Error(
        `Failed to read admin password for e2e test. Did you set $INITIAL_ADMIN_PASSWORD?`,
      );
    }

    await this.logIn(adminUsername, adminPassword);
  }

  public async logOut() {
    await this.openAvatarMenu();

    await this.logoutIcon.click();
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
