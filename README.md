![Node.js CI](https://github.com/MSFTserver/print2a-api/workflows/Node.js%20CI/badge.svg)

# Print2a Filesystem API

## Overview

This is a REST API and Displays directories on the fileystem.

## Quickstart

`npm install && npm run start`

### Implementation

This is a ECMAScript 2015+ implementation using node 12+ with the relatively [recent Node support ESM `import` syntax](https://nodejs.org/api/esm.html).

We use a classic Express routing pattern with query string parameters and typical REST HTTP verbs.

There is no database; persistence is managed with the filesystem using async Node `fs` operations.

## Docker management

We use docker to package the container, with a minimalist [Dockerfile](Dockerfile).

- Build: `docker build -t <repository>/<image_name> .`
- Run: `docker run -p 49160:8080 -d <repository>/<image_name>`
- View processes: `docker ps`
- Cleanup containers: `docker kill $(docker ps -q)`

### Local development

Install dependencies: `npm install`

Run with livereloading using nodemon: `npm start` which uses [nodemon](https://www.npmjs.com/package/nodemon) for livereloading.

Management scripts are defined in [package.json](package.json).

### Testing

The [test suite](test/app.test.js) is managed with Mocha using a BDD sytax.

The existing tests are a good representation of feature coverage provided by the API.

### Swagger API documentation

Each API endpoint is fully documented with inline JSDoc comments (in [src/server.js]) and a we use [Swagger UI Express](https://www.npmjs.com/package/swagger-ui-express) to build a Swagger spec and render a [Swagger UI](http://0.0.0.0:8080/api-docs/) at `/api-docs`.
