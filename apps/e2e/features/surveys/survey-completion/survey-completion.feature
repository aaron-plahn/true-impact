Feature: Completing a survey

    Scenario: As an anonymous participant beginning an open survey

    Given There is a survey named "Some Questions by Aaron"
    And It has a question "1": "What would you do for a Klondike bar?"
    And Question "1" has an option "a": "Nothing"
    And Question "1" has an option "b": "Anything"
    And Question "1" has an option "c": "Wouldn't you like to know"
    And The survey is published
    When I begin the survey "Some Questions by Aaron"
    Then It should display the question "1": "What would you do for a Klondike bar?"

    Scenario: As an anonymous participant answering all questions in an open survey

    Given There is a survey named "Staff Questionnaire"
    And It has a question "i": "How hard do you work"
    And Question "i" has an option "a": "Barely at all"
    And Question "i" has an option "b": "Hard enuff"
    And Question "i" has an option "c": "Who Cares"
    And The survey is published
    When I begin the survey "Staff Questionnaire"
    And I answer question "1" by choosing option "b"
    Then It should display the survey submission button

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
    And The survey is published
    When I begin the survey "Staff Evaluation"
    And I answer question "i" by choosing option "a"
    And I answer question "ii" by choosing option "b"
    And I submit the survey
    Then It should display the an acknowledgement that the submission was received