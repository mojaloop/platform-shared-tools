# Mojaloop vNext - Platform Shared Tools

**EXPERIMENTAL** vNext Platform Shared Lib Bounded Context Mono Repository


## Deployment Tools

### Docker-compose files for local infrastructure
[Here](packages/deployment/docker-compose-infra/README.md) you can find the instructions to bring up and down all required infrastructure components using docker-compose commands. This works in a local or remote machine.

Includes:
* Kafka and a kafka web console
* ElasticSearch and Kibana web console
* MongoDB and a MongoDB web console


### Docker-compose files for Cross-cutting Concerns
[Here](packages/deployment/docker-compose-cross-cutting/README.md) you can find the instructions to bring up and down all vNext Cross-Cutting concerns using docker-compose commands. This works in a local or remote machine.

Includes:
* Security - Authentication Service
* Security - Authorization Service
* Platform Configuration Service
* Logging Service (sinks to ElasticSearch) - WIP
* Auditing Service (sinks to ElasticSearch) - WIP


## Pre built requests and tester tools

### Postman collection 
[Here](packages/postman) you can find a complete Postman collection, in a json file, ready to be imported to Postman.


