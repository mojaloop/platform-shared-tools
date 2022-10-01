# Platform Tools - Docker compose deployment scripts

## Startup Infrastructure Containers 

To startup Kafka, MongoDB, Elasticsearch and Kibana, follow the steps below:

1. Create a directory called `exec` inside the `docker-compose` (this) directory, and go to that directory.

```shell
$ mkdir exec
$ cd exec
```

2. Create the following directories as children of the `docker-compose/exec` directory:
* `certs`
* `esdata01`
* `kibanadata`
* `logs`

```shell
mkdir {certs,esdata01,kibanadata,logs}
```

3. Copy the `.env.sample` to the exec dir:
```shell
cp ../.env.sample ./.env
```

4. Review the contents of the `.env` file

5. Ensure `vm.max_map_count` is set to at least `262144`: Example to apply property on live system:
```shell
sysctl -w vm.max_map_count=262144 # might require sudo
```

6. Start the docker containers using docker-compose up
```shell
docker-compose -f docker-compose-infra.yml up -d
```

## Viewing the dashboards

Once started, the services will available via localhost.
Use the credentials set in the .env file.

### ElasticSearch and Kibana
- ElasticSearch API - https://localhost:9200/
- Kibana - http://localhost:5601

### Kafka and RedPanda Console
- Kafka Broker - localhost:9092
- Zookeeper - localhost:2181
- RedPanda Kafka Console - http://localhost:8080

### Mongo and Mongo Express Console
- Kafka Broker - localhost:9092
- Zookeeper - localhost:2181
- RedPanda Kafka Console - http://localhost:8080


## ElasticSearch Logging Mappings

### Once ElasticSearch has started you should upload the data mappings using the following command:

```shell
curl -i --insecure -X PUT "https://localhost:9200/mjl-logging/"  \ 
  -u "elastic:PASSWORD_IN_ENV_FILE" \ 
  -H "Content-Type: application/json" \
  --data-binary "@es_mappings.json"
```
**Note:** if the password includes special characters, they must be escaped. Alternatively, use `-u "username"` so curl can ask you for the password interactively.

##### Additional Information on Elastic mappings
https://www.elastic.co/guide/en/elasticsearch/reference/8.1/explicit-mapping.html
https://www.elastic.co/guide/en/elasticsearch/reference/8.1/mapping-types.html

## Kibana Logs and Dashboards Import

Once the mappings are installed, it is time to import the prebuilt Kibana objects for the _DataView_ and the _search_. 

1. Navigate to **(top left burger icon) -> Management / Stack Management -> Kibana / Saved Objects**

>Or go directly to: http://localhost:5601/app/management/kibana/objects

2. Use the Import button on the top right to import the file `kibana-objects.ndjson` located in the `docker-compose` directory.

At this moment, Kibana can be used to view the logs. 

## Viewing Kibana Logs

Go to **(top left burger icon) -> Analytics / Discover**, and then use the Open option on the top right to open the imported `"MojaloopDefaultLogView"` view.   

## Addtitional information

### Ports
* 5601 -> [Kibana Local (http://localhost:5601)](http://localhost:5601)
* 9200 -> [ElasticSearch Local (https://localhost:9200)](https://localhost:9200)
* 9092 -> [Kafka Local (http://localhost:9092)](http://localhost:9092)

### Useful Commands

#### Monitor Kafka Events _(Download the Kafka clients from https://kafka.apache.org/downloads.html)_
```shell
./kafka-console-consumer.sh --topic nodejs-rdkafka-svc-integration-test-log-bc-topic --from-beginning --bootstrap-server localhost:9092
```

### Shutdown
```shell
docker-compose down -v
```

### Dashboard
The log dashboard may be imported from Kibana. Follow the steps below:
1. Navigate to http://localhost:5601/app/management/kibana/objects
2. Click import and select `log-dashboard.ndjson`
3. Select appropriate options.
4. Import!
