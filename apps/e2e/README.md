# True Impact e2e
## Background
This is a set of automated browser tests for the True Impact platform. 

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
Currently, you must restart the platform with Docker between runs. This is because we have yet to implement a strategy
for database isolation between tests. 
