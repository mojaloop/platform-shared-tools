# Mojaloop vNext Implementation Documentation

# NOTE This is a work in progress document

## What it is
Mojaloop vNext is next generation Mojaloop platform, implemented from the ground up to be secure,
scalable, cost-efficient to run and extensible.

The implementation is guided by the agreed [Reference Architecture](https://mojaloop.github.io/reference-architecture-doc/)
and the learnings from the Performance and Scalability PoC
([report](https://docs.google.com/document/d/1fWSh1zu-I_BC8ki7gfDiNrz9sJiSMpiKG-xo0Kc56HQ/edit#heading=h.lnt20jsfjvz6) and [repo](https://github.com/mojaloop/poc-architecture)).

## Design principles

###### TODO:
DDD, SOLID, Event driven, strict Microservices etc

Reference architecture design principles can be found [here](https://mojaloop.github.io/reference-architecture-doc/introduction/#principles-guiding-this-architecture).

## Main Components

Mojaloop vNext's is composed of multiple services and libraries, these are arranged in cohesive groups called Bounded Contexts (BC's),
as per DDD definition. Each BC has its own GitHub repository where all its code is kept together.

### There are two main types of BCs:
- Business BCs
- Cross-cutting concerns BCs

Business BCs, group implementations of the main business features and use cases, such as transfers or participant lifecycle management.

Cross-cutting concerns BCs group transversal features that are required by the switch in multiple other BCs, such as security or logging.

### Mojaloop vNext Bounded-Contexts:
- Business BCs:
	- **Participant Lifecycle Management** - [participants-bc](https://github.com/mojaloop/participants-bc)
	- **Account Lookup and Discovery** - [account-lookup-bc](https://github.com/mojaloop/account-lookup-bc)
    - **Quoting** (also known as agreements) - [quoting-bc](https://github.com/mojaloop/quoting-bc/)
    - **Transfers** - [transfers-bc](https://github.com/mojaloop/transfers-bc)
    - **Accounts and Balances** - [accounts-and-balances-bc](https://github.com/mojaloop/accounts-and-balances-bc)
    - **Settlements** - [settlements-bc](https://github.com/mojaloop/settlements-bc)
- Cross-cutting concerns BCs:
  - **Security** - [security-bc](https://github.com/mojaloop/security-bc)
  - **Logging** - [logging-bc](https://github.com/mojaloop/logging-bc)
  - **Auditing** - auditing-bc
  - **Platform Configuration** - platform-configuration-bc
  - **Certificate Management** - [certificate-management-bc](https://github.com/mojaloop/cert-management-bc)

Besides the business and cross-cutting concerns bounded contexts, Mojaloop vNext has other repositories to keep other general items, such as common libraries, user interfaces, scripts, tooling and documentation.

- **Platform Shared Libraries**, includes other common platform libs that don't fit in any BC - platform-shared-tools
- **Platform Shared Tools**, includes other common tooling and documentation (ex: dev deployment scripts) - platform-shared-tools

## Per Bounded Context Monorepo
### monorepo structure
Topics
- npm workspaces
- package naming convention

### monorepo scripts
#### npm, install, build, lint, tests, code styles, clean
### testing strategy
### CI/CI Pipelines

## Service Package Reference
- service structure
- scripts
- usage of auditing, logging, security and platform-config
- testing
- docker build

## Library Package Reference

## How to prepare local development environment
Topics
- nvm
- per OS specifics (linux, macos, windows)
- installing librdkafka to reduce npm install times
-
