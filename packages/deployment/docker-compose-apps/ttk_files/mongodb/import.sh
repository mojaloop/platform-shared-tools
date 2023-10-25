#! /bin/bash

ENV_FILE=.env.sample
while IFS= read -r line; do
  export "$line"
done < <( grep --color=never -E -v -e '^#' -e '^[[:space:]]*$' "${ENV_FILE}" )

mongorestore --uri "mongodb://${MONGO_USERNAME:0:4}:${MONGO_PASSWORD:0:12}@localhost:27017/" --gzip --archive=mongodata.gz
