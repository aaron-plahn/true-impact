# True Impact

True Impact is an open-source platform for tracking an organization's impact on its clients and communities. The initial focus is to support client and program evaluation via a robust survey module.

## Getting Started

This repo contains several independent projects each with their own separate build processes. We may eventually move to using true monorepo tooling. You can spin up the platform locally using Docker.

### 1. Clone this repo
``` bash
git clone git@github.com:aaron-plahn/true-impact.git

cd true-impact
```



### 2. Populate your `.env`

Run:
```bash
cp sample.env env.local
```

Then replace the placeholders with your own environment variables. You will need to [generate a Supertoken API key](https://supertokens.com/docs/platform-configuration/supertokens-core/api-keys).

### 3. Run Locally with Docker

After you [install Docker on your machine]() you can run the application locally in Docker containers by running:
```bash
docker compose --env-file env.local up --build
```

Note that this will create a persistant volume for the PostgreSQL data.

See the [Docker compose file](docker-compose.yaml) for more details.

## Components

### External
#### Supertokens
We currently user [Supertokens IO](https://supertokens.com/) as our auth server. Supertokens is self-hostable and available as a Docker image. Our [Docker build](./docker-compose.yaml) includes Supertokens.

#### PostgreSQL
Currently, we use [PostgreSQL](https://www.postgresql.org/) for the auth database. It is a dependency of Supertokens. We may end up using Postgres for persistence for state and \ or views. This decision has not yet been made. See below for more info.

#### Additional Databases
In the current stage of development, we have implemented in-memory databases that are abstracted behind repository interfaces persisting domain models (writes) and view models (reads). We may implement persistence for these with Postgres or a different database. In the latter case, we will include the additional database(s) as part of the Docker build.

### Apps

#### Server
See the [back-end docs](./apps/server/README.md).

#### Clients

##### Survey Completion Web Client
We have introduced a novel client for survey completion, distinct from our main admin web client. This is because participants will often be anonymous or at least known clients who do not have system accounts. The survey client uses a "Server Driven UI" (SDUI) approach.

SDUI opens a path towards easier sharing of logic with native mobile (iOS and Android app) clients, which are a good fit for survey completion. As such, and given the small scope of the survey completion flow, we decided to leverage a custom, small-scale SDUI framework for this work flow.

At present, we intercept the `SDUI` response and generate `html` on the server using SSR inside our back-end query controllers. However, we may move this logic client side in the near future to ensure a consistent approach with future mobile clients.


#### Web Admin Panel

The core UX is intended for the tenant's employees and administrators. This UX allows users to build new surveys, open surveys for completion by clients, general public, or via a one-time link, review survey responses, and create and view reports based on survey results. 

We considered leveraging a `Server Driven UI` for our core web client, but decided for speed to go with known tools (React + Redux Toolkit). Read more about this component of the system [here](./apps/admin-panel-web/README.md).

#### UI end-to-end tests
We use [WebDriver.io](https://webdriver.io/) for automated UI tests of the entire system. We maintain these e2e tests as a separate project with its own dependencies as we want to ensure our e2e tests are completely independent of our implementation. See [here](./apps/e2e/README.md) for more information.