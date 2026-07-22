# <next>

This first release of the True Impact platform introduces a working model for user management, client management, and survey creation and completion.

## 53
In this PR, we remove an explicit port in the client origin when configuring CORS on port 443 (staging and production environments, for example).

## 52
In this PR, we add a more robust approach to configuring the web client. The new approach allows us to swap out the configuration (e.g. API endpoints) without
running a new build.

## 50
In this PR, we automate deployments to a staging environment. 

## 49
In this PR, we run circular dependency checks in the CI. 

## 42
In this PR, we configure dependabot to automatically open requests to update dependencies when patches become available.

## 41
In this PR, we include several security scans in the CI pipeline.

## 40
In this PR, we run the UI e2e tests in the CI as a gate that prevents moving from `integration` to `staging`.

## 39
In this PR, we build the admin web-client in the CI step and publish the artifacts. Note that for the web-client, lint is part of the build. Also note that this is redundant with the Docker Compose build that is used for e2e tests. When automating deployments, we will address which build is the source of truth.

## 38
In this PR, we introduce a Continuous Integration (software quality) pipeline. The CI step runs
- server
    - lint
    - build
    - unit test
    - server e2e test (tests the build artifact)
- client
    - lint
    - build (via Docker Compose)

### Future Scoped
We do not yet run the UI e2e (WebDriver.io) tests. We will gate `staging` with these as they will soon become to slow to gate `integration` for rapid iteration.

We do not automate deployments in this PR.

## 37
In this PR, we support the group program observation work flow on the server. This allows facilitators to record observations of a group program session by type or by notes which can later be classified by type. This is crucial for qualitative analysis of programs.

## 36
In this PR, we introduce the ability to schedule a group program session.

## 35
In this PR, we enable strict allow-list property validation when validating data against schemas. This
ensures that no unknown properties can be injected on user requests, for example. We also reinstate the scenario test for completing a survey as a client.

## 32
In this PR, we introduce group programs, including a command to create a group program. Eventually, we will support specifying a group program as the subject of a survey.

## 33
This PR is a refactor that changes the way the server and client interact without changing the overall behaviour. With this PR, the
entire survey completion workflow has been secured.

## 31
Securing anonymous survey responses proved sufficiently novel to make using our originally intended drop-in auth solution (Supertokens)
a fight against the platform. As such, we have implemented our own auth solution. In this PR, we remove the Supertokens container as well
as its required PostgreSQL container from the Docker build and remove all (now unused) remenants of Supertokens from the server and web-client.

## 30
In this commit, we add role based access control (RBAC) to all command and query endpoints. We
introduce several server integration test utilities to deal with tracking auth state in the test
http client and seeding test users. Securing the web sockets (real-time update channels) is future-scoped.

## 29
In this commit, we introduce a user management work flow and sessions for authenticated system users.

## 28
This commit reorganizes core project dependencies.

## 26
In this commit, we introduce one-time access codes for anonymous survey completion.

## 25
In this commit, we update the project documentation, introducing separate README.md files for each component of the system.

## 24
In this commit, we add automated UI tests of the survey completion workflow.

## 23
In this commit, we introduce an independent web client for survey completion. At first pass, this client supports anonymous
completion of open surveys. In the future, pass codes will be used to allow one-time completion or non-anonymous surveys.

## 22
In this commit, we updated the CHANGELOG to reflect the previous several commits. We will aim to 
update the CHANGELOG with every commit going forward.

## 20
In this commit, we introduce an admin UX for building flat surveys.

## 19
In this commit, we implement an e2e (automated browser) testing framework with webdriver.io and use this to test the login workflow.

## 18
In this commit, we introduce a navbar and login functionality for the web client.

## 17
In this commit, we expose command schemas in our API documentation.

## #16

In this commit, we introduce a workflow for reviewing a survey submission and provide support for this via the API.

## #15

In this commit, we support linking communities to a client. This can be done when creating the client or after the fact, in case
the client's community affiliation is initially unknown.

## #14

In this commit, we support applying flags directly to a client.

## #13

In this commit, we provide an API for community management.

## #12

In this commit, we introduce a model for communities. This includes the ability to translate a community's
name into the Indigenous language. This sets the stage for attaching clients to communities.

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
