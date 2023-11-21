#!/usr/bin/env bash
# mini-loop-vnext.sh
#    - install mojaloop vNext in a light-weight, simple and quick fashion 
#      for demo's testing and development, this mode is affectionately known as mini-loop         
# Author Tom Daly 
# Date Nov 2023 


################################################################################
# MAIN
################################################################################

# set global vars 
ML_DEPLOY_TARGET="" 
SCRIPTS_DIR="$( cd $(dirname "$0") ; pwd )"
#echo "DBG> SCRIPTS_DIR X = $SCRIPTS_DIR"
REPO_BASE_DIR="$( cd $(dirname "$SCRIPTS_DIR")/../.. ; pwd )"
#echo "DBG> REPO_BASE_DIR = $REPO_BASE_DIR"
COMMON_SCRIPTS_DIR=$REPO_BASE_DIR/packages/installer/scripts
#echo "DBG> COMMON SCRIPTS_DIR X = $COMMON_SCRIPTS_DIR"
MANIFESTS_DIR=$REPO_BASE_DIR/packages/installer/manifests
#echo "DBG> MANIFESTS_DIR = $MANIFESTS_DIR"
MONGO_IMPORT_DIR=$REPO_BASE_DIR/packages/deployment/docker-compose-apps/ttk_files/mongodb
MOJALOOP_CONFIGURE_FLAGS_STR=" -d $MANIFESTS_DIR " 
LOGFILE="/tmp/$ML_DEPLOY_TARGET-install.log"
ERRFILE="/tmp/$ML_DEPLOY_TARGET-install.err"

# read in the functions and common global vars
source $REPO_BASE_DIR/packages/installer/scripts/shared-functions.sh 
# read in the main mojaloop install function 
source $REPO_BASE_DIR/packages/installer/scripts/install.sh 

set_deploy_target  # deploy targets are mini-loop, EKS as at Nov 2023   

# Process command line options as required
while getopts "d:m:t:l:o:hH" OPTION ; do
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
        o)  install_opt="${OPTARG}"
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
