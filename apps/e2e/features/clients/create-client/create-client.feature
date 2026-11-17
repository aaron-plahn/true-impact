Feature: Client management: create a new Client
    Background:
        Given I have cleared all existing clients

    Scenario: The form is complete and the request is valid
        Given I am logged in as an admin
        When I open the new client page
        And I complete the text input field "firstName" with the value "Rob"
        # TODO - omit middleName, multiple middleNames (spaces in input)
        And I complete the multitext input field "middleName" with the value "James"
        And I complete the text input field "lastName" with the value "McGee"
        And I complete the date picker field "dateOfBirth" with the value "2008-04-13"
        # TODO `isIndigenous==="Yes"` and `isIndigenous==="No"`
        And I complete the select field "isIndigenous" by chosing the option with label "unknown"
        # TODO change this to the `CREATE_CLIENT` label
        And I submit the command "submit"

# TODO when there is already a client with the given name

# TODO when omitting an optional field

# TODO when violating a field constraint