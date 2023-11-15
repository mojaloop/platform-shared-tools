#!/usr/bin/env bash
#  - termporary work around for arm64 for the ttk so we can have bluebank and greenbank 
#  - this script builds it locally with a known tag then alters the manifests/ttk/bluebank and greenbank yaml to 
#    use this local image 
# Author:  Tom Daly 
# Date :   Sept 2023 

function set_user {
  # set the k8s_user 
  k8s_user=`who am i | cut -d " " -f1`
  echo "k8s_user = $k8s_user"
}

#### main #######################################

## set env variables to enable navigating an finding things 
MINI_LOOP_SCRIPTS_DIR="$( cd $(dirname "$0") ; pwd )"
REPO_BASE_DIR="$( cd $(dirname "$MINI_LOOP_SCRIPTS_DIR")/../.. ; pwd )"
COMMON_SCRIPTS_DIR=$REPO_BASE_DIR/packages/installer/scripts
BASE_DIR="$( cd $(dirname "$0")/../../.. ; pwd )"
MANIFESTS_DIR=$BASE_DIR/packages/installer/manifests
LOGFILE=/tmp/ttk-interim-fix.log


## set image details 
IMAGE_BUILD_LIST=( "ml-testing-toolkit" "ml-testing-toolkit-ui" "ml-testing-toolkit-client-lib" ) 
#IMAGE_BUILD_LIST=(  "ml-testing-toolkit-client-lib" ) 
local_tag="vnext"

source $REPO_BASE_DIR/packages/installer/scripts/common.sh 

printf "\n\n****************************************************************************************\n"
printf "      --  Mojaloop vNext arm64 interim fixes -- build local images -- \n"  
printf "********************* << START  >> *****************************************************\n\n" 

# ensure we are running as root and set the user 
if [ "$EUID" -ne 0 ]
  then echo "Please run as root"
  exit 1
fi
set_user

# copy the manifests/ttk directory to /tmp as it messes with git status during dev/test
# if programatic changes are made to the yaml's in the repo itself

rm -rf /tmp/ttk
rm -rf $LOGFILE

su - $k8s_user -c "cp -r $MANIFESTS_DIR/ttk /tmp/ttk" 

# clone the testing toolkit repos and build the images locally on arm64
for img in "${IMAGE_BUILD_LIST[@]}"; do
    printf "==> building image [%s] using tag [%s] \n" "$img" "$local_tag"
    tagged_image="$img:$local_tag"
    rm -rf /tmp/$img 
    printf "==> cloning repo https://github.com/mojaloop/%s.git to /tmp \n " $img 
    su - $k8s_user -c "git clone https://github.com/mojaloop/$img.git /tmp/$img" >> $LOGFILE 2>&1
    printf "==> running docker build locally \n"
    su - $k8s_user -c  "cd /tmp/$img; docker build -t $tagged_image --build-arg NODE_VERSION=18.17.1-alpine . " >> $LOGFILE 2>&1
    #export to containerd images 
    printf "==> export docker image using docker save --output %s %s \n" $tarfile $tagged_image
    tarfile="/tmp/$tagged_image.tar" 
    rm -f $tarfile  # remove any old ones lying around 
    su - $k8s_user -c "docker save --output $tarfile $tagged_image" >> $LOGFILE 2>&1
    printf "==> import image using: k3s ctr images import %s  \n" $tarfile
    k3s ctr images import "$tarfile"  >> $LOGFILE 2>&1 
    printf "==> cleaning up , removing docker image , tarfile etc\n"
    rm -f $tarfile
    docker image rm $tagged_image >> $LOGFILE 2>&1
    printf "==> modify the deployment yamls to use this local image\n" 
    su - $k8s_user -c "perl -p -i.bak -e 's/image:.*$img:.*$/image: $tagged_image/g' /tmp/ttk/*.yaml"
done
printf "\n ** images appear to have built and been imported ok\n"
printf "      You can check they exist by running.. \n"
printf "      sudo k3s ctr images list | grep testing-toolkit \n"

    #grep image: /tmp/ttk/*yaml
    # rm -rf /tmp/ttk
    # su - $k8s_user -c "cp -r /tmp/ttkbak /tmp/ttk"

