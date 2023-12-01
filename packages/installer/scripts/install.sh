# install.sh 
# this is the common /main install script for vnext
# it should work across mini-loop , EKS and other kubernetes 
# engines
# T Daly 
# Nov 2023

function install_vnext {
  local ml_deploy_target="$1"
  record_memory_use "at_start"
  print_start_banner $ml_deploy_target
  get_arch_of_nodes
  if [[ $ml_deploy_target == "mini-loop" ]]; then 
    check_not_inside_docker_container   # mini-loop only 
    set_arch  
    set_k8s_distro  
    #check_arch   # mini-loop only 
  elif [[ $ml_deploy_target == "EKS" ]]; then 
    check_access_to_cluster  # eks only 
  fi 
  check_repo_owner_not_root $REPO_BASE_DIR
  check_user
  set_k8s_version 
  check_k8s_version_is_current 
  set_logfiles 
  set_and_create_namespace 
  set_mojaloop_timeout
  printf "\n"

  restore_demo_data
  configure_elastic_search $REPO_BASE_DIR
  exit 1 

  if  [[ "$mode" == "update_images" ]]; then
    print "<<<< for development only >>>>>\n"
    update_k8s_images_from_docker_files 
    printf "<<<< for development only >>>>>\n"
  elif [[ "$mode" == "delete_ml" ]]; then
    delete_mojaloop_layer "ttk" $MANIFESTS_DIR/ttk
    delete_mojaloop_layer "reporting" $MANIFESTS_DIR/reporting
    delete_mojaloop_layer "apps" $MANIFESTS_DIR/apps
    delete_mojaloop_layer "crosscut" $MANIFESTS_DIR/crosscut
    delete_mojaloop_infra_release  
    print_end_banner $ml_deploy_target
  elif [[ "$mode" == "install_ml" ]]; then
    tstart=$(date +%s)
    printf "     <start> :  Mojaloop (vNext) install utility [%s]\n" "`date`" >> $LOGFILE
    #configure_extra_options 
    
    copy_k8s_yaml_files_to_tmp
    source $HOME/mlenv/bin/activate 
    modify_local_mojaloop_yaml_and_charts  "$COMMON_SCRIPTS_DIR/vnext-configure.py" "$MANIFESTS_DIR"
    install_infra_from_local_chart $MANIFESTS_DIR/infra
    install_mojaloop_layer "crosscut" $MANIFESTS_DIR/crosscut
    install_mojaloop_layer "apps" $MANIFESTS_DIR/apps
    install_mojaloop_layer "reporting" $MANIFESTS_DIR/reporting

    if [[ "$ARCH" == "x86_64" ]] || [[ "$NODE_ARCH" == "amd64" ]]; then 
      install_mojaloop_layer "ttk" $MANIFESTS_DIR/ttk
    else
      printf "=> running on arm64 deploy ttks from /tmp/ttk\n"
      # Note today (Nov 2023) we assume that for arm64 so the TTK images are already built locally
      #      per the instructions in the readme.md this is an interim fix until we get builds for  arm64 
      #      see: https://github.com/mojaloop/project/issues/3637
      install_mojaloop_layer "ttk" /tmp/ttk
    fi
    #restore_demo_data $MONGO_IMPORT_DIR $REPO_BASE_DIR/packages/deployment/docker-compose-apps/ttk_files
    configure_elastic_search $REPO_BASE_DIR
    check_urls

    tstop=$(date +%s)
    telapsed=$(timer $tstart $tstop)
    timer_array[install_ml]=$telapsed
    print_stats
    print_success_message 
    print_end_banner $ml_deploy_target
  else 
    printf "** Error : wrong value for -m ** \n\n"
    showUsage
    exit 1
  fi 

}

