Feature: User login

  Scenario: A registered admin user provides valid credentials

    Given I am on the login page
    When I login with valid admin credentials
    Then I should see the log out icon

  Scenario: A registered admin user logs in then logs out

    Given I am on the login page
    # Reword this as "log in"
    When I login with valid admin credentials
    And I log out
    Then I should see the log in menu
    And There should be no cookies