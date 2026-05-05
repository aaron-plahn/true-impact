Feature: Invalid login attempts

    Scenario: A user attemnpts to log in with invalid credentials
        Given I am on the login page
        When I enter invalid credentials: username "<username>", password "<password>"
        Then I should see an authentication error message saying "<errorMessage>"

    Examples:
        |   username            | password              |   errorMessage
        |   admin               |   passw0rd1@          |   Email is invalid
        |   hotmale@hotmail.com |   my$PACE95           |   Incorrect email and password combination