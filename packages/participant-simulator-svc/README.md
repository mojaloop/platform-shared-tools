# Mojaloop vNext - Participant Simulator Service

**EXPERIMENTAL** Participant Simulator Service for vNext automated load testing

This service will simulate a participant, responding default values to all requests and callbacks for the folowing use cases:
### Party lookup
- GET /parties//MSISDN/:partyId
  - Responds immediately with a 202
  - Records metrics for prometheus
  - Queues a PUT /parties/MSISDN/:partyId response request to the switch
- PUT /parties//MSISDN/:partyId
  - responds with a 202 and records timmings

### Quotes
- POST /quotes
- PUT /quotes/quoteId

### Transfers
- POST /transfers and PUT/PATCH /transfers/transferId

For the collection of metrics for prometheus, the following http headers are expected:
- tracing-request-start-timestamp - with the ms timestamp of the initial http request, i.e., external request that starts the first leg, ex: request transfer
- tracing-response-start-timestamp - with the ms timestamp of the continuation/response http request, i.e., external request that starts the second leg, ex: fulfil transfer

These can be configured via environment variables, see [below](#configuration-environment-variables).

# Prerequisites

## For running locally
* `node`, `npm` and (optionally) `nvm`  - Node.js version 20+  is required

## For running in a docker container
* `docker`

# Installing and Building

## Install Node version
More information on how to install NVM: https://github.com/nvm-sh/nvm

```bash
# both commands will use the version in the local .nvmrc file
nvm install
nvm use
```

## Install Dependencies
```bash
npm install
```

#### Build

```bash
npm run build
```


# Running the Service

## Configuration Environment Variables

- `MY_FSPID` - Identifier of the simulated FSP as registered in the switch (default: test1)
- `LISTEN_PORT` - Local TCP port where the simulator will be listing at, must match endpoint of the FSP registered in the switch (default: 10050)
- `FSPIOP_API_URL` - Full URL of the FSPIOP API of switch (default: http://fspiop.local:80)
- `LOG_LEVEL` - log level for the service. One of: `debug`, `info`, `warn`, `error` or `fatal` (default: debug)
- `TRACING_REQ_START_TS_HEADER_NANE` - header name for the initial external request timestamp, (default: tracing-request-start-timestamp)
- `TRACING_RESP_START_TS_HEADER_NANE` - header name for the continuation external response timestamp, (default: tracing-response-start-timestamp)

## Running locally
This step requires the [Installing and Building](#installing-and-building) step above.

```bash
# Note the env vars description above
MY_FSPID="test1" LISTEN_PORT=10050 FSPIOP_API_URL=http://fspiop.local:80 LOG_LEVEL=debug \
  node dist/index.js
```
Use Ctrl-C to terminate the service at any time.

## Running in docker

### Build the docker image

```bash
# Note the version tag at the end, should match the package.json version
docker build -f Dockerfile -t mojaloop/vnext-participant-simulator-svc:0.1.2 .
```

### Running the service

```bash
docker run --rm --name "sim_test1" -e MY_FSPID="test1" -e LISTEN_PORT=10050 \
  -e FSPIOP_API_URL="http://fspiop.local:80" -e LOG_LEVEL=debug \
  mojaloop/vnext-participant-simulator-svc:0.1.2
```


