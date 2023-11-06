#!/usr/bin/env bash
# vnext-install.sh
#    - install mojaloop vNext in a light-weight , simple and quick fashion 
#      for demo's testing and development.
#      This mode is affectionately known as mini-loop
         
# Author Tom Daly 
# Date Sept 2023

#source ../scripts/common.sh 

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
#echo "DBG> MINI_LOOP_SCRIPTS_DIR X = $MINI_LOOP_SCRIPTS_DIR"
REPO_BASE_DIR="$( cd $(dirname "$MINI_LOOP_SCRIPTS_DIR")/../.. ; pwd )"
echo "DBG> REPO_BASE_DIR = $REPO_BASE_DIR"
COMMON_SCRIPTS_DIR=$REPO_BASE_DIR/packages/installer/scripts
#echo "DBG> COMMON SCRIPTS_DIR X = $COMMON_SCRIPTS_DIR"
MANIFESTS_DIR=$REPO_BASE_DIR/packages/installer/manifests
echo "DBG> MANIFESTS_DIR = $MANIFESTS_DIR"
ETC_DIR=$REPO_BASE_DIR/packages/installer/etc
#echo "DBG> ETC_DIR X = $ETC_DIR"
MOJALOOP_CONFIGURE_FLAGS_STR=" -d $MANIFESTS_DIR " 
LOGFILE="/tmp/miniloop-install.log"
ERRFILE="/tmp/miniloop-install.err"

# read in the functions and common global vars 
source $REPO_BASE_DIR/packages/installer/scripts/common.sh 

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


print_start_banner "mini-loop"
check_not_inside_docker_container
check_repo_owner_not_root $REPO_BASE_DIR
#check_arch   # mini-loop only 
set_arch
get_arch_of_nodes  
check_user
set_k8s_distro  # mini-loop only 
set_k8s_version 
check_k8s_version_is_current 
set_logfiles 
set_and_create_namespace 
set_mojaloop_timeout
printf "\n"

if  [[ "$mode" == "update_images" ]]; then
  print "<<<< for development only >>>>>\n"
  update_k8s_images_from_docker_files 
  print "<<<< for development only >>>>>\n"
elif [[ "$mode" == "delete_ml" ]]; then
  delete_mojaloop_layer "ttk" $MANIFESTS_DIR/ttk
  delete_mojaloop_layer "apps" $MANIFESTS_DIR/apps
  delete_mojaloop_layer "crosscut" $MANIFESTS_DIR/crosscut
  delete_mojaloop_infra_release  
  print_end_banner "mini-loop"
elif [[ "$mode" == "install_ml" ]]; then
  tstart=$(date +%s)
  printf "    <start> :  Mojaloop (vNext) install utility [%s]\n" "`date`" >> $LOGFILE
  #configure_extra_options 
  
  copy_k8s_yaml_files_to_tmp
  source $HOME/mlenv/bin/activate 
  modify_local_mojaloop_yaml_and_charts  "$COMMON_SCRIPTS_DIR/vnext-configure.py" "$MANIFESTS_DIR"
  install_infra_from_local_chart $MANIFESTS_DIR/infra
  install_mojaloop_layer "crosscut" $MANIFESTS_DIR/crosscut
  install_mojaloop_layer "apps" $MANIFESTS_DIR/apps
  
  if [[ "$ARCH" == "x86_64" ]] || [[ "$NODE_ARCH" == "amd64" ]]; then 
    install_mojaloop_layer "ttk" $MANIFESTS_DIR/ttk
  else
    printf "=> running on arm64 deploy ttks from /tmp/ttk\n"
    # TODO we assume that for arm64 so the TTK images already built locally
    #      as interim fix until they get build for  
    install_mojaloop_layer "ttk" /tmp/ttk
  fi
  restore_demo_data $ETC_DIR $REPO_BASE_DIR/packages/deployment/docker-compose-apps/ttk_files
  configure_elastic_search $REPO_BASE_DIR
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