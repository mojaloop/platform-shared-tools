#!/usr/bin/env bash
# vnext-install.sh
#    - install mojaloop vNext in a light-weight , simple and quick fashion 
#      for demo's testing and development.
#      This mode is affectionately known as mini-loop
         
# Author Tom Daly 
# Date Sept 2023

source ../scripts/common.sh 

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
Example 2 : $0 -m install_ml -n namespace1  # install mojaloop (vnext)
Example 3 : $0 -m delete_ml  # delete mojaloop  (vnext)  

Options:
-m mode ............ install_ml|delete_ml
-d domain name ..... domain name for ingress hosts e.g mydomain.com (TBD) 
-n namespace ....... the kubernetes namespace to deploy mojaloop into 
-t secs ............ number of seconds (timeout) to wait for pods to all be reach running state
-o options(s) .......ml vNext options to toggle on ( logging )
-h|H ............... display this message
"
	fi
}

################################################################################
# MAIN
################################################################################

# Mini-loop specific global vars 
MINI_LOOP_SCRIPTS_DIR="$( cd $(dirname "$0") ; pwd )"
echo "DBG> MINI_LOOP_SCRIPTS_DIR X = $MINI_LOOP_SCRIPTS_DIR"
SCRIPTS_DIR="$( cd $(dirname "$0")/../scripts ; pwd )"
echo "DBG> SCRIPTS_DIR X = $SCRIPTS_DIR"
ETC_DIR="$( cd $(dirname "$0")/../etc ; pwd )"
echo "DBG> ETC_DIR X = $ETC_DIR"
BASE_DIR="$( cd $(dirname "$0")/../../.. ; pwd )"
echo "DBG> BASE_DIR = $BASE_DIR"
MANIFESTS_DIR=$BASE_DIR/packages/installer/manifests
MOJALOOP_CONFIGURE_FLAGS_STR=" -d $MANIFESTS_DIR " 
echo "DBG> MANIFESTS_DIR = $MANIFESTS_DIR"
LOGFILE="/tmp/miniloop-install.log"
ERRFILE="/tmp/miniloop-install.err"

# read in the functions and common global vars 
source $BASE_DIR/packages/installer/scripts/common.sh 

record_memory_use "at_start"

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

# Call the function


print_start_banner "mini-loop"
check_arch   # mini-loop only 
check_user
set_k8s_distro  # mini-loop only 
set_k8s_version 
check_k8s_version_is_current 
set_logfiles 
set_and_create_namespace 
set_mojaloop_timeout

printf "\n"

if [[ "$mode" == "delete_ml" ]]; then
  #check_manifests_dir_exists
  delete_mojaloop_layer "ttk" $MANIFESTS_DIR/ttk
  delete_mojaloop_layer "apps" $MANIFESTS_DIR/apps
  delete_mojaloop_layer "crosscut" $MANIFESTS_DIR/crosscut
  delete_mojaloop_infra_release  
  print_end_banner "mini-loop"
elif [[ "$mode" == "install_ml" ]]; then
  tstart=$(date +%s)
  printf "start :  Mojaloop (vNext) install utility [%s]\n" "`date`" >> $LOGFILE
  #configure_extra_options 
  copy_k8s_yaml_files_to_tmp
  modify_local_mojaloop_yaml_and_charts  "$SCRIPTS_DIR/vnext-configure.py" "$MANIFESTS_DIR"
  update_k8s_images_from_docker_files # during development enable sync image versions for k8s  from docker-compose 
  if [[ "$ARCH" == "aarch64" ]]; then  
    # as of Sept 2023 there is a bug where interop image need building locally 
    # then we need to adjust interop deployment yaml to deploy the local image
    export localimage=`grep "^local_image" $MINI_LOOP_SCRIPTS_DIR/interop-interim-fix.sh | cut -d "=" -f2 | tr -d "\""`
    echo $localimage
    perl -p -i.bak -e "s/image:.*$/image: $localimage/g" $MANIFESTS_DIR/apps/fspiop-api-svc-deployment.yaml
    perl -p -i.bak -e "s/imagePullPolicy:.*$/imagePullPolicy: Never/g" $MANIFESTS_DIR/apps/fspiop-api-svc-deployment.yaml
  fi
  install_infra_from_local_chart $MANIFESTS_DIR/infra
  install_mojaloop_layer "crosscut" $MANIFESTS_DIR/crosscut
  install_mojaloop_layer "apps" $MANIFESTS_DIR/apps
  if [[ "$ARCH" == "x86_64" ]]; then 
    # for now only install TTK on intel i.e. not arm64 yet 
    install_mojaloop_layer "ttk" $MANIFESTS_DIR/ttk
  fi 
  restore_demo_data
  configure_elastic_search
  check_urls

  tstop=$(date +%s)
  telapsed=$(timer $tstart $tstop)
  timer_array[install_ml]=$telapsed
  print_stats
  print_success_message 
  print_end_banner "mini-loop"
else 
  printf "** Error : wrong value for -m ** \n\n"
  showUsage
  exit 1
fi 