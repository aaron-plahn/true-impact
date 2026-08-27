Feature: User login

  Scenario: A registered admin user provides valid credentials

    Given I am on the login page
    When I log in with valid admin credentials
    Then I should see the logout icon

  Scenario: A registered admin user logs in then logs out

    Given I am on the login page
    When I log in with valid admin credentials
    And I log out
    Then I should see the login menu
    And There should be no cookies
