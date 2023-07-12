#!/usr/bin/env bash
rm -rf ./exec 
wait
mkdir ./exec/ 
wait 
cp ./.env.sample exec/.env 
wait 
docker-compose -f ./docker-compose-apps.yml --env-file ./exec/.env down -v --rmi all
wait
mkdir ./exec/data 
wait 
mkdir ./exec/data/aandb_builtin-ledger-grpc-svc 
mkdir ./exec/data/aandb_coa-grpc-svc 
mkdir ./exec/data/account-lookup-http-oracle-svc 
mkdir ./exec/data/account-lookup-svc 
mkdir ./exec/data/quoting-svc 
mkdir ./exec/data/fspiop-api-svc 
mkdir ./exec/data/participants-svc 
mkdir ./exec/data/settlements-api-svc 
mkdir ./exec/data/settlements-event-handler-svc 
mkdir ./exec/data/settlements-command-handler-svc
mkdir ./exec/data/transfers-api-svc 
mkdir ./exec/data/transfers-event-handler-svc 
mkdir ./exec/data/transfers-command-handler-svc 
mkdir ./exec/data/ttk1_data 
mkdir ./exec/data/ttk2_data 
mkdir ./exec/data/ttk1_ui_data 
mkdir ./exec/data/ttk2_ui_data
wait
docker-compose -f ./docker-compose-apps.yml --env-file ./exec/.env up -d 
wait 

