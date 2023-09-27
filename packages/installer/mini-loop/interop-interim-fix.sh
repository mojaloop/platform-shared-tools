#!/usr/bin/env bash
#  - termporary work around for arm for the vNext interop fspiop-api-svc 
#  - this script builds it locally with a known tag 
# Author:  Tom Daly 
# Date :   Sept 2023 

function set_user {
  # set the k8s_user 
  k8s_user=`who am i | cut -d " " -f1`
  echo "k8s_user = $k8s_user"
}


#### main #####
BASE_DIR="$( cd $(dirname "$0")/../../.. ; pwd )"
MANIFESTS_DIR=$BASE_DIR/packages/installer/manifests
local_image="local-fspiop-api:latest"
# ensure we are running as root 
if [ "$EUID" -ne 0 ]
  then echo "Please run as root"
  exit 1
fi
set_user

# clone the interop BC repo 
rm -rf /tmp/interop-apis-bc
su - $k8s_user -c "git clone https://github.com/mojaloop/interop-apis-bc.git /tmp/interop-apis-bc"
actual_version=` cat /tmp/interop-apis-bc/packages/fspiop-api-svc/package.json | grep version | cut -d ":" -f2 | tr -d "\"" | tr -d "," | tr -d " "`
echo "actual version : $actual_version"

# build a version of the image 
su - $k8s_user -c  "cd /tmp/interop-apis-bc; docker build -f packages/fspiop-api-svc/Dockerfile -t $local_image . " 

# save this docker image out and export to containerd images 
tarfile="/tmp/$local_image:$local_version.tar" 
echo "tarfile is $tarfile"
rm -f $tarfile  # remove any old ones lying around 
su - $k8s_user -c "docker save --output $tarfile $local_image"
k3s ctr images import "$tarfile"
rm -f $tarfile

# now modify the interop deloyment yaml to use this local image and set set imagePullPolicy to Never 
#su - $k8s_user -c "perl -p -i.bak -e 's/image:.*$/image: $local_image/g' $MANIFESTS_DIR/apps/fspiop-api-svc-deployment.yaml"
