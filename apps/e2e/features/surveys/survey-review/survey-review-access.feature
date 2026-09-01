Feature: Access to survey review routes should depend on the user

        Scenario: An admin user navigates to survey review via the main menu

                Given I am logged in as an admin
                When I open the menu
                Then I should see a menu link to the survey review index page

        Scenario: A public user should not see survey review on the main menu
                Given I am on the home page
                When I load the home page
                And I open the menu
                Then I should not see a menu link to the survey review index page

        # Also /surveys/manage
        Scenario: A public user should not have direct access to the survey review index page
                Given I am a public user
                When I directly load the page "surveys/review"
                Then I should be redirected to the home page