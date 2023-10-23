#!/usr/bin/env bash
# eks-vnext-install.sh
#    - install mojaloop vnext to a running  EKS cluster 
#       
# Author Tom Daly 
# Date Sept 2023


################################################################################
# Function: showUsage
################################################################################
# Description:		Display usage message
# Arguments:		none
# Return values:	none
#
function showUsage {
	if [ $# -lt 0 ] ; then
		echo "Incorrect number of arguments passed to function $0"
		exit 1
	else
echo  "USAGE: $0 -m <mode> [-d dns domain] [-n namespace] [-t secs] [-o options] [-f] 
Example 1 : $0 -m install_ml  # install mojaloop (vnext) 
Example 2 : $0 -m install_ml -n namespace1  # install mojaloop (vnext) into namespace1 
Example 3 : $0 -m delete_ml  # delete mojaloop  (vnext)  

Options:
-m mode ............ install_ml|delete_ml
-d domain name ..... domain name for ingress hosts e.g mydomain.com 
-n namespace ....... the kubernetes namespace to deploy mojaloop into 
-t secs ............ number of seconds (timeout) to wait for pods to all be reach running state
-h|H ............... display this message
"
	fi
}

################################################################################
# MAIN
################################################################################

##
# EKS specific Environment Config & global vars 
##

EKS_SCRIPTS_DIR="$( cd $(dirname "$0") ; pwd )"
echo "DBG> EKS SCRIPTS_DIR X = $EKS_SCRIPTS_DIR"
REPO_BASE_DIR="$( cd $(dirname "$EKS_SCRIPTS_DIR")/../../.. ; pwd )"
echo "DBG> REPO_BASE_DIR = $REPO_BASE_DIR"
COMMON_SCRIPTS_DIR=$REPO_BASE_DIR/packages/installer/scripts
echo "DBG> COMMON SCRIPTS_DIR X = $COMMON_SCRIPTS_DIR"
MANIFESTS_DIR=$REPO_BASE_DIR/packages/installer/manifests
echo "DBG> MANIFESTS_DIR = $MANIFESTS_DIR"
ETC_DIR=$REPO_BASE_DIR/packages/installer/etc
echo "DBG> ETC_DIR X = $ETC_DIR"
MOJALOOP_CONFIGURE_FLAGS_STR=" -d $MANIFESTS_DIR " 
LOGFILE="/logs/eks-vnext-install.log"
ERRFILE="/logs/eks-vnext-install.err"


# read in the functions and common global vars 
source $REPO_BASE_DIR/packages/installer/scripts/common.sh 
check_access_to_cluster

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

print_start_banner "EKS"
check_repo_owner_not_root $REPO_BASE_DIR
#check-arch mini-loop only ? 
check_user
# set_k8s_distro  # mini-loop ?  
set_k8s_version 
check_k8s_version_is_current 
set_logfiles 
set_and_create_namespace
set_mojaloop_timeout
printf "\n"

if [[ "$mode" == "delete_ml" ]] ; then
  delete_mojaloop_layer "ttk" $MANIFESTS_DIR/ttk
  delete_mojaloop_layer "apps" $MANIFESTS_DIR/apps
  delete_mojaloop_layer "crosscut" $MANIFESTS_DIR/crosscut
  delete_mojaloop_infra_release  
  print_end_banner "EKS"
elif [[ "$mode" == "install_ml" ]]; then
  tstart=$(date +%s)
  printf "start : Mojaloop (vNext) install utility [%s]\n" "`date`" >> $LOGFILE
  add_helm_repos # needed for EKS only 
  #configure_extra_options 
  copy_k8s_yaml_files_to_tmp
  modify_local_mojaloop_yaml_and_charts $COMMON_SCRIPTS_DIR/vnext-configure.py $MANIFESTS_DIR
  install_infra_from_local_chart $MANIFESTS_DIR/infra
  install_mojaloop_layer "crosscut" $MANIFESTS_DIR/crosscut
  install_mojaloop_layer "apps" $MANIFESTS_DIR/apps
  install_mojaloop_layer "ttk" $MANIFESTS_DIR/ttk
  restore_demo_data $ETC_DIR $REPO_BASE_DIR/packages/deployment/docker-compose-apps/ttk_files
  configure_elastic_search $REPO_BASE_DIR
  check_urls 
  tstop=$(date +%s)
  telapsed=$(timer $tstart $tstop)
  timer_array[install_ml]=$telapsed
  print_stats
  print_success_message 
  print_end_banner "EKS"
else 
  printf "** Error : wrong value for -m ** \n\n"
  showUsage
  exit 1
fi 