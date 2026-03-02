# <next>

This first release of the True Impact platform introduces a working model for user management, client management, and survey creation and completion.

## #7

In this commit, we introduce a comprehensive workflow for survey completion.

## #6

In this commit, we introduce a helper for finding the next question that should be asked based on
a user's response to the current question.

## #5

In this commit, we introduce a comprehensive work flow for survey management, include commands to

- create a survey
- add a question to a survey
- add an option to a question
- add a follow up question for an option
- publish a survey

Deleting surveys, questions, and options is future-scoped.

## #3

In this commit, we introduce a domain model and work flow for building a tree-structured survey. Our current model allows for a
collection of "top-level" questions, each with 2 or more options. These options may point to additional follow-up questions which
will only be answered if a participant answers the previous question with a given option.

## #2

In this commit, we

- configure documentation for our internal REST API with Swagger
- introduce a dedicated `data-types` libary in which we support schema-based validation of data transfer objects, utility TypeScript types, and standardized error and exception handling for all libs and apps
- leverage the above in a first draft of a client-management service, including end-to-end and unit tests with Jest

## #1

In this commit, we have scaffolded the True Impact platform including

- NestJS Server \ REST API
- ReactJS Web Client
- Supertokens Auth Server
- PostgreSQL for the Auth DB
