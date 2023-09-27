#!/usr/bin/env bash
# eks-create-cluster.sh 
#    - run the terraform to create an EKS cluster for deploying Mojaloop vNext to       
# Author Tom Daly 
# Date Aug 2023

# todo list :
# - run terraform apply or destroy depending on mode 


function verify_credentials {
  printf "==> verify credentials are current using aws-mfa ...        "
  timeout 2 aws-mfa > /dev/null 2>&1 
  if [[ $? -eq 0 ]]; then 
    printf "[ok]\n"
  else 
    printf "\n** Error : please update cedentials using aws-mfa utility ** \n"
    exit 1
  fi  
}

function check_if_cluster_already_created {  
  printf "==> check if cluster [%s] already exists ...    " $CLUSTER_NAME
  cluster_exists=`terraform plan | grep -i aws_eks_cluster | grep "will be created"`
  if [[ $? -eq 0 ]]; then 
    CLUSTER_EXISTS=false
    printf "[no]\n"
  else 
    CLUSTER_EXISTS=true
    printf "[yes]\n"
  fi 
}

function create_cluster {
  printf "==> creating cluster by running terraform ...    "
  #check_if_cluster_already_created 
  if [ "$CLUSTER_EXISTS" = true ]; then 
    printf "\n    *** Error  : the cluster [%s] already exists   ** \n" $CLUSTER_NAME
    printf "        you can remove the cluster and associated resources using $0 -m delete \n"
    printf "        exiting and leaving cluster in place \n"
    printf "    ***\n"
    exit 1
  fi
  terraform apply 
}

function configure_kubectl {
  printf "==> configuring kubectl access to cluster...    "
  aws eks --region $(terraform output -raw region) update-kubeconfig --name $(terraform output -raw cluster_name) > /dev/null 2>&1 
  working=`kubectl get nodes | grep -i notready | wc -l`
  if [[ $? -eq 0 ]]; then 
    printf "[ok]\n"
  else 
    printf "\n    *** warning   : kubectl access to the cluster [%s] is not working \n" $CLUSTER_NAME
    printf "        try running kubectl get nodes  \n"
    printf "    ***\n"
    exit 1
  fi 

}


function deploy_nginx_configure_nlb {
  printf "==> deploy nginx with meta-data set to provision load balancer  " 
  nginx_exists=`helm ls -a --namespace $NGINX_NAMESPACE  | grep "nginx" | awk '{print $1}' `
  if [ ! -z $nginx_exists ] && [ "$nginx_exists" == "nginx" ]; then 
    printf "    [ nginx already installed .. skipping]  \n"
  else 
    helm install nginx ingress-nginx/ingress-nginx \
      --set controller.service.type=LoadBalancer \
      --set controller.ingressClassResource.default=true \
      --set controller.service.annotations."service\.beta\.kubernetes\.io/aws-load-balancer-type"="nlb" > /dev/null 2>&1 
    if [[ $? -eq 0 ]]; then 
      printf "[ok]\n"
    else 
      printf "\n    *** warning   : some error occurred while deploying nginx \n"
    fi 
  fi
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

function delete_nginx {
  printf "==> delete nginx (and hence NLB) ...  " 
  helm delete nginx --namespace $NGINX_NAMESPACE > /dev/null 2>&1
  sleep 1 
  nginx_exists=`helm ls -a --namespace $NGINX_NAMESPACE | grep "nginx" | awk '{print $1}' `
  if [ ! -z $nginx_exists ] && [ "$nginx_exists" == "nginx" ]; then 
    printf "\n    *** Error the nginx controller did not delete cleanly   ** \n" 
    printf "         please ensure nginx and associated pods are gone before deleting cluster\n"
    printf "         failure to remove the nginx prior to cluster delete will result in some cluster related resources \n"
    printf "         not being removed cleanly \n"
    printf "        exiting .... \n"
    printf "    ***\n"
  fi 
  printf "[ok]\n" 
}

function delete_cluster {
  printf "==> deleting cluster by running terraform destroy ...    "
  #check_if_cluster_already_created  
  if [ "$CLUSTER_EXISTS" = false ]; then 
    printf "\n    *** Error  : the cluster [%s] does not yet exist    ** \n" $CLUSTER_NAME
    printf "        you can create the cluster and associated resources using $0 -m create \n"
    printf "        exiting .... \n"
    printf "    ***\n"
    exit 1
  fi
  printf "\n    running terraform destroy \n" 
  terraform destroy
}

# function check_cluster_installed { 
#     printf "==> Check the cluster is available and ready from kubectl  "
#     k8s_ready=`su - $k8s_user -c "kubectl get nodes" | perl -ne 'print  if s/^.*Ready.*$/Ready/'`
#     if [[ ! "$k8s_ready" == "Ready" ]]; then 
#         printf "** Error : kubernetes is not installed , please run $0 -m install -u $k8s_user \n"
#         printf "           before trying to install mojaloop \n "
#         exit 1 
#     fi
#     printf "    [ ok ] \n"
# }

function print_end_message { 
    printf "\n\n*********************** << success >> *******************************************\n"
    printf "            -- AWS EKS managed kubernetes cluster  -- \n"
    printf "  utilities for deploying kubernetes in preparation for Mojaloop deployment   \n"
    printf "************************** << end  >> *******************************************\n\n"
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
echo  "USAGE: $0 -m [mode]
Example 1 : $0 -m create  # create an EKS cluster for Mojaloop (vNext)
Example 2 : $0 -m delete  # destroy the  existing EKS cluster 

Options:
-m mode ............... create|delete (-m is required)
-h|H .................. display this message
"
	fi
}

################################################################################
# MAIN
################################################################################

BASE_DIR=$( cd $(dirname "$0")/../.. ; pwd )
# RUN_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )" # the directory that this script is run from 
# SCRIPTS_DIR="$( cd $(dirname "$0")/../scripts ; pwd )"

TERRAFORM_RUN_DIR="/terraform/$TERRAFORM_CLUSTER_DIR"  # TERRFORM_CLUSTER_DIR should already be set in the environment of the container
CLUSTER_NAME=`grep cluster_name $TERRAFORM_RUN_DIR/terraform.tfvars | cut -d "\"" -f2`
CLUSTER_EXISTS=""
NGINX_NAMESPACE="default" 

# Check arguments
if [ $# -lt 1 ] ; then
	showUsage
	echo "Not enough arguments -m mode must be specified "
	exit 1
fi

# Process command line options as required
while getopts "m:hH" OPTION ; do
   case "${OPTION}" in
        m)	    mode="${OPTARG}"
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

printf "\n\n*********************************************************************************\n"
printf "            -- AWS EKS managed kubernetes cluster -- \n"
printf "  utilities for deploying kubernetes in preparation for Mojaloop deployment   \n"
printf "************************* << start >> *******************************************\n\n"
# set_user
# verify_user
cd $TERRAFORM_RUN_DIR   


if [[ "$mode" == "create" ]]  ; then
    printf "Creating  Cluster [%s] in directory [%s] ... \n" $CLUSTER_NAME $TERRAFORM_RUN_DIR 
    verify_credentials
    terraform init > /dev/null 2>&1 
    check_if_cluster_already_created   
    create_cluster    # run terraform 
    configure_kubectl # enable kubectl access to the cluster, and test it works 
    add_helm_repos
    deploy_nginx_configure_nlb 

    # printf "==> kubernetes distro:[%s] version:[%s] is now configured for user [%s] and ready for mojaloop deployment \n" \
    #             "$k8s_distro" "$K8S_VERSION" "$k8s_user"
    # printf "    To deploy mojaloop, please su - %s from root or login as user [%s] and then \n"  "$k8s_user" "$k8s_user"
    # printf "    please execute %s/mojaloop-install.sh\n" "$SCRIPTS_DIR"
    print_end_message 
elif [[ "$mode" == "delete" ]]  ; then
    printf "Deleting Cluster [%s] in directory [%s] ... \n" $CLUSTER_NAME $TERRAFORM_RUN_DIR 
    verify_credentials
    terraform init > /dev/null 2>&1 
    check_if_cluster_already_created 
    delete_nginx 
    delete_cluster
    print_end_message 
else 
    showUsage
fi 
