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
* ttk1_data
* ttk2_data
* ttk1_ui_data
* ttk2_ui_data

```shell
mkdir {data/aandb_builtin-ledger-grpc-svc,data/aandb_coa-grpc-svc,data/fspiop-api-svc,\
data/account-lookup-svc,data/account-lookup-http-oracle-svc,data/participants-svc,\
data/quoting-svc,data/transfers-api-svc,data/transfers-event-handler-svc,\
data/transfers-command-handler-svc,data/settlements-api-svc,data/settlements-event-handler-svc,\
data/settlements-command-handler-svc,data/ttk1_data,data/ttk2_data,data/ttk1_ui_data,data/ttk2_ui_data}
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
docker compose -f ../docker-compose-apps.yml --env-file ./.env up -d
# OR for older versions of docker
docker-compose -f ../docker-compose-apps.yml --env-file ./.env up -d
```

# Configure the Testing Toolkits

### TTK 1 - Blue Bank
Go to the TTK 1 settings page here: http://localhost:6060/admin/settings and change the following settings:
- Callback URL: http://fspiop-api-svc:4000
- FSP ID: bluebank

Click the Save button

### TTK 2 - Green Bank

Go to the TTK 2 settings page here: http://localhost:6061/admin/settings and change the following settings:

- Callback URL: http://fspiop-api-svc:4000
- FSP ID: greenbank

Click the Save button

### TTK2 UI 

In the file located at exec/data/ttk2_ui_data/static/main.*.chunk.css, add the following text to the end and save:

```css
.ant-layout-header {
    background-color: green !important;
}
```

# Login to the Mojaloop vNext Admin UI
Your Mojaloop vNext development environment is now ready, and you can login to the Admin UI here: http://localhost:4200/login

The default development users and passwords are:
- user - superPass
- admin - superMegaPass

## Other scripts and commands
To view the logs of the business apps containers, run:

```shell
docker compose -f ../docker-compose-apps.yml --env-file ./.env logs -f
# OR for older versions of docker
docker-compose -f ../docker-compose-apps.yml --env-file ./.env logs -f
```

To stop the business apps containers, run:

```shell
docker compose -f ../docker-compose-apps.yml --env-file ./.env stop
# OR for older versions of docker
docker-compose -f ../docker-compose-apps.yml --env-file ./.env stop
```

