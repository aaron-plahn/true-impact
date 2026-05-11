Feature: Start a new Survey template

    Scenario: As a registered admin, I should be able to start a new Survey

    Given I am logged in as an admin
    And I am on the survey management index page
    When I start a new survey
    Then It should display the newly created survey
    