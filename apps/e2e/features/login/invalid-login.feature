Feature: Invalid login attempts

    Scenario Outline: A user attemnpts to log in with invalid credentials
        Given I am on the login page
        When I enter invalid credentials: username "<username>", password "<password>"
        Then I should see an authentication error message saying "<message>"

        Examples:
            | username            | password   | message             |
            | admin               | passw0rd1@ | Invalid Credentials |
            | hotmale@hotmail.com | my$PACE95  | Invalid Credentials |