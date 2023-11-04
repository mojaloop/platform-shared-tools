#!/usr/bin/env bash
# Example of how to run the docker container which facilitates
# authenticating to AWS and then running Terraform to build an AWS EKS cluster or EC2 instance
# and deploy Mojaloop vNext 
# Tom Daly : Sept 2023


function check_aws_cred_setup {
  if [[ ! -f "$AWS_CREDENTIALS_DIR/credentials" ]]; then
    printf " ** Error: the aws credentials [ %s ] file is not found \n" "$AWS_CREDENTIALS_DIR/credentials"
    printf "    please refer to AWS documentation on setting up the credentials file and try again ** \n"
    exit 
  fi

  if [[ -z ${aws_profile+x} ]]; then 
     printf "** Error: no AWS profile specified \n"
     printf "    please use the -p flag to indicate which AWS profile to use \n" 
     showUsage
  fi 
} 

function other_setup_items {
  if [ ! -d "$HOME/.kube" ]; then 
    mkdir "$HOME/.kube"
  fi 
  if [ ! -d "$HOME/logs" ]; then 
    mkdir "$HOME/logs"  # used for logfiles from Mojaloop vNext install  
  fi 
}

function check_image_exists_locally {
  docker image inspect $DOCKER_IMAGE_NAME > /dev/null 2>&1
  if [[ $? -ne 0 ]]; then 
    printf " ** Error: the docker image [ %s ] is not found locally \n" "$DOCKER_IMAGE_NAME"
    printf "    please run  [ %s ] to build it ** \n"  "$SCRIPT_DIR/build.sh"
    exit 
  fi 
}

function run_docker_container { 
  echo "Running $DOCKER_IMAGE_NAME container"
  docker run \
    --interactive --tty --rm \
    --volume "$AWS_CREDENTIALS_DIR":/home/${USER_NAME}/.aws \
    --volume "$HOME/.kube":/home/${USER_NAME}/.kube \
    --volume "$REPO_BASE_DIR":/home/${USER_NAME}/vnext/platform-shared-tools \
    --volume "$HOME/logs":/logs \
    --env AWS_PROFILE="$aws_profile" \
    --env TERRAFORM_CLUSTER_DIR="/home/${USER_NAME}/vnext/platform-shared-tools/packages/installer/aws/terraform/$TERRAFORM_CLUSTER_DIR" \
    --hostname "$DOCKER_IMAGE_NAME" \
    --entrypoint=/bin/bash $DOCKER_IMAGE_NAME $@
} 

################################################################################
# Function: showUsage
################################################################################
# Description:		Display usage message
# Arguments:		none
# Return values:	none
#
function showUsage {
	if [ $# -ne 0 ] ; then
		echo "Incorrect number of arguments passed to function $0"
		exit 1
	else
echo 
echo  "USAGE: $0 -p [profile]
Example 1 : $0 -p mojaloop  # run using the profile for mojaloop in the AWS credentials file 

Options:
-p profile ............... corresponds to the profile to use from the aws credentials file 
-h|H ..................... display this message
"
	fi
  exit 1
}

################################################################################
# MAIN
################################################################################

# Process command line options as required
while getopts "p:hH" OPTION ; do
   case "${OPTION}" in
        p)	    aws_profile="${OPTARG}"
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

## User settings change these to reflect your locations ########################################
AWS_CREDENTIALS_DIR="$HOME/.aws"   # directory with the aws "credentials file" normally should not need changing
TERRAFORM_CLUSTER_DIR="cluster1"  # this is the name of the directory containing the terraform to create the cluster 
################################################################################################

# SCRIPT_DIR=$( cd $(dirname "$0") ; pwd )
# INSTALLER_DIR=$( cd $(dirname "$0")/../.. ; pwd )
# EKS_DIR=$( cd $(dirname "$0")/.. ; pwd )  # this is the installer/eks directory 
# REPO_DIR=$( cd $(dirname "$0")/../../../.. ; pwd )
# echo "script dir is $SCRIPT_DIR"
# echo "REPO_DIR is $REPO_DIR"
# echo "installer dir is $INSTALLER_DIR"

# # point to the docker image that results from running build.sh 
# DOCKER_IMAGE_NAME=`grep DOCKER_IMAGE_NAME= $SCRIPT_DIR/build.sh | cut -d "\"" -f2 | awk '{print $1}'`
# # get the username and id of the user running this script
# USER_NAME=$(whoami)
# USER_ID=$(id -u $USER_NAME)
# # terraform directory for AWS 
# HOST_TERRAFORM_DIR=$EKS_DIR/terraform
# # MOJALOOP_BIN_DIR=$EKS_DIR/bin
# # MOJALOOP_ETC_DIR=$EKS_DIR/etc

#### Set global env vars ####
AWS_CREDENTIALS_DIR="$HOME/.aws"   # directory with the aws "credentials file" normally should not need changing
SCRIPT_DIR=$( cd $(dirname "$0") ; pwd )
REPO_BASE_DIR=$( cd $(dirname "$0")/../../../.. ; pwd ) # the vNext repo directory 
echo "REPO_BASE_DIR = $REPO_BASE_DIR"
HOST_TERRAFORM_DIR=$( cd $(dirname "$0")/../terraform ; pwd )
# point to the docker image that results from running build.sh 
DOCKER_IMAGE_NAME=`grep DOCKER_IMAGE_NAME $SCRIPT_DIR/build.sh | grep -v "\-t" | cut -d "\"" -f2 | awk '{print $1}'`
USER_NAME=$(whoami)
USER_ID=$(id -u $USER_NAME)

printf "running AWS script [ %s ] from directory [ %s ] \n" $0 $SCRIPT_DIR
printf "using docker image [ %s ] declared in [ %s ]  \n" "$DOCKER_IMAGE_NAME" "$SCRIPT_DIR/build.sh" 

## run checks and then run the container 
check_aws_cred_setup
other_setup_items
check_image_exists_locally
run_docker_container
