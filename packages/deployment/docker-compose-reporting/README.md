# Platform Tools - Docker Compose for Reporting Services

**Note:** Make sure all infrastructure , cross-cutting and application containers are running, see docker-compose-infra , 
docker-compose-cross-cutting and docker-compose-apps directories. 


1. Create a directory called `exec` inside the `docker-compose-reporting` (this) directory, and go to that
   directory.

_This `exec` directory is ignored by gitignore, so can't be pushed to GitHub._

```shell
mkdir exec 
cd exec
```

2. Copy the `.env.sample` to the exec dir:

```shell
cp ../.env.sample ./.env
```

3. Review the contents of the `.env` file. **If using MacOS or Windows update the ROOT_VOLUME_DEVICE_PATH to reflect the absolute
   path**

# Start Reporting Service Containers

Start the docker containers using docker-compose up (in the exec dir)

```shell
docker compose -f ../docker-compose-reporting.yml --env-file ./.env up -d
# OR for older versions of docker
docker-compose -f ../docker-compose-reporting.yml --env-file ./.env up -d
```


## Other scripts and commands
To view the logs of the reporting containers, run:

```shell
docker compose -f ../docker-compose-reporting.yml --env-file ./.env logs -f
# OR for older versions of docker
docker-compose -f ../docker-compose-reporting.yml --env-file ./.env logs -f
```

To stop the reporting containers, run:

```shell
docker compose -f ../docker-compose-reporting.yml --env-file ./.env stop
# OR for older versions of docker
docker-compose -f ../docker-compose-reporting.yml --env-file ./.env stop
```