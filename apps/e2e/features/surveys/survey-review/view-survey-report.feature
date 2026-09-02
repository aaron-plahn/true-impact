Feature: Viewing a report for a survey response record
    Background:
        Given I have cleared all existing surveys

    Scenario: As an admin viewing the report generated for a client's submitted survey response
        When The survey in the fixture file "import-medicine-wheel-survey.data.json" has been imported
        Given I am logged in as an admin
        And I navigate to the detail page for survey "DSS Client Evaluation"
        And The survey is open with a one-time passcode
        And I am on the survey response page
        When I begin the survey "DSS Client Evaluation"
        And I answer question "1" by choosing option "a"
        And I answer question "1.1" by choosing option "c"
        And I answer question "1.1.1" by choosing option "b"
        And I submit the survey
        And I log in as admin
        And I navigate to the survey review page
        And I select the most recently submitted survey response
        And I navigate to the response detail page for "DSS Client Evaluation"
        # TODO name the survey differently from the report
        And I navigate to the report detail for report "medicine wheel"
        Then I should see the report name "medicine wheel"
        And I should see a report item displaying the value 2 for the category "red"
        And I should see a report item displaying the value 0 for the category "white"
        And I should see a report item displaying the value 0 for the category "yellow"
        And I should see a report item displaying the value 1 for the category "black"
        # This is a hack. It's really difficult to set up the following test separately, but it's an important test case
        And A public user shouldn't see the report "medicine wheel"
