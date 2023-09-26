#!/usr/bin/env bash
#  - termporary work around for arm for the vNext interop fspiop-api-svc 
#  - this script builds it locally with a known tag 
# Author:  Tom Daly 
# Date :   Sept 2023 

function set_user {
  # set the k8s_user 
  k8s_user=`who am i | cut -d " " -f1`
}

# ensure we are running as root 
if [ "$EUID" -ne 0 ]
  then echo "Please run as root"
  exit 1
fi

#### main #####

# ensure we are running as root 
if [ "$EUID" -ne 0 ]
  then echo "Please run as root"
  exit 1
fi
set_user
echo "k8s_user = $k8s_user"
rm -rf /tmp/interop-apis-bc
su - $k8s_user -c "git clone https://github.com/mojaloop/interop-apis-bc.git /tmp/interop-apis-bc"
local_version=` cat /tmp/interop-apis-bc/packages/fspiop-api-svc/package.json | grep version | cut -d ":" -f2 | tr -d "\"" | tr -d "," | tr -d " "`
echo "local version : $local_version"
# cd /tmp/interop-apis-bc
su - $k8s_user -c  "cd /tmp/interop-apis-bc; docker build -f packages/fspiop-api-svc/Dockerfile -t fspiop-api:$local_version . " 
tarfile="/tmp/fspiop-api:$local_version.tar" 
echo "tarfile is $tarfile"
rm -f $tarfile
su - $k8s_user -c "docker save --output $tarfile fspiop-api:$local_version"

ctr images import "$tarfile"
rm -f $tarfile