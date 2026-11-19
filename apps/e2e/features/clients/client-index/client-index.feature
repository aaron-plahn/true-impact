Feature: Client index page- a searchable list of clients
    Background:
        Given I have cleared all existing clients and communities
        And The clients in fixture file "clients-to-search.data.json" have been imported

    Scenario: Searching the field First Name with the text "Zq" should find 0 results
        Given I am logged in as an admin
        When I visit the client index page
        And I complete the text search field "firstName" with the value "Zq"
        Then 0 results should be visible in the "clients" table