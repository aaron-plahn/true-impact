Feature: Client index page- a searchable list of clients
    Background:
        Given I have cleared all existing clients and communities
        And The clients in fixture file "clients-to-search.data.json" have been imported

    Scenario: When all search fields are left empty
        Given I am logged in as an admin
        When I visit the client index page
        Then 5 results should be visible in the "client-index" table

    Scenario: Searching the field First Name with the text "Zq" should find 0 results
        Given I am logged in as an admin
        When I visit the client index page
        And I complete the text search field "firstName" with the value "Zq"
        Then 0 results should be visible in the "client-index" table

    Scenario: Searching the field First Name with the text "dha" should find 1 result (Minnie Midhaver)
        Given I am logged in as an admin
        When I visit the client index page
        And I complete the text search field "firstName" with the value "Minn"
        Then 1 results should be visible in the "client-index" table

    Scenario: Searching the field First Name with the text "M" should find 2 reults (Minnie and Marcus)
        Given I am logged in as an admin
        When I visit the client index page
        And I complete the text search field "firstName" with the value "M"
        Then 2 results should be visible in the "client-index" table

    Scenario: Searching the field Last Name with the text "Zq" should find 0 results
        Given I am logged in as an admin
        When I visit the client index page
        And I complete the text search field "lastName" with the value "Zq"
        Then 0 results should be visible in the "client-index" table

    Scenario: Searching the field Last Name with the text "Mid" should find 3 results (Igotta, Iveno, Minnie)
        Given I am logged in as an admin
        When I visit the client index page
        And I complete the text search field "lastName" with the value "Mid"
        Then 3 results should be visible in the "client-index" table

    Scenario: Searching the field Community with the text "Zq" should find 0 results

    Scenario: Searching the field Community with the text "Big" should find 1 result (Big Creek)
        Given I am logged in as an admin
        When I visit the client index page
        And I complete the text search field "community" with the value "Big"
        Then 1 results should be visible in the "client-index" table

    Scenario: Searching the field Community with the text "Creek" should find 3 results 3 results (Big Creek, Little Cree, Medium-Sized Creek)
        Given I am logged in as an admin
        When I visit the client index page
        And I complete the text search field "community" with the value "Creek"
        Then 3 results should be visible in the "client-index" table

# TODO Allow users to filter clients without a community