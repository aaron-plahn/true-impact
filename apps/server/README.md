# True Impact Server
The core server is written with `NodeJS` and uses `NestJS` for dependency injection and route configuration. We follow a Domain Driven Design approach, modelling our domain as a set of aggregate roots that represent both transactional boundaries for updates as well as logical units. This approach allows us to develop a shared model of the domain with our domain experts, including a ubiquitous language that allows us to iterate on requirements with our domain experts without losing requirements in traslation.

State updates are achieved through series of commands. For exmaple, the aggregate root `Survey` exposes a workflow `CREATE_SURVEY` -> `ADD_QUESTION_TO_SURVEY` -> `ADD_OPTION_TO_SURVEY` -> `PUBLISH_SURVEY` backed by a state-transition database. We have the option of storing state as an append only event ledger and maintaining denormalized views via a set of event consumers for entities when the benefits of this approach (e.g. auditability, performance of reads, novel analytics) is worth the additional effort.



<!-- TMI Put this in a separate doc -->
<!-- We typically expose a command-based interface for user updates to a given aggregate root. For exmaple, the aggregate root `Survey` exposes a workflow `CREATE_SURVEY` -> `ADD_QUESTION_TO_SURVEY` -> `ADD_OPTION_TO_SURVEY` -> `PUBLISH_SURVEY`. The benefits of this over a CRUD (Create Reade Update Delete) approach include:
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
5. When synchronizing views with event sourcing, updates to views are out-of-band with commands. Whereas a non-CQRS system can send back a full delta for a view(s) along with an acknowledgement that an update has succeeded, one must synchronize the client via an async mechanism such as web-sockets triggered in write-hooks on the query database or wrap all commands in a proxy that waits for the consumers and returns an update. However, updating other users of the updates of one user in a non-CQRS system requires such a mechanism and an additional mechanism for calculating deltas to views. -->


## Description

We use [Nest](https://github.com/nestjs/nest) as a back-end framework for dependency injection and declarative routing. Features are organized into vertical slices. At present, these comprise a modular monolith. However, we avoid database coupling in favor 
of injecting service layer communication between modules where relevant to ensure that we could break the modules out into network separated services in the future.

## Project setup

```bash
$ yarn install
```

## Compile and run the project

```bash
# development
$ yarn run start

# watch mode
$ yarn run start:dev

# production mode
$ yarn run start:prod
```

## Run tests
### e2e
Note that in the near future we'll support running back-end e2e tests directly against a docker container \ build. For now, you'll need to start the server in dev mode:
> > > export NODE_ENV=test
> > > yarn start
Be sure you are in `apps/server`. Note that `$NODE_ENV` must be set to "test" for test setup logic to work. If you miss this, you will see uniqueness constraint violations \ collisions in the DB. 

Then in a separate terminal, you can run
> > > yarn jest --run-in-band
Note that the `--run-in-band` flag will be required until we establish a strategy for databse isolation between tests.

Most tests of our back-end are e2e tests of common workflow scenarios. These are tests of the build and require a local copy of the auth server and database as there is no mocking. This approach allows for extreme flexibility to refactor as the project evolves. If the speed of these tests becomes an issue, we may introduce unit tests for domain logic independent of the transport layer.

Note that these back-end `e2e` tests are distinct from the system-wide [e2e tests of the UX](../e2e/README.md) with Webdriver.io.

### unit tests
We primarily use unit tests for isolated utility functions or class methods. We use full e2e tests for domain logic at this point (see above).

Our unit tests are written with native node tests (not Jest). To run these, run
> > > yarn run test

## Deployment
### builds
To build the back-end, run 
> > > yarn run build
Be sure to export the correct `$NODE_ENV` and populate your `.env` file. The build should appear in [dist](./dist/). You can deploy this to a VM or a container. A simple deployment uses [nginx](https://nginx.org/) as a reverse proxy on the same VM in front of the NodeJS process, encryping communication using [Let's Encrypt](https://letsencrypt.org/) and [Certbot](https://certbot.eff.org/) to secure traffic. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

## Structure
Our back-end consists of a modular monolith that is comprised of several feature modules that comprise vertical slices. That is, any feature module declares its own domain models, services,
controllers, views, and persistence. We avoid coupling distinct services at the database layer to ensure that we can deploy these feature modules independently in the future if need be. 

A typical feature will include one or more aggregate root domain models. Behaviours will be update methods on the corresponding class. The client executes a workflow of commands to drive a domain model through desired state transitions. Each step is validated against the transition logic specified in the update method and invariant validation rules, which include schema-based validation in-memory (no need to sync schemas with the database). 

In some cases we choose to persist the state as an append-only ledger of events and synchronize views with a set of event-consumers that eagerly write materialized views to a separate query database. In other cases, we use state-based persistence and project off domain state to build views. The choice depends on whether the added complexity of event sourcing is worth the benefits of auditability and query performance. For example, interactions with clients may be required to have an auditable history, whereas updating the visual theme of a survey template probably does not.

<!-- ## License -->
<!-- TODO Add this -->
