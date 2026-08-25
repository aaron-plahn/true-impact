Feature: Viewing a report for a survey response record

    Scenario: As an admin viewing the report generated for a client's submitted survey response

        Given I am logged in as an admin
        When I navigate to the survey review page
        And I select the most recently submitted survey response
        Then I should see the survey response detail page for: "Medicine Wheel"