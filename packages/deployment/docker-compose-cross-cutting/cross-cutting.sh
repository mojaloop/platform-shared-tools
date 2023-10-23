#!/usr/bin/env bash
rm -rf ./exec
wait
mkdir ./exec/
cp ./.env.sample exec/.env
docker-compose -f ./docker-compose-cross-cutting.yml --env-file ./exec/.env down -v --rmi all
wait
mkdir ./exec/data
mkdir ./exec/data/authentication-svc ./exec/data/authorization-svc ./exec/data/platform-configuration-svc ./exec/data/auditing-svc ./exec/data/logging-svc
docker-compose -f ./docker-compose-cross-cutting.yml --env-file ./exec/.env up -d
wait 

