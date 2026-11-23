Feature: Adding a question to an existing survey

    Background:
        Given I have cleared all existing surveys
        And I am logged in as an admin

    Scenario: When the question label is omitted
        Given I am on the survey management index page
        And I start a new survey named "Foobar or Not?"
        When I begin the command with label "Add Question"
        And I complete the text input field "label" with the value "a"
        And I submit the command "Add Question"
        Then The field "prompt" should have the validation message "Please fill out this field."

    Scenario: When the question prompt is omitted
        Given I am on the survey management index page
        And I start a new survey named "Foobar or Not?"
        When I begin the command with label "Add Question"
        And I complete the text input field "prompt" with the value "Do you like my test question?"
        Then The field "label" should have the validation message "Please fill out this field."

# note that we use the happy path for test setup for other test cases