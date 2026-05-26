# True Impact e2e
## Background

We use [WebDriver.io](https://webdriver.io/) for automated UI tests of the entire system. We maintain these e2e tests as a separate project with its own dependencies as we want to ensure our e2e tests are completely independent of our implementation.

Note that these tests are distinct from the "e2e" tests we refer to in the context of the server in isolation. This is because the client-server boundary is a trust boundary. Therefore, it is important to test security and validation features at the boundary of the server itself independently of the client. For example, a broken implementation of the client could hide forms when the user context does not have the role `admin`, while leaving the API endpoint for the form unguarded. The distinction is opaque when driving the client through the browser.

## Installation
Clone the repo
> > > git clone https://github.com/aaron-plahn/true-impact

Install the dependencies
> > > cd apps/e2e
> > > yarn install --frozen-lock-file

## Getting started
Start the platform using Docker, as in the [project README](../../README.md). To run the tests,
> > > yarn run wdio

### Running one test
> > > yarn run wdio --spec {path-to-your-spec}

### Known Issues
Currently, you must restart the platform with Docker between runs. This is because we have yet to implement a strategy for database isolation between tests. 
