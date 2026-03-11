# <next>

This first release of the True Impact platform introduces a working model for user management, client management, and survey creation and completion.

## #11

In this commit, we support flagging survey options. If a participant selects a particular option, the survey response will be marked with the inidcated flag.

## #10

In this commit, we introduce a workflow for managing flags. We will support attaching these to clients and surveys in a future commit.

## #9

In this commit, we introduce a workflow for survey analysis. This allows admin users to assign values per-category for each
survey option.

## #8

In this commit, we expose a REST API for the survey completion workflow. This allows a future client to drive this workflow
over the network.

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
