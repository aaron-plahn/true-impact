# True Impact

True Impact is an open-source platform for tracking an organization's impact on its clients and communities.

## Monorepo

This repository is structured as a monorepo using yarn workspaces. This provides the ability to share code (and dependencies) and interfaces between server and clients while avoiding the complexity of more full-featured monorepo solutions that solve scalability and large-scale dev-ops issues that we do not have.

This monorepo is broken down into `apps` and `libs`, the latter including code that can be shared across multiple apps.

### Apps

#### @true-impact/web-client

The [web-client](apps/web-client/README.md) is built with react.

### Libs

#### @true-impact/low-level-utilities

The [low-level-utilities](libs/low-level-utils/README.md) library contains reuseable utility functions and classes that we find ourselves rewriting in every project.
