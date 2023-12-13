#!/bin/bash

UTIL_SCRIPTS_DIR="$( cd $(dirname "$0") ; pwd )"
echo "UTIL_SCRIPTS_DIR = $UTIL_SCRIPTS_DIR"
REPO_BASE_DIR="$( cd $(dirname "$MINI_LOOP_SCRIPTS_DIR")/../../.. ; pwd )"
echo "REPOSITORY_BASE_DIR = $REPO_BASE_DIR"
MANIFESTS_DIR=$REPO_BASE_DIR/packages/installer/manifests
echo "MANIFESTS_DIR = $MANIFESTS_DIR"

# Set the destination directory
NGINX_YAML_DEST_DIR=$MANIFESTS_DIR/infra/nginx/eks
echo "NGINX_YAML_DEST_DIR = $NGINX_YAML_DEST_DIR"

# URL of the YAML file to download
# see: https://kubernetes.github.io/ingress-nginx/deploy/#aws
URL="https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.2/deploy/static/provider/aws/deploy.yaml"

# Download the YAML file using curl and save it to the destination directory
curl -o "$NGINX_YAML_DEST_DIR/deploy.yaml" "$URL"

# Check if the download was successful
if [ $? -eq 0 ]; then
  echo "Download successful! YAML file saved to: $NGINX_YAML_DEST_DIR/deploy.yaml"
else
  echo "Download failed. Please check the URL or try again later."
fi
