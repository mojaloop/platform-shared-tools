#!/usr/bin/env bash
docker-compose -f ./docker-compose-infra.yml --env-file ./exec/.env logs -f
