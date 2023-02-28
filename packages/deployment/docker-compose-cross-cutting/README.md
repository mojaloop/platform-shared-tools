# Platform Tools - Docker Compose for Cross-Cutting Concerns Services

**Note:** Make sure all infrastructure containers are running, see docker-compose-infra directory. 


To startup Kafka, MongoDB, Elasticsearch and Kibana, follow the steps below:

1. Create a directory called `exec` inside the `docker-compose-cross-cutting` (this) directory, and go to that directory.

_This `exec` directory is ignored by gitignore, so can't be pushed to GitHub._

```shell
mkdir exec 
cd exec
```

2. Create the following directories as children of the `docker-compose-cross-cutting/exec` directory:
* `data`

```shell
mkdir {data}
```


3. Create the following directories as children of the newly created `data` directory:

* authentication-svc
* authorization-svc
* platform-configuration-svc
* auditing-svc
* logging-svc

```shell
mkdir {data/authentication-svc,data/authorization-svc,data/platform-configuration-svc,data/auditing-svc,data/logging-svc}
```

Note: For Mac users you might have to grant full access to these directories, to do that execute in the exec directory:
```shell
sudo chmod -R 777 data
```

4. Copy the `.env.sample` to the exec dir:
```shell
cp ../.env.sample ./.env
```

5. Review the contents of the `.env` file. **If using MacOS update the ROOT_VOLUME_DEVICE_PATH to reflect the absolute path**



# Start Cross-Cutting Concern Service Containers

Start the docker containers using docker-compose up (in the exec dir)
```shell
docker-compose -f ../docker-compose-cross-cutting.yml --env-file ./.env up -d
```


To view the logs of the infrastructure containers, run:
```shell
docker-compose -f ../docker-compose-cross-cutting.yml --env-file ./.env logs -f
```

To stop the infrastructure containers, run:
```shell
docker-compose -f ../docker-compose-cross-cutting.yml --env-file ./.env stop
```


&nbsp; 

---
