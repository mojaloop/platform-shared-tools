# Platform Tools - Docker Compose for Business Application Services

**Note:** Make sure all infrastructure containers and cross-cutting are running, see docker-compose-infra and
docker-compose-cross-cutting directories. 

TODO: complete this documentation

1. Create a directory called `exec` inside the `docker-compose-apps` (this) directory, and go to that
   directory.

_This `exec` directory is ignored by gitignore, so can't be pushed to GitHub._

```shell
mkdir exec 
cd exec
```

2. Create the following directories as children of the `docker-compose-apps/exec` directory:

* `data`

```shell
mkdir {data}
```

3. Create the following directories as children of the newly created `data` directory:

* aandb_builtin-ledger-grpc-svc
* aandb_coa-grpc-svc
* account-lookup-http-oracle-svc
* account-lookup-svc
* quoting-svc
* fspiop-api-svc
* participants-svc
* transfers-api-svc
* transfers-event-handler-svc
* transfers-command-handler-svc
* ttk1_ui_data
* ttk2_ui_data

```shell
mkdir {data/aandb_builtin-ledger-grpc-svc,data/aandb_coa-grpc-svc,data/fspiop-api-svc,\
data/account-lookup-svc,data/account-lookup-http-oracle-svc,data/participants-svc,\
data/quoting-svc,data/transfers-api-svc,data/transfers-event-handler-svc,\
data/transfers-command-handler-svc,data/ttk1_ui_data,data/ttk2_ui_data}
```

Note: For Mac users you might have to grant full access to these directories, to do that execute in the exec directory:
```shell
sudo chmod -R 777 data
```

4. Copy the `.env.sample` to the exec dir:

```shell
cp ../.env.sample ./.env
```

5. Review the contents of the `.env` file. **If using MacOS or Windows update the ROOT_VOLUME_DEVICE_PATH to reflect the absolute
   path**

# Start Business Apps Service Containers

Start the docker containers using docker-compose up (in the exec dir)

```shell
docker-compose -f ../docker-compose-apps.yml --env-file ./.env up -d
```

To view the logs of the business apps containers, run:

```shell
docker-compose -f ../docker-compose-apps.yml --env-file ./.env logs -f
```

To stop the business apps containers, run:

```shell
docker-compose -f ../docker-compose-apps.yml --env-file ./.env stop
```

