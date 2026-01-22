# True Impact

True Impact is an open-source platform for tracking an organization's impact on its clients and communities.

## Getting Started

### 1. Clone this repo

> > > git clone git@github.com:aaron-plahn/true-impact.git
> > > cd true-impact

### 2. Populate your `.env`

Run:

> > > cp sample.env env.local

Then replace the placeholders with your own environment variables. You will need to [generate a Supertoken API key](https://supertokens.com/docs/platform-configuration/supertokens-core/api-keys).

### 3. Run Locally with Docker

After you [install Docker on your machine]() you can run the application locally in Docker containers by running:

> > > docker compose up --build

Note that this will create a persistant volume for the PostgreSQL data.

See the [Docker compose file](docker-compose.yaml) for more details.

### 4. Run Locally for development

Docker provides a slower feedback loop. You can also run the server and\or web-client locally, starting them in watch mode. To do this, you'll need to install the npm dependencies locally.

This project uses node `24.13.0`. You should install this using [nvm](https://github.com/nvm-sh/nvm) as follows.

> > > nvm install 24.13.0
> > > nvm use 24.13.0

[Yarn](https://yarnpkg.com/) is the recommended package manager. You can install it with:

> > > npm i -g yarn

Once you have node and yarn, you can install the dependencies as follows.

> > > yarn install --frozen-lock-file

Once you have done this, you should be able to run the server or web-client locally using the scripts in the relevant package.json.

## Monorepo

This repository is structured as a monorepo using yarn workspaces. This provides the ability to share code (and dependencies) and interfaces between server and clients while avoiding the complexity of more full-featured monorepo solutions that solve scalability and large-scale dev-ops issues that we do not have.

This monorepo is broken down into `apps` and `libs`, the latter including code that can be shared across multiple apps.

### Apps

#### @true-impact/server

The [server](apps/web-client/README.md) is built with [NestJS](https://nestjs.com/) and exposes a REST API.

#### @true-impact/web-client

The [web-client](apps/web-client/README.md) is built with [React](https://react.dev/).

### Libs

#### @true-impact/low-level-utilities

The [low-level-utilities](libs/low-level-utils/README.md) library contains reuseable utility functions and classes that we find ourselves rewriting in every project.
