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
cp ./ttk_files/spec_files/user_config_bluebank.json ./exec/data/ttk1_data/spec_files
cp ./ttk_files/spec_files/default.json ./exec/data/ttk1_data/spec_files/rules_callback
cp ./ttk_files/environment/hub_local_environment.json ./exec/data/ttk1_data/examples/environments
cp ./ttk_files/environment/dfsp_local_environment.json ./exec/data/ttk1_data/examples/environments
cp ./ttk_files/spec_files/user_config_greenbank.json ./exec/data/ttk2_data/spec_files
cp ./ttk_files/spec_files/default.json ./exec/data/ttk2_data/spec_files/rules_callback
cp ./ttk_files/environment/hub_local_environment.json ./exec/data/ttk2_data/examples/environments
cp ./ttk_files/environment/dfsp_local_environment.json ./exec/data/ttk2_data/examples/environments
wait