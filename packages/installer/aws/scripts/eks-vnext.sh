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
export KUBECONFIG=/home/ubuntu/eks-iac/Terraform/kubeconfig

# print_start_banner "EKS"
# check_repo_owner_not_root $REPO_BASE_DIR
# #check-arch mini-loop only ? 
# get_arch_of_nodes 
# check_user
# # set_k8s_distro  # mini-loop only ?  
# set_k8s_version 
# check_k8s_version_is_current 
# set_logfiles 
# set_and_create_namespace
# set_mojaloop_timeout
# printf "\n"

# if  [[ "$mode" == "update_images" ]]; then
#   print "<<<< for development only >>>>>\n"
#   update_k8s_images_from_docker_files 
#   printf "<<<< for development only >>>>>\n"
# elif [[ "$mode" == "delete_ml" ]] ; then
#   delete_mojaloop_layer "ttk" $MANIFESTS_DIR/ttk
#   delete_mojaloop_layer "apps" $MANIFESTS_DIR/apps
#   delete_mojaloop_layer "crosscut" $MANIFESTS_DIR/crosscut
#   delete_mojaloop_infra_release  
#   print_end_banner "EKS"
# elif [[ "$mode" == "install_ml" ]]; then
#   tstart=$(date +%s)
#   #printf "start : Mojaloop (vNext) install utility [%s]\n" "`date`" >> $LOGFILE
#   add_helm_repos # needed for EKS only 
#   #configure_extra_options 
#   copy_k8s_yaml_files_to_tmp
#   modify_local_mojaloop_yaml_and_charts $COMMON_SCRIPTS_DIR/vnext-configure.py $MANIFESTS_DIR
#   install_infra_from_local_chart $MANIFESTS_DIR/infra
#   install_mojaloop_layer "crosscut" $MANIFESTS_DIR/crosscut
#   install_mojaloop_layer "apps" $MANIFESTS_DIR/apps
#   install_mojaloop_layer "ttk" $MANIFESTS_DIR/ttk
#   restore_demo_data $ETC_DIR $REPO_BASE_DIR/packages/deployment/docker-compose-apps/ttk_files
#   configure_elastic_search $REPO_BASE_DIR
#   check_urls 
#   tstop=$(date +%s)
#   telapsed=$(timer $tstart $tstop)
#   timer_array[install_ml]=$telapsed
#   print_stats
#   print_success_message 
#   print_end_banner "EKS"
# else 
#   printf "** Error : wrong value for -m ** \n\n"
#   showUsage
#   exit 1
# fi 