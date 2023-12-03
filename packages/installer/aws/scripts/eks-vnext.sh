#!/usr/bin/env bash
# eks-vnext.sh
#    - install mojaloop vnext to a running  EKS cluster 
#       
# Author Tom Daly 
# Date Nov 2023


################################################################################
# MAIN
################################################################################

# set global vars 
ML_DEPLOY_TARGET="" 
set_deploy_target 
SCRIPTS_DIR="$( cd $(dirname "$0") ; pwd )"
echo "DBG> EKS SCRIPTS_DIR X = $SCRIPTS_DIR"
REPO_BASE_DIR="$( cd $(dirname "$SCRIPTS_DIR")/../../.. ; pwd )"
echo "DBG> REPO_BASE_DIR = $REPO_BASE_DIR"
COMMON_SCRIPTS_DIR=$REPO_BASE_DIR/packages/installer/scripts
echo "DBG> COMMON SCRIPTS_DIR X = $COMMON_SCRIPTS_DIR"
MANIFESTS_DIR=$REPO_BASE_DIR/packages/installer/manifests
MONGO_IMPORT_DIR=$REPO_BASE_DIR/packages/deployment/docker-compose-apps/ttk_files/mongodb
ETC_DIR=$REPO_BASE_DIR/packages/installer/etc
echo "DBG> ETC_DIR X = $ETC_DIR"
MOJALOOP_CONFIGURE_FLAGS_STR=" -d $MANIFESTS_DIR " 
LOGFILE="/tmp/$ML_DEPLOY_TARGET-install.log"
ERRFILE="/tmp/$ML_DEPLOY_TARGET-install.err"

# read in the functions and common global vars 
source $REPO_BASE_DIR/packages/installer/scripts/shared-functions.sh 
# read in the main mojaloop install function 
source $REPO_BASE_DIR/packages/installer/scripts/install.sh 

set_deploy_target  # deploy targets are mini-loop, EKS as at Nov 2023   

record_memory_use "at_start"
# Process command line options as required
while getopts "n:d:m:t:l:hH" OPTION ; do
   case "${OPTION}" in
        n)  nspace="${OPTARG}"
        ;;
        l)  logfiles="${OPTARG}"
        ;;
        t)  tsecs="${OPTARG}"
        ;;
        d)  domain_name="${OPTARG}"
            echo "-d flag is TBD"
            exit 1 
        ;; 
        m)  mode="${OPTARG}"
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


# call the common install script to install Mojaloop vNext into the kubernetes cluster
install_vnext $ML_DEPLOY_TARGET