# True Impact

True Impact is an open-source platform for tracking an organization's impact on its clients and communities. The initial
focus is to support client and program evaluation via a robust survey module.

## Getting Started

This repo contains several independent projects each with their own separate build processes. We may eventually move
to using true monorepo tooling. You can spin up the platform locally using Docker.

### 1. Clone this repo

> > > git clone git@github.com:aaron-plahn/true-impact.git
> > > cd true-impact

### 2. Populate your `.env`

Run:

> > > cp sample.env env.local

Then replace the placeholders with your own environment variables. You will need to [generate a Supertoken API key](https://supertokens.com/docs/platform-configuration/supertokens-core/api-keys).

### 3. Run Locally with Docker

After you [install Docker on your machine]() you can run the application locally in Docker containers by running:

> > > docker compose --env-file env.local up --build

Note that this will create a persistant volume for the PostgreSQL data.

See the [Docker compose file](docker-compose.yaml) for more details.

### 4. Run Locally for development
<!-- TODO Run Local Supertokens Server -->

Docker provides a slower feedback loop. You can also run the server and\or web-client locally, starting them in watch mode. To do this, you'll need to install the npm dependencies locally.

This project uses node `24.13.0`. You should install this using [nvm](https://github.com/nvm-sh/nvm) as follows.

> > > nvm install 24.13.0
> > > nvm use 24.13.0

[Yarn](https://yarnpkg.com/) is the recommended package manager. You can install it with:

> > > npm i -g yarn

Once you have node and yarn, you can install the dependencies as follows.

> > > yarn install --frozen-lock-file

Once you have done this, you should be able to run the server or web-client locally using the scripts in the relevant package.json.

## Components

### Apps

#### Server
The core server is written with `NodeJS` and uses `NestJS` for dependency injection and route configuration. We follow a Domain Driven Design approach, modelling our domain as a set of aggregate roots that represent both transactional boundaries for updates as well as logical units. We aim to develop a "ubiquitous language" with our domain experts as reflected in naming entities and methods. 

We typically expose a command-based interface for user updates to a given aggregate root. For exmaple, the aggregate root `Survey` exposes a workflow `CREATE_SURVEY` -> `ADD_QUESTION_TO_SURVEY` -> `ADD_OPTION_TO_SURVEY` -> `PUBLISH_SURVEY`. The benefits of this over a CRUD (Create Reade Update Delete) approach include:
1. Reducing the complexity of possible paths to any given state
2. Providing more intentionality in user updates
3. The ability to validate state transitions in a specific way
4. The ability to expose a sequential workflow to the user that is designed to match the actual processes they use in their domain
5. The option of persisting state as an append-only event ledger via a state-transition database
6. The ability to synchronize materialized views and clients using these events as with no need for complexing diffing algorithms,
complex client-side cache invalidation, or 
7. A natural mechanism for optimistic concurrency
8. A perfect cache for materialized views
9. The ability to horizontally scale reads independent of writes

The costs of this approach include
1. Work must be done to expose novel commands, whereas CRUD allows arbitrary updates subject to simple validation constraints
2. To leverage the benefits of event sourcing views, one must maintain a set of event consumers
3. When synchronizing views via an event queue, the resulting views are eventually consistent. Transactional consistency requires projecting off the domain (event history), which can be slow as ad-hoc joins are difficult to implement efficiently in event sourced systems.
4. Experience working with DDD \ CQRS-ES is crucial. Many lessons are learned the hard way and this is not an appropriate approach for a team with novice developers. Onboarding will be slow.
5. When synchronizing views with event sourcing, updates to views are out-of-band with commands. Whereas a non-CQRS system can send back a full delta for a view(s) along with an acknowledgement that an update has succeeded, one must synchronize the client via an async mechanism such as web-sockets triggered in write-hooks on the query database or wrap all commands in a proxy that waits for the consumers and returns an update. However, updating other users of the updates of one user in a non-CQRS system requires such a mechanism and an additional mechanism for calculating deltas to views.

##### Survey Completion Web Client
We have introduced a novel client for survey completion, distinct from our main admin web client. This is because participants will often be anonymous or at least known clients who do not have system accounts. We decided against a workflow where an employee signs in and switches to a client context because of the risk of leaking other data. 

We considered leveraging a `Server Driven UI` for all clients, but decided for speed to go with known tools (React + Redux Toolkit) for our core web client. SDUI opens a path towards easier sharing of logic with native mobile (iOS and Android app) clients, which are a good fit for survey completion. As such, and given the small scope of the survey completion flow, we decided to leverage a custom, small-scale SDUI framework for this work flow.



##### Server Libs
We anticipate breaking out several libs either using a monorepo or as independent npm packages. Note that our philosophy around
internal libraries is to support only our own use cases and not to generalize to broad community needs. We often take inspiration
from existing libraries but write barebone implementations that we fully own and understand. This lessons software supply chain
pain and increases the maintainability of our systems. 

#### Web Client
