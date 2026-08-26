Feature: Viewing a report for a survey response record

    Scenario: As an admin viewing the report generated for a client's submitted survey response
        When The survey in the fixture file: "features/support/fixtures/surveys/import-medicine-wheel-survey.data.json" has been imported
        Given I am logged in as an admin
        And I navigate to the detail page for survey "Medicine Wheel"
        And The survey is open with a one-time passcode
        And I am on the survey response page
        When I begin the survey "Medicine Wheel"
        And I answer question "1" by choosing option "a"
        And I answer question "1.1" by choosing option "c"
        And I answer question "1.1.1" by choosing option "b"
        And I submit the survey
        And I log in as admin
        And I navigate to the survey review page
        And I select the most recently submitted survey response
        Then I should see the survey response detail page for: "Medicine Wheel"