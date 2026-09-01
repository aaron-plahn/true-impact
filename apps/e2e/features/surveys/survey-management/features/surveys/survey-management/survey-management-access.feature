Feature: Access to survey management routes should depend on the user's permissions
    Background: Given I have cleared all existing surveys

    Scenario: An admin user navigates to survey management via the main menu
        Given I am logged in as an admin
        When I open the menu
        Then I should see a menu link to the survey management index page

    # Note that we don't test that admin can load paths directly because that is not currently an intended use case, but it's not a problem if they can

    # TODO Authenticated, non admin user test case

    Scenario: A public user should not see survey management on the main menu
        Given I am a public user
        When I am on the home page
        When I open the menu
        Then I should not see a menu link to the survey management index page

    Scenario: A public user attempts to load the survey management index page directly by path
        Given I am a public user
        When I directly load the page "surveys/manage"
        Then I should be redirected to the home page

    Scenario: A public user attempts to load the survey management page to edit a specific existing survey
        Given I am a public user
        And There is a survey named "My Draft Survey"
        When I directly load the survey management detail page for a survey imported from the fixture path "import-medicine-wheel-survey.data.json"
        Then I should be redirected to the home page
