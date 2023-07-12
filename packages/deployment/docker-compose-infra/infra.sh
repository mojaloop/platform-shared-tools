#!/usr/bin/env bash
rm -rf ./exec
wait
mkdir ./exec/
cp ./.env.sample exec/.env
docker-compose -f ./docker-compose-infra.yml --env-file ./exec/.env down -v --rmi all
wait
mkdir ./exec/certs ./exec/esdata01 ./exec/kibanadata ./exec/logs ./exec/tigerbeetle_data ./exec/mongodb_data
#docker run -v $(pwd)/tigerbeetle_data:/data ghcr.io/tigerbeetledb/tigerbeetle format --cluster=0 --replica=0 --replica-count=1 /data/0_0.tigerbeetle
docker-compose -f ./docker-compose-infra.yml --env-file ./exec/.env up -d
wait 

