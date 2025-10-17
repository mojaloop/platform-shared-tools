# [DEPRECATED] Mojaloop vNext - Platform Shared Tools

---------------------------------------------------------------------------------------------------------------------------------------------------------
**Deprecation Notice**: This repo was deprecated as of October 2025. It is no longer maintained, and is no longer referenced by any releases of Mojaloop.

For a list of active Mojaloop repos, please refer to [Mojaloop documentation](https://docs.mojaloop.io) or [Mojaloop GitHub Org](https://github.com/mojaloop).

---------------------------------------------------------------------------------------------------------------------------------------------------------

**EXPERIMENTAL** vNext Platform Shared Tools Bounded Context Mono Repository

Platform-Shared-Tools is one of the repositories within the Mojaloop vNext ecosystem, designed to address various shared needs  beyond business functionalities and cross-cutting concerns such as common libraries, user interfaces, scripts, tooling and documentation.
This repository includes  includes includes other common tooling and documentation.


## Contents
- [platform-shared-tools](#mojaloop-vnext---platform-shared-tools)
  - [Contents](#contents)
  - [Packages](#packages--libraries-included)
  - [Deployment Tools](#deployment-tools)
  - [Pre-build Request and Tester Tools](#pre-built-requests-and-tester-tools)


## Packages
- [admin-ui](./packages/admin-ui/README.md) - vNext admin UI.
- [deployment](./packages/deployment/) - vNext Deployment Tools
- [documentation](./packages/documentation/) - additional documentation for vNext 
- [installer](./packages/installer/INSTALLER-README.md) - Installation utilities for deploying Mojaloop vNext
- [k8s-operator](./packages/k8s-operator/README.md) - Mojaloop vNext Kubernetes Operator
- [monitoring](./packages/monitoring/) - Monitoring utilities
- [postman](./packages/postman/) - Postman Collections 

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


