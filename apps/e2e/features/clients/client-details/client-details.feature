# TODO test that a non-admin can not see this page
Feature: Client Details page
    Background:
        Given I have cleared all existing clients and communities
        And The communities in the fixture file "import-communities.data.json" has been imported

    Scenario: When adding the community of a client who is already in the system
        Given I am logged in as an admin
        When I open the new client page
        # TODO use a fixture to seed this client.
        And I complete the text input field "firstName" with the value "Susie"
        And I complete the multitext input field "middleNames" with the value "Sarah"
        And I complete the text input field "lastName" with the value "Simpson"
        And I complete the date picker field "dateOfBirth" with the value "12-31-2020"
        And I complete the select field "isIndigenous" by chosing the option with label "unknown"
        And I submit the command "Create Client"
        # It is assumed that the app redirects to the client detail page for the new client at this point
        And I begin the command with label "Add Client's Community"
        And I complete the dynamic seletor field "communityId" by typing "Big" and choosing the result "Big Creek"
        # TODO Shouldn't this be "Add Client's Community"?
        And I submit the command "Add Community"
        Then The client's community should appear as "Big Creek"
        And The client's isIndigenous should appear as "Yes"
        # TODO Suside S. Simpson
        And The client's "name" should appear as "Susie Simpson"
        And The client's "dob" should appear as "2020-12-31"