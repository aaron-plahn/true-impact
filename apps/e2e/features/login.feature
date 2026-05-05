Feature: User login

  Scenario: A registered admin user provides valid credentials

    Given I am on the login page
    When I login with valid admin credentials
    Then I should see a flash message saying: 'Logged In'
