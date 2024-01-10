#!/usr/bin/env bash
rm -rf ./exec
wait
mkdir ./exec/
cp ./.env.sample exec/.env
docker-compose -f ./docker-compose-infra.yml --env-file ./exec/.env down -v --rmi all
wait
mkdir ./exec/certs ./exec/esdata01 ./exec/kibanadata ./exec/logs ./exec/tigerbeetle_data ./exec/mongodb_data ./exec/prometheus_etc ./exec/prometheus_data ./exec/grafana_data
docker-compose -f ./docker-compose-infra.yml --env-file ./exec/.env up -d
wait

