# TODO name anonymous test consistently
Feature: Completing a survey as a client
    Background:
        Given I have cleared all existing surveys
        And I have cleared all existing clients and communities
        And The survey in the fixture file "import-medicine-wheel-survey.data.json" has been imported
        And The clients in fixture file "clients-to-search.data.json" have been imported

    Scenario: As a known client completing the Medicine Wheel survey
        Given I am logged in as an admin
        And I am on the survey management index page
        And I follow the link to the survey named "Evaluation"
        And I begin the command with label "Open to Client"
        And I complete the dynamic selector field "clientId" by typing "Mi" and choosing the result "Minnie Midhaver"
        And I submit the command "Open to Client"
        And I am on the survey response page
        When I begin the survey "DSS Client Evaluation"
        # no value currently
        And I answer question "i" by choosing option "a"
        # red -> 1
        And I answer question "ii" by choosing option "b"
        And I submit the survey
        # you must log back in as following the survey link also logs the admin out
        And I am logged in as an admin
        And I visit the client index page
        And I navigate to the detail page for client "Minnie"
        And I navigate to the response page for attempt number 1 of client survey "DSS Client Evaluation"
        And I navigate to the survey report named "medicine wheel"
        Then The report's "red" should have the value 1
        And The report's "white" should have the value 0
        And The report's "yellow" should have the value 0
        And The report's "black" should have the value 0