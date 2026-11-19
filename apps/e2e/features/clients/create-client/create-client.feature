Feature: Client management: create a new Client
    Background:
        Given I have cleared all existing clients and communities

    @only
    Scenario: When omitting the required field firstName
        Given I am logged in as an admin
        When I open the new client page
        # And I complete the text input field "firstName" with the value "Rob"
        And I complete the multitext input field "middleNames" with the value "James"
        And I complete the text input field "lastName" with the value "McGee"
        And I complete the date picker field "dateOfBirth" with the value "04-13-2008"
        And I complete the select field "isIndigenous" by chosing the option with label "unknown"
        And I submit the command "Create Client"
        Then The field "firstName" should have the validation message "Please fill out this field"

    Scenario: When creating a client whose Indigenous community is unknown
        Given I am logged in as an admin
        When I open the new client page
        And I complete the text input field "firstName" with the value "Rob"
        And I complete the multitext input field "middleNames" with the value "James"
        And I complete the text input field "lastName" with the value "McGee"
        And I complete the date picker field "dateOfBirth" with the value "04-13-2008"
        And I complete the select field "isIndigenous" by chosing the option with label "unknown"
        And I submit the command "Create Client"
        Then I should see the text "McGee" on the screen
        And I should see the text "Rob" on the screen
        And I should see the text "2008-04-13" on the screen
        And I should see the text "Unknown" on the screen

    Scenario: When creating a non-Indigenous client
        Given I am logged in as an admin
        When I open the new client page
        And I complete the text input field "firstName" with the value "Susie"
        And I complete the multitext input field "middleNames" with the value "Sarah"
        And I complete the text input field "lastName" with the value "Simpson"
        And I complete the date picker field "dateOfBirth" with the value "12-31-2020"
        And I complete the select field "isIndigenous" by chosing the option with label "no"
        And I submit the command "Create Client"
        Then I should see the text "Simpson" on the screen

    Scenario: When creating an Indigenous client whose community is unknown
        Given I am logged in as an admin
        When I open the new client page
        And I complete the text input field "firstName" with the value "Amy"
        And I complete the multitext input field "middleNames" with the value "Jamie"
        And I complete the text input field "lastName" with the value "Jones"
        And I complete the date picker field "dateOfBirth" with the value "01-01-1999"
        And I complete the select field "isIndigenous" by chosing the option with label "yes"
        And I complete the switch field "isCommunityKnown" by switching it
        And I submit the command "Create Client"
        Then I should see the text "Jones" on the screen

    Scenario: When creating an Indigenous client whose community is unknown
        Given The communities in the fixture file "import-communities.data.json" has been imported
        Given I am logged in as an admin
        When I open the new client page
        And I complete the text input field "firstName" with the value "Frank"
        # no middle name
        # And I complete the multitext input field "middleNames" with the value ""
        And I complete the text input field "lastName" with the value "Parkins"
        And I complete the date picker field "dateOfBirth" with the value "02-29-1996"
        And I complete the select field "isIndigenous" by chosing the option with label "yes"
        # The community is known
        # And I complete the switch field "isCommunityKnown" by switching it
        And I complete the dynamic seletor field "communityId" by typing "Big" and choosing the result "Big Creek"
        And I submit the command "Create Client"
        Then I should see the text "Parkins" on the screen

# TODO when there is already a client with the given name

# TODO when omitting an optional field

# TODO when violating a field constraint
