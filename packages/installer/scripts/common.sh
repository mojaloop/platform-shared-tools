# common bash functions and variables for deloying Mojaloop vNext
# T Daly 
# Sept 2023

handle_error() {
  local exit_code=$?
  local line_number=$1
  local message="$2"
  local script_name="${0##*/}"
  echo
  echo "    ** Error exit code $exit_code on line $line_number : $message Exiting..."
  exit $exit_code
}

handle_warning() {
  local line_number=$1
  local message="$2"
  local script_name="${0##*/}"
  echo
  echo "    ** Warning from line $line_number : $message continuing ...\n"
  WARNING_IS_CURRENT=true
}

function check_arch {
  ## check architecture Mojaloop deploys on x64 only today arm is coming  
  ARCH=`uname -p`
  if [[ ! "$ARCH" == "x86_64" ]]; then 
    printf " ** Warning: Mojaloop vNext is only running confidently on x86_64 today. ARM64 is experimental  \n"
    printf " ** \n"
  fi
}

function get_arch_of_nodes { 
  NODE_ARCH=` kubectl get nodes -o yaml | grep architecture | head -1 | cut -d ":" -f2 | head | tr -d " "`
}

function check_user {
  # ensure that the user is not root
  if [ "$EUID" -eq 0 ]; then 
    printf " ** Error: please run $0 as non root user ** \n"
    exit 1
  fi
}

function check_repo_owner_not_root {
  # ensure that the user has not cloned the mojaloop (vNext) repo as the root user 
    dir_path=$1
    if [ "$(stat -c '%U' "$dir_path")" = "root" ]; then
         printf " ** Error: the mojaloop (vNext) repo [%s] is owned by the root user \n" "$dir_path"
         printf "           this will break the Mojaloop deployment \n"
         printf "           please re clone the repo as a non-root user \n"
         exit 1 
    fi
}


function check_not_inside_docker_container {
    if [ -f "/.dockerenv" ]; then
        printf " ** Error: can't run mini-loop inside docker container \n"
        exit 1 
    fi
}

function check_access_to_cluster {
  # check that the cluster is accessible 
  kubectl get nodes > /dev/null 2>&1 
  if [[ "$?" -ne 0 ]]; then
    printf " ** Error: Not connected to the kubernetes cluster \n"
    printf "           Possible causes are:- \n"
    printf "           - Cluster has not yet been created => see the README for creating cluster \n"
    printf "           - if running mini-loop mode, the .bashrc has not yet been sourced or the user logged out/in \n" 
    printf "           - if using EKS mode then the AWS credentials have likely expired => run aws-mfa \n" 
    exit 1 
  fi
}

function check_manifests_dir_exists  {
  if [[ ! -d "$MANIFESTS_DIR" ]] &&  [[ "$mode" == "delete_ml" ]]; then
    printf "  ** Error: can't delete as the vNext code is missing  \n"
    printf "            suggest you run again with %s -m install_ml \n" $0
    exit 1 
  fi 
}

function set_k8s_distro { 
  # various settings can differ between kubernetes releases and distributions 
  # so we need to figure out what kubernetes distribution is installed and running
  if [[ -f "/snap/bin/microk8s" ]]; then 
    k8s_distro="microk8s"
  elif [[ -f "/usr/local/bin/k3s" ]]; then 
    k8s_distro="k3s"
  else
    printf " ** Error: can't find either microk8s or k3s kubernetes distributions  \n"
    printf "    have you run k8s-install.sh to install one of these ? \n"
    printf " ** \n"
    exit 1      
  fi 
  printf "==> the installed kubernetes distribution is  [%s] \n" "$k8s_distro"
}

function set_k8s_version { 
  k8s_version=`kubectl version  2>/dev/null | grep "^Server" | perl -ne 'print if s/^.*v1.(\d+).*$/v1.\1/'`
}

function print_current_k8s_releases {
    printf "          Current Kubernetes releases are : " 
    for i in "${K8S_CURRENT_RELEASE_LIST[@]}"; do
        printf " [v%s]" "$i"
    done
    printf "\n"
}

function check_k8s_version_is_current {
  is_current_release=false
  ver=`echo $k8s_version|  tr -d A-Z | tr -d a-z `
  for i in "${K8S_CURRENT_RELEASE_LIST[@]}"; do
      if  [[ "$ver" == "$i" ]]; then
        is_current_release=true
        break
      fi  
  done
  if [[ ! $is_current_release == true ]]; then 
      printf "** Error: The current installed kubernetes release [ %s ] is not a current release \n" "$k8s_version"
      printf "          you must have a current kubernetes release installed to use this script \n"
      print_current_k8s_releases 
      printf "          for releases of kubernetes earlier than v1.22 mini-loop 3.0 might be of use \n"
      printf "** \n"
      exit 1
  fi 
  printf "==> the installed kubernetes release is detected to be  [%s] \n" "$k8s_version"
}

function set_mojaloop_timeout { 
  ## Set timeout 
  if [[ ! -z "$tsecs" ]]; then 
    TIMEOUT_SECS=${tsecs}s
  else 
    TIMEOUT_SECS=$DEFAULT_HELM_TIMEOUT_SECS 
  fi
  printf "==> Setting Mojaloop chart TIMEOUT_SECS to  [ %s ] \n" "$TIMEOUT_SECS"
} 

timer() {
  start=$1
  stop=$2
  elapsed=$((stop - start))
  echo $elapsed
}
record_memory_use () { 
  # record the memory use desribed by when the memory was measured 
  mem_when=$1
  total_mem=$(free -m | awk 'NR==2{printf "%.2fGB      | %.2fGB    | %.2f%%", $3/1024, $4/1024, $3*100/($3+$4)}')
  memstats_array["$mem_when"]="$total_mem"
}

function set_logfiles {
  # set the logfiles
  if [ ! -z ${logfiles+x} ]; then 
    LOGFILE="/tmp/$logfiles.log"
    ERRFILE="/tmp/$logfiles.err"
    echo $LOGFILE
    echo $ERRFILE
  fi 
  touch $LOGFILE
  touch $ERRFILE
  printf "start : mini-loop Mojaloop local install utility [%s]\n" "`date`" >> $LOGFILE
  printf "================================================================================\n" >> $LOGFILE
  printf "start : mini-loop Mojaloop local install utility [%s]\n" "`date`" >> $ERRFILE
  printf "================================================================================\n" >> $ERRFILE
  printf "==> logfiles can be found at %s and %s \n" "$LOGFILE" "$ERRFILE"
}

function update_k8s_images_from_docker_files {
  printf "==> updating kubernetes image versions in %s from docker-compose files   \n" $MANIFESTS_DIR
  local yaml_files=("path/to/file1.yaml" "path/to/file2.yaml")  # Replace with your YAML file paths
  compose_dir=$REPO_BASE_DIR/packages/deployment  
  CURRENT_IMAGES_FROM_DOCKER_FILES=($(grep image $compose_dir/**/docker*yml | grep -v infra | grep mojaloop | cut -d ":" -f3,4))
  k8s_yaml_files=($(ls $MANIFESTS_DIR/**/*yaml))
  # for element in "${k8s_yaml_files[@]}"; do
  #   echo "$element"
  # done
  for ((i=0; i<${#CURRENT_IMAGES_FROM_DOCKER_FILES[@]}; i++)); do
    local image="${CURRENT_IMAGES_FROM_DOCKER_FILES[$i]}"
    local image_name="${image%%:*}"  # Extract the image name
    local image_tag="${image#*:}"    # Extract the image tag
    
    # echo "i : $i"
    # echo "image: $image"
    # echo "image_name: $image_name"
    # echo "image_tag: $image_tag"

    for yaml_file in "${k8s_yaml_files[@]}"; do
      if grep -q "image: $image_name" "$yaml_file"; then
        sed -i "s|image: $image_name:.*|image: $image_name:$image_tag|g" "$yaml_file"
        #echo "Updated image in $image_name:$image_tag in $yaml_file "
      fi 
    done
  done
  printf " [ ok ] \n"
}

function copy_k8s_yaml_files_to_tmp {
  printf "==> copying kubernetes manifest directory from %s to /tmp/manifests   " "$MANIFESTS_DIR"
  # do this so that any dynamic local changes to the kubernetes manifest (*yaml) files won't
  # accidentally be written to the vNext git repo
  # echo "before copy MANIFESTS_DIR=$MANIFESTS_DIR"
  # rm -rf /tmp/$MANIFESTS_DIR 
  cp -r $MANIFESTS_DIR /tmp
  # and update the location of the manifests 
  MANIFESTS_DIR="/tmp/manifests" 
  #echo "after copy MANIFESTS_DIR=$MANIFESTS_DIR"
  printf " [ ok ] \n"
}

function configure_extra_options {
  printf "==> configuring which Mojaloop vNext options to install   \n"
  printf "    ** INFO: no extra options implemented or required for mini-loop vNext at this time ** \n"
  # for mode in $(echo $install_opt | sed "s/,/ /g"); do
  #   case $mode in
  #     logging)
  #       MOJALOOP_CONFIGURE_FLAGS_STR+="--logging "
  #       ram_warning="true"
  #       ;;
  #     *)
  #         printf " ** Error: specifying -o option   \n"
  #         printf "    try $0 -h for help \n" 
  #         exit 1 
  #       ;;
  #   esac
  # done 
} 

function set_and_create_namespace { 
  ## Set and create namespace if necessary 
  if [[ ! -z "$nspace" ]]; then 
    NAMESPACE=${nspace}
    kubectl create namspace "$NAMESPACE" >> $LOGFILE 2>>$ERRFILE
  else 
    NAMESPACE="default" 
  fi
  printf "==> Setting NAMESPACE to [ %s ] \n" "$NAMESPACE"
}

function modify_local_mojaloop_yaml_and_charts {
  if [[ "$#" -ne 2 ]]; then 
      printf "\n** Error: insufficient params passed to [%s] \n" "${FUNCNAME[0]}"
      exit 1
  fi 
  local config_script=$1
  local k8s_yamls_dir=$2
  if [[ ! -f "$config_script" ]]; then 
      printf "\n** Error: can't find yaml files configuration script [%s] \n" "$config_script"
      exit 1
  fi 
  if [[ ! -d "$k8s_yamls_dir" ]]; then 
      printf "\n** Error: can't find the directory with the kubernetes manifests (yaml files)  [%s] \n" "$k8s_yamls_dir"
      exit 1
  fi 
  printf "==> configuring Mojaloop vNext yaml and helm chart values \n" 
  # TODO implement domain names insertion into the ingress.yamls 
  # if [ ! -z ${domain_name+x} ]; then 
  #   printf "==> setting domain name to <%s> \n " $domain_name 
  #   MOJALOOP_CONFIGURE_FLAGS_STR+="--domain_name $domain_name " 
  # fi

  # TODO We want to avoid running the helm repackage when we don't need to 
  printf "     executing %s -d %s   \n" "$config_script" "$k8s_yamls_dir"
  $config_script $MOJALOOP_CONFIGURE_FLAGS_STR -d $k8s_yamls_dir
  if [[ $? -ne 0  ]]; then 
      printf " [ failed ] \n"
      exit 1 
  fi 
}

function repackage_infra_helm_chart {
  local infra_dir=$1
  current_dir=`pwd`
  cd $infra_dir
  if [[ "$NEED_TO_REPACKAGE" == "true" ]]; then 
    tstart=$(date +%s)
    printf "==> running repackage of the infrastructure helm chart to incorporate local configuration changes"
    status=`./package.sh >> $LOGFILE 2>>$ERRFILE`
    tstop=$(date +%s)
    telapsed=$(timer $tstart $tstop)
    timer_array[repackage_ml]=$telapsed
    if [[ "$status" -eq 0  ]]; then 
      printf " [ ok ] \n"
      NEED_TO_REPACKAGE="false"
    else
      printf " [ failed ] \n"
      printf "** please try running $infra_dir/package.sh manually to determine the problem **  \n" 
      cd $current_dir
      exit 1
    fi  
  fi 
  cd $current_dir
}

function add_helm_repos { 
    printf "==> add the helm repos required to install and run Mojaloop vnext-alpha \n" 
    helm repo add kiwigrid https://kiwigrid.github.io > /dev/null 2>&1
    helm repo add kokuwa https://kokuwaio.github.io/helm-charts > /dev/null 2>&1  #fluentd 
    helm repo add elastic https://helm.elastic.co > /dev/null 2>&1
    helm repo add codecentric https://codecentric.github.io/helm-charts > /dev/null 2>&1 # keycloak for TTK
    helm repo add bitnami https://charts.bitnami.com/bitnami > /dev/null 2>&1
    helm repo add mojaloop http://mojaloop.io/helm/repo/ > /dev/null 2>&1
    helm repo add cowboysysop https://cowboysysop.github.io/charts/ > /dev/null 2>&1  # mongo-express
    helm repo add redpanda-data https://charts.redpanda.com/ > /dev/null 2>&1   # kafka console 
    helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx   # nginx 
    helm repo update 
}

function delete_mojaloop_infra_release {
  printf "==> delete resources in the mojaloop [infrastructure] layer " 
  #helm delete %s --namespace %s" "$NAMESPACE" "$HELM_INFRA_RELEASE"
  ml_exists=`helm ls -a --namespace $NAMESPACE | grep $HELM_INFRA_RELEASE | awk '{print $1}' `
  if [ ! -z $ml_exists ] && [ "$ml_exists" == "$HELM_INFRA_RELEASE" ]; then 
    helm delete $HELM_INFRA_RELEASE --namespace $NAMESPACE >> $LOGFILE 2>>$ERRFILE
    sleep 2
  else 
    printf "\n    [ infrastructure services release %s not deployed => nothing to delete ]   " $HELM_INFRA_RELEASE
  fi
  # now check helm infra release is gone 
  ml_exists=`helm ls -a --namespace $NAMESPACE | grep $HELM_INFRA_RELEASE | awk '{print $1}' `
  if [ ! -z $ml_exists ] && [ "$ml_exists" == "$HELM_INFRA_RELEASE" ]; then 
      printf "\n** Error: helm delete possibly failed \n" "$HELM_INFRA_RELEASE"
      printf "   run helm delete %s manually   \n" $HELM_INFRA_RELEASE
      printf "   also check the pods using kubectl get pods --namespace   \n" $HELM_INFRA_RELEASE
      exit 1
  fi
  ## cleanup storage resources 
  pvc_exists=`kubectl get pvc --namespace "$NAMESPACE"  2>>$ERRFILE | grep -v NAME ` >> $LOGFILE 2>>$ERRFILE
  if [ ! -z "$pvc_exists" ]; then 
    kubectl get pvc --namespace "$NAMESPACE" | cut -d " " -f1 | xargs kubectl delete pvc >> $LOGFILE 2>>$ERRFILE
    kubectl get pv  --namespace "$NAMESPACE" | cut -d " " -f1 | xargs kubectl delete pv >> $LOGFILE 2>>$ERRFILE
    sleep 5 
  fi 
  # and check the pvc and pv are gone 
  local wait_secs=30
  local seconds=0 
  local end_time=$((seconds + $wait_secs )) 
  local iterations=0
  while [ $seconds -lt $end_time ]; do
    pvc_exists=`kubectl get pvc --namespace "$NAMESPACE" 2>>$ERRFILE |  grep -v NAME 2>>$ERRFILE`
    if [ ! -z "$pvc_exists" ]; then
      sleep 5 
      ((seconds+=5))
    else 
      break
    fi

  done
  if [[ $seconds -ge $end_time ]]; then 
      printf "** Error: the backend persistent volume resources may not have deleted properly  \n" 
      printf "   please try running the delete again or use helm and kubectl to remove manually  \n"
      printf "   ensure no pv or pvc resources remain defore trying to re-install ** \n"
      exit 1
  fi
  # if we get to here then we are reasonably confident infrastructure resources are cleanly deleted
  printf " [ ok ] \n"
}


function install_infra_from_local_chart  {
  local infra_dir=$1
  printf "start : mini-loop Mojaloop vNext install infrastructure services [%s]\n" "`date`" 
  delete_mojaloop_infra_release
  repackage_infra_helm_chart $infra_dir
  # install the chart
  printf  "==> deploy Mojaloop vNext infrastructure via %s helm chart and wait for upto %s  secs for it to be ready \n" "$ML_RELEASE_NAME" "$TIMEOUT_SECS"
  printf  "    executing helm install $HELM_INFRA_RELEASE --wait --timeout $TIMEOUT_SECS $infra_dir/infra-helm  \n "
  tstart=$(date +%s)
  helm install $HELM_INFRA_RELEASE --wait --render-subchart-notes --timeout $TIMEOUT_SECS  --namespace "$NAMESPACE" $infra_dir/infra-helm  >> $LOGFILE 2>>$ERRFILE
  tstop=$(date +%s)
  telapsed=$(timer $tstart $tstop)
  if [[ `helm status $HELM_INFRA_RELEASE  --namespace "$NAMESPACE" | grep "^STATUS:" | awk '{ print $2 }' ` = "deployed" ]] ; then 
    printf "   helm release [%s] deployed ok  \n" "$HELM_INFRA_RELEASE"
    timer_array[install_infra]=$telapsed
  else 
    printf "** Error: %s helm chart deployment failed \n" "$HELM_INFRA_RELEASE"
    printf "   Possible reasons include : - \n"
    printf "     very slow internet connection /  issues downloading container images (e.g. docker rate limiting) \n"
    printf "     slow machine/vm instance / insufficient memory to start all pods  \n"
    printf "**\n\n"

    printf "The current timeout for all pods to be ready is %s \n" "$TIMEOUT_SECS"
    printf "** Possible actions \n"
    printf "   1) allow the deployment to run a little longer , you an check on progress by running kubectl get pods \n"
    printf "      and examining to see if pods are still reaching \"running\" state over the next 10-20 mins \n"

    printf "   2) You can re-run this script with a timeout value longer than the default %s secs \n" "$DEFAULT_HELM_TIMEOUT_SECS"
    printf "       use the -t timeout_secs parameter or run %s -h for example(s) \n" "$0"
    printf "**\n\n"
    exit 1
  fi 
} 

function check_pods_are_running() { 
  local app_layer="$1"
  local wait_secs=90
  local seconds=0 
  local end_time=$((seconds + $wait_secs )) 
  local iterations=0
  local steady_count=3
  printf "    waiting for all pods in [%s] layer to come to running state ... " $app_layer
  while [ $seconds -lt $end_time ]; do
      local pods_not_running=$(kubectl get pods --selector="mojaloop.layer=$app_layer" | grep -v NAME | grep -v Running | wc -l)
      local containers_not_ready=$(kubectl get pods --selector="mojaloop.layer=$app_layer" --no-headers | awk '{split($2,a,"/"); if (a[1]!=a[2]) print}' | wc -l)

      if [ "$pods_not_running" -eq 0 ] && [ "$containers_not_ready" -eq 0 ]; then
        iterations=$((iterations+1))
        #echo "iterations are $iterations" 
        if [[ $iterations -ge $steady_count ]]; then # ensure pods are running and are stable 
          #printf "    All pods and containers in mojaloop layer [%s] are in running and ready state\n" "$app_layer"
          printf " [ ok ] \n"
          return 0
        fi 
      else 
        iterations=0
      fi 
      sleep 5 
      ((seconds+=5))
  done
  printf "    ** WARNING: Not all pods in application layer=%s are in running state within timeout of %s secs \n" "$app_layer" $wait_secs
} 

check_pods_status() {
  local layer_value="$1"
  local selector="mojaloop.layer=$layer_value"
  local wait_secs=30
  local seconds=0 
  local end_time=$((seconds + $wait_secs )) 

  while [ $seconds -lt $end_time ]; do
    local pods_not_terminating=$(kubectl get pods --selector="$selector" --no-headers | awk '{if ($3!="Terminating") print $1}') > /dev/null 2>&1
    if [ -z "$pods_not_terminating" ]; then
      #echo "All pods with mojaloop.layer=$layer_value are terminating or already gone."
      return 0
    fi
    sleep 5  # Wait for 5 seconds before the next check
    ((seconds+=5))
  done

  printf  "    \n** Warning: Not all pods in application layer [ %s ] are terminating or gone\n" $app_layer
  return 1
}

function delete_mojaloop_layer() { 
  local app_layer="$1"
  local layer_yaml_dir="$2"
  if [[ "$mode" == "delete_ml" ]]; then
    printf "==> delete resources  in the mojaloop [ %s ] application layer " $app_layer
  else 
    printf "    delete resources in the mojaloop [ %s ] application layer " $app_layer
  fi 
  current_dir=`pwd`
  cd $layer_yaml_dir
  yaml_non_dataresource_files=$(ls *.yaml | grep -v '^docker-' | grep -v "\-data\-" )
  yaml_dataresource_files=$(ls *.yaml | grep -v '^docker-' | grep -i "\-data\-" )
  for file in $yaml_non_dataresource_files; do
      kubectl delete -f $file > /dev/null 2>&1 
  done
  for file in $yaml_dataresource_files; do
      kubectl delete -f $file > /dev/null 2>&1 
  done
  cd $current_dir
  check_pods_status $app_layer > /dev/null 2>&1 
  if [[ $? -eq 0  ]]; then 
    printf " [ ok ] \n"
  fi 
}

function install_mojaloop_layer() { 
  local app_layer="$1"
  local layer_yaml_dir="$2"
  printf "==> installing the mojaloop [ %s ] application layer using yamls from [ %s ] \n" $app_layer $layer_yaml_dir
  delete_mojaloop_layer $app_layer $layer_yaml_dir
  current_dir=`pwd`
  cd $layer_yaml_dir
  yaml_non_dataresource_files=$(ls *.yaml | grep -v '^docker-' | grep -v "\-data\-" )
  yaml_dataresource_files=$(ls *.yaml | grep -v '^docker-' | grep -i "\-data\-" )
  for file in $yaml_dataresource_files; do
      kubectl apply -f $file > /dev/null 2>&1
  done
  for file in $yaml_non_dataresource_files; do
      kubectl apply -f $file > /dev/null 2>&1
  done
  cd $current_dir
  check_pods_are_running "$app_layer"
}

function check_mojaloop_health {
  # verify the health of the deployment 
  for i in "${EXTERNAL_ENDPOINTS_LIST[@]}"; do
    #curl -s  http://$i/health
    if [[ `curl -s  --head --fail --write-out \"%{http_code}\" http://$i/health | \
      perl -nle '$count++ while /\"status\":\"OK+/g; END {print $count}' ` -lt 1 ]] ; then
      printf  " ** Error: [curl -s http://%s/health] endpoint healthcheck failed ** \n" "$i"
      exit 1
    else 
      printf "    ==> curl -s http://%s/health is ok \n" $i 
    fi
    sleep 2 
  done 
}

check_status() {
  local exit_code=$?
  local message="$1"
  local line_number=${BASH_LINENO[0]}

  if [[ $exit_code -ne 0 ]]; then
    echo "Error occurred with exit code $exit_code on line $line_number: $message. Exiting..."
    exit $exit_code
  fi
}

function restore_demo_data {
  local mongo_data_dir=$1
  local ttk_files_dir=$2

  error_message=" restoring the mongo database data failed "
  trap 'handle_warning $LINENO "$error_message"' ERR
  printf "==> restoring demonstration/test data and ttk configs \n "
  # temporary measure to inject base participants data into switch 
  printf "   - restoring mongodb data " 
  mongopod=`kubectl get pods --namespace $NAMESPACE | grep -i mongodb |awk '{print $1}'` 
  mongo_root_pw=`kubectl get secret mongodb -o jsonpath='{.data.MONGO_INITDB_ROOT_PASSWORD}'| base64 -d` 
  kubectl cp $mongo_data_dir/mongodata.gz $mongopod:/tmp >/dev/null 2>&1 # copy the demo / test data into the mongodb pod
  # run the mongorestore 
  kubectl exec --stdin --tty $mongopod -- mongorestore  -u root -p $mongo_root_pw \
               --gzip --archive=/tmp/mongodata.gz --authenticationDatabase admin > /dev/null 2>&1
  printf " [ ok ] \n"

  # copy in the TTK environment data if bluebank pod exists and is running 
  # TODO remove the if then test and do all the time once TTK works on arm64 
  bb_pod_status=`kubectl get pods bluebank-backend-0 --namespace $NAMESPACE  --no-headers 2>/dev/null | awk '{print $3}' `
  if [[ "$bb_pod_status" == "Running" ]]; then
    error_message=" restoring some testing toolkit configuration data failed  "
    printf "    - testing toolkit data and environment config " 
    ####   bluebank  ###
    ttk_pod_env_dest="/opt/app/examples/environments"
    ttk_pod_spec_dest="/opt/app/spec_files"
    kubectl cp $ttk_files_dir/environment/hub_local_environment.json bluebank-backend-0:$ttk_pod_env_dest/hub_local_environment.json 
    kubectl cp $ttk_files_dir/environment/dfsp_local_environment.json bluebank-backend-0:$ttk_pod_env_dest/dfsp_local_environment.json
    kubectl cp $ttk_files_dir/spec_files/user_config_bluebank.json bluebank-backend-0:$ttk_pod_spec_dest/user_config.json
    kubectl cp $ttk_files_dir/spec_files/default.json bluebank-backend-0:$ttk_pod_spec_dest/rules_callback/default.json

    ####  greenbank  ###
    kubectl cp $ttk_files_dir/environment/hub_local_environment.json greenbank-backend-0:$ttk_pod_env_dest/hub_local_environment.json
    kubectl cp $ttk_files_dir/environment/dfsp_local_environment.json greenbank-backend-0:$ttk_pod_env_dest/dfsp_local_environment.json
    kubectl cp $ttk_files_dir/spec_files/user_config_greenbank.json greenbank-backend-0:$ttk_pod_spec_dest/user_config.json
    kubectl cp $ttk_files_dir/spec_files/default.json greenbank-backend-0:$ttk_pod_spec_dest/rules_callback/default.json

    if [[ ! $WARNING_IS_CURRENT == true ]]; then
      printf " [ ok ] \n"
    fi
  else 
    printf "    - ttk does not seem to be running so skipping TTK data and environment config (ttk does not yet run on arm64 from repo )\n" 
  fi 


  WARNING_IS_CURRENT=false  #clear current warning 
}

function configure_elastic_search {
  local repo_base_dir=$1
  local wait_secs=45
  local seconds=0 
  local end_time=$((seconds + $wait_secs )) 
  local warn=false

  printf "==> configure elastic search  "
  # see https://github.com/mojaloop/platform-shared-tools/tree/alpha-1.1/packages/deployment/docker-compose-infra
  config_path="$repo_base_dir/packages/deployment/docker-compose-infra"
  logging_json="es_mappings_logging.json"
  audit_json="es_mappings_auditing.json"
  elastic_password=`grep ES_ELASTIC_PASSWORD $repo_base_dir/packages/deployment/docker-compose-infra/.env.sample | cut -d "=" -f2`
  curlpod="curl"
  curl_pod_status=`kubectl get pods $curlpod --namespace $NAMESPACE  --no-headers 2>/dev/null | awk '{print $3}' `
  if [[ "$curl_pod_status" != "Running" ]]; then
    kubectl --namespace $NAMESPACE  run curl --image=curlimages/curl:latest -- sleep 2400 > /dev/null 2>&1
    while [ $seconds -lt $end_time ]; do
      curl_pod_status=`kubectl get pods $curlpod --namespace $NAMESPACE  --no-headers | awk '{print $3}' `
      if [[  "$curl_pod_status" == "Running" ]]; then
        break 
      else 
        sleep 5 
        ((seconds+=5))
      fi 
      # echo "curlpod=$curlpod: $seconds: $end_time"
    done 
  fi
  # copy the mappings into the curl pod
  kubectl cp $config_path/$audit_json $curlpod:/tmp > /dev/null 2>&1
  kubectl cp $config_path/$logging_json $curlpod:/tmp  > /dev/null 2>&1
   
  ## TODO: the url for the logging has been made temporarily ml-logging1 to avoid a clash
  ##       need to figure out why the http://infra-elasticsearch:9200/ml-logging already exists at this 
  ##       point in the deployment 
  result=`kubectl exec curl -- curl -i --insecure -X PUT "http://infra-elasticsearch:9200/ml-logging1/" \
      -u elastic:$elastic_password \
      -H "Content-Type: application/json" --data-binary @/tmp/$logging_json 2>&1 `
  echo $result | grep -i error > /dev/null 2>&1
  if [[ "$?" -ne 1 ]]; then 
    printf "\n    ** Warning: elastic search logging configuration failed (was logging dashbnoard already uploaded ?)\n" 
    warn=true
  fi 
  result=`kubectl exec curl -- curl -i --insecure -X PUT "http://infra-elasticsearch:9200/ml-auditing/" \
      -u elastic:$elastic_password \
      -H "Content-Type: application/json" --data-binary @"/tmp/$audit_json" 2>&1 `
  echo $result | grep -i error > /dev/null 2>&1 
  if [[ "$?" -ne 1 ]]; then 
    printf "    ** Warning: elastic search auditing configuration failed (was auditing dashbnoard already uploaded ?) \n" 
    warn=true
  fi
  kubectl delete pod $curlpod  > /dev/null 2>&1 & 
  if [[ "$warn" == false ]]; then 
    printf " [ ok ] \n"
  fi 
}

function check_urls {
  printf "==> checking URLs are active  \n"
  for url in "${EXTERNAL_ENDPOINTS_LIST[@]}"; do
    if ! [[ $url =~ ^https?:// ]]; then
        url="http://$url"
    fi

    if curl --output /dev/null --silent --head --fail "$url"; then
        if curl --output /dev/null --silent --head --fail --write-out "%{http_code}" "$url" | grep -q "200\|301"; then
            printf "      URL %s  [ ok ]  \n" $url
        else
            printf "    ** Warning: URL %s [ not ok ] \n " $url 
            printf "       (Status code: %s)\n" "$url" "$(curl --output /dev/null --silent --head --fail --write-out "%{http_code}" "$url")"
        fi
    else
        printf "  ** Warning : URL %s is not working.\n" $url 
    fi
  done
}

function print_start_banner { 
  printf "\n\n****************************************************************************************\n"
  printf "            --  Mojaloop vNext install mode = %s -- \n"  "$1"
  printf "********************* << START  >> *****************************************************\n\n" 
}

function print_end_banner {
  printf "\n\n****************************************************************************************\n"
  printf "            -- Mojaloop vNext install mode = %s  -- \n" "$1"
  printf "********************* << END >> ********************************************************\n\n"
}

function print_stats {
  # print out all the elapsed times in the timer_array
  printf "\n********* mini-loop stats *******************************\n"
  printf "kubernetes distro:version  [%s]:[%s] \n" "$k8s_distro" "$k8s_version"

  printf "installation options [%s] \n" "$install_opt"
  pods_num=`kubectl get pods | grep -v "^NAME" | grep Running | wc -l`
  printf "Number of pods running [%s] \n" "$pods_num"
  #helm list --filter $RELEASE_NAME -q | xargs -I {} kubectl get pods -l "app.kubernetes.io/instance={}" -o jsonpath='{range .items[*]}{.metadata.name}{"\n"}{end}'
  echo "major processing times :"
  for key in "${!timer_array[@]}"; do
    echo "    $key: ${timer_array[$key]} seconds"
  done
  total_system_mem=$(grep MemTotal /proc/meminfo | awk '{print $2/1024/1024 " GB"}')
  echo 
  echo "Total system memory: $total_system_mem"
  echo "When          | RAM used    | RAM free  | RAM used % "
  echo "-----------------------------------------------------"
  #date=$(date '+%Y-%m-%d %H:%M:%S')
  # Get system memory 
  total_mem=$(free -m | awk 'NR==2{printf "%.2fGB      | %.2fGB    | %.2f%%", $3/1024, $4/1024, $3*100/($3+$4)}')
  #printf "\n%-14s| %s\n" "$date" "$total_mem"
  record_memory_use "at_end"
  for key in "${!memstats_array[@]}"; do
    printf "%-14s| %s\n" "$key" "${memstats_array[$key]}"
  done
  printf "\n************ mini-loop stats ******************************\n"
}

function print_success_message { 
  #printf " ==> %s configuration of mojaloop deployed ok and passes endpoint health checks \n" "$RELEASE_NAME"
  printf " ==>  mojaloop vNext deployed \n" 
  printf "      no endpoint tests configured yet this is still WIP \n" 
}

## Common Environment Config & global vars 
##
ARCH=""
HELM_INFRA_RELEASE="infra"        # the name of the helm release for all the infrastructure services, mongodb, kafka etc
DEFAULT_HELM_TIMEOUT_SECS="1200s" # default timeout for deplying helm chart 
TIMEOUT_SECS=0                    # user override for TIMEOUT
DEFAULT_NAMESPACE="default"
# INFRA_DIR=$MANIFESTS_DIR/infra
# CROSSCUT_DIR=$MANIFESTS_DIR/crosscut
# APPS_DIR=$MANIFESTS_DIR/apps
#TTK_DIR=$MANIFESTS_DIR/ttk
K8S_CURRENT_RELEASE_LIST=( "1.26" "1.27" )
CURRENT_IMAGES_FROM_DOCKER_FILES=[]

NEED_TO_REPACKAGE="true"
EXTERNAL_ENDPOINTS_LIST=( vnextadmin bluebank.local greenbank.local ) 
LOGGING_ENDPOINTS_LIST=( elasticsearch.local )
declare -A timer_array
declare -A memstats_array
WARNING_IS_CURRENT=false

