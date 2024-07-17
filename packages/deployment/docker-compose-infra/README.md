# Platform Tools - Docker Compose for Infrastructure Services

Note: for Windows specific tips see this [readme](../README_WIN.md)

# Setup Infrastructure Containers

To startup Kafka, MongoDB, Elasticsearch and Kibana, follow the steps below:

1. Create a directory called `exec` inside the `docker-compose-infra` (this) directory, and go to that directory.

_This `exec` directory is ignored by gitignore, so can't be pushed to GitHub._

```shell
mkdir exec
cd exec
```

2. Create the following directories as children of the `docker-compose/exec` directory:
* `certs`
* `esdata01`
* `kibanadata`
* `logs`
* `tigerbeetle_data`
* `mongodb_data`
* `grafana_data`
* `prometheus_data`
* `prometheus_etc`
* `otel_data`

```shell
mkdir {certs,esdata01,kibanadata,logs,tigerbeetle_data,mongodb_data,grafana_data,prometheus_data,prometheus_etc,otel_data}
```

Note: For Mac users you might have to grant full access to these directories, to do that execute in the exec directory:
```shell
sudo chmod -R 777 .
```

3. Copy the `.env.sample` to the exec dir:
```shell
cp ../.env.sample ./.env
```

3. Copy Prometheus, Grafana and OpenTelemetry's files to the correspondent data directories:
```shell
cp ../prometheus.yml ./prometheus_etc/prometheus.yml
cp ../grafana_datasources.yml ./grafana_data/datasource.yml
cp ../otel-collector-config.yaml ./otel_data/config.yaml
```


5. Review the contents of the `.env` file. **If using MacOS update the ROOT_VOLUME_DEVICE_PATH to reflect the absolute path**


6. Ensure `vm.max_map_count` is set to at least `262144`: Example to apply property on live system:
```shell
sysctl -w vm.max_map_count=262144 # might require sudo
```


7. Initialise TigerBeetle data
```shell
docker run -v $(pwd)/tigerbeetle_data:/data ghcr.io/tigerbeetledb/tigerbeetle \
  format --cluster=0 --replica=0 --replica-count=1 /data/0_0.tigerbeetle
```
Note: on macOS, you might have to add `--cap-add IPC_LOCK, see this [page](https://github.com/tigerbeetledb/tigerbeetle#with-docker) on the official TigerBeetle repo for more info.

```shell
docker run --cap-add IPC_LOCK -v $(pwd)/tigerbeetle_data:/data ghcr.io/tigerbeetledb/tigerbeetle \
  format --cluster=0 --replica=0 /data/0_0.tigerbeetle
```

# Start Infrastructure Containers

Start the docker containers using docker compose up (in the exec dir)
```shell
docker compose -f ../docker-compose-infra.yml --env-file ./.env up -d
# OR for older versions of docker
docker-compose -f ../docker-compose-infra.yml --env-file ./.env up -d
```


To view the logs of the infrastructure containers, run:
```shell
docker compose -f ../docker-compose-infra.yml --env-file ./.env logs -f
# OR for older versions of docker
docker-compose -f ../docker-compose-infra.yml --env-file ./.env logs -f
```

To stop the infrastructure containers, run:
```shell
docker compose -f ../docker-compose-infra.yml --env-file ./.env stop
# OR for older versions of docker
docker-compose -f ../docker-compose-infra.yml --env-file ./.env stop
```


&nbsp;

---

# Accessing the management and monitoring tools

Once started, the services will available via localhost.
Use the credentials set in the .env file.

### ElasticSearch and Kibana for logs and auditing
- ElasticSearch API - https://localhost:9200/
- Kibana - http://localhost:5601

### Kafka and RedPanda Console
- Kafka Broker - localhost:9092
- Zookeeper - localhost:2181
- RedPanda Kafka Console - http://localhost:8080

### Mongo and Mongo Express Console
- MongoDB - mongodb://localhost:27017
- Mongo Express Console - http://localhost:8081

### Observability Dashboards (Metrics and tracing)
- Prometheus (metrics collector) - http://localhost:9090
- Grafana (metrics dashboards) - http://localhost:3000
- Jeager (tracing analysis) - http://localhost:16686

&nbsp;

---

# Setup ElasticSearch Mappings

Once ElasticSearch has started you should upload the data mappings for the logs and audits indexes using the following commands.

This must be executed once after setting up a new ElasticSearch instance, or when the indexes are updated.

Execute this in the directory containing the files `es_mappings_logging.json` and `es_mappings_auditing.json`.

**When asked, enter the password for the `elastic` user in the `.env` file.**

```shell
# Create the logging index
curl -i --insecure -X PUT "https://localhost:9200/ml-logging/" -u "elastic" -H "Content-Type: application/json" --data-binary "@es_mappings_logging.json"
```
```shell
# Create the auditing index
curl -i --insecure -X PUT "https://localhost:9200/ml-auditing/" -u "elastic" -H "Content-Type: application/json" --data-binary "@es_mappings_auditing.json"
```

**NOTE:** The master/source for the mappings files is the respective repositories: [logging-bc](https://github.com/mojaloop/logging-bc/blob/main/docker-compose/es_mappings.json) and [auditing-bc](https://github.com/mojaloop/auditing-bc/blob/main/docker-compose/es_mappings.json).

##### Additional Information on Elastic mappings
https://www.elastic.co/guide/en/elasticsearch/reference/8.1/explicit-mapping.html
https://www.elastic.co/guide/en/elasticsearch/reference/8.1/mapping-types.html

## Setup Kibana Dashboards

Once the mappings are installed, it is time to import the prebuilt Kibana objects for the _DataView_ and the _search_.

1. Open Kibana (login with credentials in .env file)
2. Navigate to **(top left burger icon) -> Management / Stack Management -> Kibana / Saved Objects**

>Or go directly to: http://localhost:5601/app/management/kibana/objects

3. Use the Import button on the top right to import the file `kibana-objects.ndjson` located in the `docker-compose` directory (this one).


## Viewing Kibana Logs

Go to **(top left burger icon) -> Analytics / Discover**, and then use the Open option on the top right to open the imported `"MojaloopDefaultLogView"` view.

## Viewing Kibana Audits

Go to **(top left burger icon) -> Analytics / Discover**, and then use the Open option on the top right to open the imported `"MojaloopDefaultLogView"` view.

## Mongo Express
To access mongo express web service, use http://localhost:8081/ with the default credentials:
- username: admin
- password: pass

Ref:
- https://github.com/mongo-express/mongo-express-docker

# Additional information



### Useful Commands

#### Monitor Kafka Events _(Download the Kafka clients from https://kafka.apache.org/downloads.html)_
```shell
./kafka-console-consumer.sh --topic nodejs-rdkafka-svc-integration-test-log-bc-topic --from-beginning --bootstrap-server localhost:9092
```

### Shutdown
```shell
docker-compose down -v
```
