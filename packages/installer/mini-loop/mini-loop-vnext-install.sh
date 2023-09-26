#!/usr/bin/env bash
# vnext-install.sh
#    - install mojaloop vNext in a light-weight , simple and quick fashion 
#      for demo's testing and development.
#      This mode is affectionately known as mini-loop
         
# Author Tom Daly 
# Date Sept 2023

source ../scripts/common.sh 


function update_k8s_images_from_docker_files {
  local yaml_files=("path/to/file1.yaml" "path/to/file2.yaml")  # Replace with your YAML file paths
  compose_dir=$BASE_DIR/packages/deployment  
  CURRENT_IMAGES_FROM_DOCKER_FILES=($(grep image $compose_dir/**/docker*yml | grep -v infra | grep mojaloop | cut -d ":" -f3,4))
  MANIFESTS_DIR1="/tmp/manifests"
  k8s_yaml_files=($(ls $MANIFESTS_DIR1/**/*yaml))
  # for element in "${k8s_yaml_files[@]}"; do
  #   echo "$element"
  # done
  # for element in "${CURRENT_IMAGES_FROM_DOCKER_FILES[@]}"; do
  #   echo "$element"
  # done
  #local image_array=("image1:tag1" "image2:tag2")  # Replace with your array of images

  for ((i=0; i<${#CURRENT_IMAGES_FROM_DOCKER_FILES[@]}; i++)); do
    local image="${CURRENT_IMAGES_FROM_DOCKER_FILES[$i]}"
    local image_name="${image%%:*}"  # Extract the image name
    local image_tag="${image#*:}"    # Extract the image tag
    
    echo "i : $i"
    echo "image: $image"
    echo "image_name: $image_name"
    echo "image_tag: $image_tag"

    for yaml_file in "${k8s_yaml_files[@]}"; do
      if grep -q "image: $image_name" "$yaml_file"; then
        sed -i "s|image: $image_name:.*|image: $image_name:$image_tag|g" "$yaml_file"
        #echo "Updated image in $image_name:$image_tag in $yaml_file "
      fi 

    done
  done
}



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
exit

if [[ "$mode" == "delete_ml" ]]; then
  check_manifests_dir_exists
  delete_mojaloop_layer "ttk" $TTK_DIR
  delete_mojaloop_layer "apps" $APPS_DIR
  delete_mojaloop_layer "crosscut" $CROSSCUT_DIR
  delete_mojaloop_infra_release  
  print_end_banner "mini-loop"
elif [[ "$mode" == "install_ml" ]]; then
  tstart=$(date +%s)
  printf "start :  Mojaloop (vNext) install utility [%s]\n" "`date`" >> $LOGFILE
  #configure_extra_options 
  update_k8s_images_from_docker_files # during development make sure we are using the latest images 
  modify_local_mojaloop_yaml_and_charts "$SCRIPTS_DIR/vnext-configure.py"
  install_infra_from_local_chart
  install_mojaloop_layer "crosscut" $CROSSCUT_DIR 
  install_mojaloop_layer "apps" $APPS_DIR
  if [[ "$ARCH" == "x86_64" ]]; then 
    # for now only install TTK on intel i.e. not arm64 yet 
    install_mojaloop_layer "ttk" $TTK_DIR
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