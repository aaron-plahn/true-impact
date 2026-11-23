Feature: Adding an option to an existing survey question

    Background:
        Given I have cleared all existing surveys
        And I am logged in as an admin

    Scenario: When the option text is omitted
        # TODO use a data-seeding util to add the existing survey instead of the UX
        Given I am on the survey management index page
        And I start a new survey named "Foobar or Not?"
        When I begin the command with label "Add Question"
        And I complete the text input field "label" with the value "a"
        And I complete the text input field "prompt" with the value "Do you like my test question?"
        And I submit the command "Add Question"
        And I begin the command with label "Add Option"
        And I complete the text input field "label" with the value "i"
        And I submit the command "Add Option"
        Then The field "text" should have the validation message "Please fill out this field."

    Scenario: When the option label is omitted
        Given I am on the survey management index page
        And I start a new survey named "Foobar or Not?"
        When I begin the command with label "Add Question"
        And I complete the text input field "label" with the value "a"
        And I complete the text input field "prompt" with the value "Do you like my test question?"
        And I submit the command "Add Question"
        And I begin the command with label "Add Option"
        And I complete the text input field "text" with the value "Not very well!"
        And I submit the command "Add Option"
        Then The field "label" should have the validation message "Please fill out this field."

# We test the happy path as part of setup for other tests