Feature: Completing a survey
    Background:
        Given I have cleared all existing surveys

    Scenario: As an anonymous participant answering all questions in a one-question survey

        Given There is a survey named "Staff Questionnaire"
        And It has a question "i": "How hard do you work"
        And Question "i" has an option "a": "Barely at all"
        And Question "i" has an option "b": "Hard enuff"
        And Question "i" has an option "c": "Who Cares"
        And The survey has been finalized
        And The survey is open with a one-time passcode
        And I am on the survey response page
        When I begin the survey "Staff Questionnaire"
        And I answer question "1" by choosing option "b"
        And I submit the survey
        Then It should display the an acknowledgement that the submission was received

    Scenario: As an anonymous participant completing all questions in an open survey and submitting the survey

        Given There is a survey named "Staff Evaluation"
        And It has a question "i": "How hard do you work"
        And Question "i" has an option "a": "Barely at all"
        And Question "i" has an option "b": "Hard enuff"
        And Question "i" has an option "c": "Who Cares"
        And It has a question "ii": "Do you ever take breaks?"
        And Question "ii" has an option "a": "Yes"
        And Question "ii" has an option "b": "No"
        And Question "ii" has an option "c": "Maybe"
        And The survey has been finalized
        And The survey is open with a one-time passcode
        And I am on the survey response page
        When I begin the survey "Staff Evaluation"
        And I answer question "i" by choosing option "a"
        And I answer question "ii" by choosing option "b"
        And I submit the survey
        Then It should display the an acknowledgement that the submission was received
