Feature: Start a new Survey template
    Background:
        Given I have cleared all existing surveys

    Scenario: As a registered admin, when I providing a new survey name

        Given I am logged in as an admin
        And I am on the survey management index page
        When I build a complete survey named "Weekly Questionairre"
        Then It should display the newly created survey

    Scenario: When omitting the required "name" field
        Given I am logged in as an admin
        And I am on the survey management index page
        And I go to the new survey page
        When I submit the command "Create Survey"
        Then The field "name" should have the validation message "Please fill out this field."
