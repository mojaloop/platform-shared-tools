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
* settlements-api-svc
* settlements-event-handler-svc
* settlements-command-handler-svc
* ttk1_data
* ttk2_data
* ttk1_ui_data
* ttk2_ui_data
* interop_keys

```shell
mkdir {data/aandb_builtin-ledger-grpc-svc,data/aandb_coa-grpc-svc,data/fspiop-api-svc,\
data/account-lookup-svc,data/account-lookup-http-oracle-svc,data/participants-svc,\
data/quoting-svc,data/transfers-api-svc,data/transfers-event-handler-svc,\
data/transfers-command-handler-svc,data/settlements-api-svc,data/settlements-event-handler-svc,\
data/settlements-command-handler-svc,data/ttk1_data,data/ttk2_data,data/ttk1_ui_data,data/ttk2_ui_data,interop_keys}
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


# Running the TTK Tests

If you wish to run the list of testing-toolkit-test-cases (https://github.com/mojaloop/testing-toolkit-test-cases) there are a few steps required for them to be ran sucessfully (please note that the following values are based on the default bootstrap of the same docker-compose containers present in this repository). Repeat the same process for the greenbank whenever a process is shown for the bluebank.

**Note:** At the moment, only the negative scenario tests are confirmed to be successfully passing after following these steps. 


### Testing Toolkit Interface
- Change the default/current values on the following field of the Environment Manager of the TTK you're running your tests on

  ![ttk_enrivonment](https://github.com/mojaloop/testing-toolkit-test-cases/assets/38566292/b0e9e822-af8c-4651-bb45-a51b7bc82454)

### Participants
- Create the participants mentioned in the previous point (default: bluebank & greenbank) and **don't forget** to add their corresponding endpoints (e.g., http://host.docker.internal:4040 for the **bluebank** and http://host.docker.internal:4041 for the **greenbank**) otherwise, communication between them won't be possible. Approve them with a different user than the one logged in due to maker check restrictions.
   
   ![ttk_create_participant](https://github.com/mojaloop/testing-toolkit-test-cases/assets/38566292/4a15eabd-9e8c-4bac-b49a-7b3f10a516e1)

### Account-Lookup

- Create at least an oracle of a party type **MSISDN** (builtin or remote) so that we can later create the associations with it for the corresponding parties and participants. Afterwards, create the required associations of parties belonging to a participant using the following matches:
   - bluebank -> 27713803912 
   - greenbank -> 22507008181 

  ![ttk_party_association](https://github.com/mojaloop/testing-toolkit-test-cases/assets/38566292/e8a86497-cc3f-4112-9501-de1006be2738)

### Transfers
- Make sure that the participants in question have enough available funds for the tests to run sucessfully, similar to the following deposit examples.

  ![ttk_transfer_funds](https://github.com/mojaloop/testing-toolkit-test-cases/assets/38566292/30cc313d-8de2-4d37-90e5-c2bb4df44331)
