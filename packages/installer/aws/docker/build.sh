#!/usr/bin/env bash
# build.sh for docker container to run aws cli and aws-mfa auth tool
#          also for terraform and kubernetes clients and utils
# Tom Daly : Aug 2023 

################################################################################
# Function: showUsage
################################################################################
function showUsage {
		if [ $# -ne 0 ] ; then
			echo "Incorrect number of arguments passed to function $0"
			exit 1
		else
			echo  "USAGE: $0 -v version 
			Example 1 : $0
			Example 2 : $0 -n 

			Options:
			-n ................. use nocache flag to completely rebuild container
			-h|H ............... display this message
			"
		fi
}

function docker_build_nocache {
		echo "No-Cache" 
		docker build \
			--build-arg USER_NAME=$USER_NAME \
			--build-arg USER_ID=$USER_ID \
		 	--build-arg ARCH=$ARCH \
			--build-arg TERRAFORM_VERSION=$TERRAFORM_VERSION \
			--build-arg HELM_VERSION=$HELM_VERSION \
			--no-cache \
			-t $DOCKER_IMAGE_NAME .
}

function docker_build_cache {
		docker build \
			--build-arg USER_NAME=$USER_NAME \
			--build-arg USER_ID=$USER_ID \
		 	--build-arg ARCH=$ARCH \
			--build-arg TERRAFORM_VERSION=$TERRAFORM_VERSION \
			--build-arg HELM_VERSION=$HELM_VERSION \
			-t $DOCKER_IMAGE_NAME .
}

################################################################################
# MAIN
################################################################################

## Env vars 
DOCKER_IMAGE_NAME="vnext-aws-container:1"
USER_NAME=$(whoami)
USER_ID=$(id -u $USER_NAME)
#ARCH=`dpkg --print-architecture`
TERRAFORM_VERSION="1.5.1"
HELM_VERSION="3.12.1"
#RUN_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )" # the directory that this script is run from 
SCRIPT_DIR=$( cd $(dirname "$0") ; pwd )
echo "SCRIPT_DIR=$SCRIPT_DIR"
INSTALL_DIR="$SCRIPT_DIR/install"
REPO_BASE_DIR=$( cd $(dirname "$0")/../../../.. ; pwd ) # the vNext repo directory 
echo "REPO_BASE_DIR = $REPO_BASE_DIR"
COMMON_SCRIPTS_DIR=$REPO_BASE_DIR/packages/installer/scripts
echo "COMMON_SCRIPTS_DIR = $COMMON_SCRIPTS_DIR"



source $COMMON_SCRIPTS_DIR/common.sh 
set_arch 

echo "ARCH is $ARCH"


#trap 'rm -f "$INSTALL_DIR/$BASHRC_FILE" ' ERR

# Process command line options as required
while getopts "v:nhH" OPTION ; do
	case "${OPTION}" in
			n)	NOCACHE="true"
			;;
			h|H)	showUsage
					exit 0
			;;
			*)	echo  "unknown option"
				showUsage
				exit 1
		;;
	esac
done

cd $RUN_DIR
if  [[ ! -z {$NOCACHE+x} ]] ; then
	printf "\nrebuilding from scratch  (docker nocache flag)  \n"
	docker_build_nocache
else
	printf "\nrebuilding using the cache  \n"
	docker_build_cache
fi
