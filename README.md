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

### 3. Run Locally with Docker

After you [install Docker on your machine]() you can run the application locally in Docker containers by running:
```bash
docker compose --env-file env.local up --build
```


See the [Docker compose file](docker-compose.yaml) for more details.

## Components

### External
#### Additional Databases
In the current stage of development, we have implemented in-memory databases that are abstracted behind repository interfaces persisting domain models (writes) and view models (reads). In the future, we will include one or more databases as part of the Docker build.

### Apps

#### Server
See the [back-end docs](./apps/server/README.md).

#### Clients

##### Survey Completion Web Client
We have introduced a novel client for survey completion, distinct from our main admin web client. This is because participants will often be anonymous or at least known clients who do not have system accounts. The survey client uses a "Server Driven UI" (SDUI) approach.

SDUI opens a path towards easier sharing of logic with native mobile (iOS and Android app) clients, which are a good fit for survey completion. As such, and given the small scope of the survey completion flow, we decided to leverage a custom, small-scale SDUI framework for this work flow.

At present, we intercept the `SDUI` response and generate `html` on the server using SSR inside our back-end query controllers. However, we may move this logic client side in the near future to ensure a consistent approach with future mobile clients.


##### Web Admin Panel

Read more about this component of the system [here](./apps/web-client/README.md).

##### UI end-to-end tests
 See [here](./apps/e2e/README.md) for more information.