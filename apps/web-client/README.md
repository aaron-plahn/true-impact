# @true-impact/admin-panel-web

## About

This is the web client for the admin panel of the True Impact platform. It is built with React and communicates with the NestJS back-end via an RPC style API over http (I'm intentionally avoiding calling it a REST API, because it's not).

Note that a distinct client is provided for survey completion. This is because the survey completion flow is anonymous or semi-anonymous and needs to be sandboxed for security. Also, there are requirements to eventually support a mobile client for survey completion while no such requirements exist for the admin dashboard.

## Workflow

### Running the App Locally
Currently, the best way to run the app is to use Docker to start the entire platform as in the [project README](../../README.md). In the future, we will make it possible to run the admin-panel locally with yarn for a better developer experience (faster feedback loop).

### Tests
Currently, we do not have unit tests for this web client, as we opt to use e2e (automated browser tests with WebDriver.io) tests. See [e2e](../e2e/README.md) for more info. We don't require unit tests of client utilities because we leave all calculations and denormalization up to the server's query layer.

### Building the App
> > > yarn run build

Builds the app for production to the `build` folder. The build can be deployed to a standard web server (E.g., [nginx](https://nginx.org/) or [apache](https://httpd.apache.org/) or via any other means of serving static content. Note that client-side routing requires configuration to fall back to the index to avoid client-side routes being handled by the server.

