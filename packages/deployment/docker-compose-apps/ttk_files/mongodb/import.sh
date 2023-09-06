#! /bin/bash

ENV_FILE=/ttk_files/mongodb/.env
while IFS= read -r line; do
  export "$line"
done < <( grep --color=never -E -v -e '^#' -e '^[[:space:]]*$' "${ENV_FILE}" )

ls -1 /ttk_files/mongodb/*.json | sed 's/.json$//' | while read col; do
FILENAME="${col##*/}"

readarray -d . -t FILE_CONTENT <<< "$FILENAME"

mongoimport --host mongo --username ${MONGO_USERNAME:0:4} --password ${MONGO_PASSWORD:0:12} --db "${FILE_CONTENT[0]}" --collection "${FILE_CONTENT[1]}" --file /ttk_files/mongodb/$FILENAME.json --authenticationDatabase=admin --jsonArray
done
