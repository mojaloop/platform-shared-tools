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

# function check_and_add_mfa_device_to_docker_bashrc {
# 	if [[ -z "$MFA_DEVICE" ]]; then 
# 		printf "** Error: need to set the registered AWS MFA device in the environment before calling build.sh \n"
# 		printf "          i.e. export MFA_DEVICE=\"<your AWS ARN>\" \n" 
# 		printf "          which will look similar to export MFA_DEVICE=\"arn:aws:iam::111111111111:mfa/fred\" \n"
# 		printf "          see: https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_mfa_enable_virtual.html \n"
# 		printf "          see: aws-mfa utility details at https://pypi.org/project/aws-mfa/ \n" 
# 		exit 1
# 	fi 
# 	# add the MFA_DEVICE to the bashrc that will be added to the docker container 
# 	cp $INSTALL_DIR/bashrc $INSTALL_DIR/$BASHRC_FILE
# 	echo "export MFA_DEVICE=$MFA_DEVICE" >> $INSTALL_DIR/$BASHRC_FILE
# }

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

# Set args for passing to Dockerfile 
USER_NAME=$(whoami)
USER_ID=$(id -u $USER_NAME)
#ARCH=`uname -p`
ARCH=`dpkg --print-architecture`
TERRAFORM_VERSION="1.5.1"
HELM_VERSION="3.12.1"

# Environment Variables 
SCRIPTNAME=$0
BASE_DIR=$( cd $(dirname "$0")/../.. ; pwd )
RUN_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )" # the directory that this script is run from 
INSTALL_DIR="$RUN_DIR/install"
DOCKER_IMAGE_NAME="vnext-eks-helper:1"
trap 'rm -f "$INSTALL_DIR/$BASHRC_FILE" ' ERR

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

# check_and_add_mfa_device_to_docker_bashrc

if  [[ -z {$NOCACHE} ]] ; then
	printf "\nrebuilding from scratch  (docker nocache flag)  \n"
	docker_build_nocache
else
	printf "\nrebuilding using the cache  \n"
	docker_build_cache
fi
#rm -f "$INSTALL_DIR/$BASHRC_FILE"



