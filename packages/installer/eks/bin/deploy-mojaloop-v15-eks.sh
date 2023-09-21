#!/usr/bin/env bash 
# script to test vanilla deploy of Mojaloop from package repo 
# assumes correct version of kubernetes , helm, ingress etc already installed and configured.
# June 2023 
# see install instructions in readme.md at https://github.com/mojaloop/helm and https://github.com/mojaloop/helm/blob/master/thirdparty/README.md

# Environment 

# update kubectl config 
eks_configure_kubectl.sh

printf "==> add the helm repos required to install and run Mojaloop version 15.x \n" 
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

# deploy the nginx and AWS NLB
printf "==> deploying nginx ingress controller and configuring for AWS NLB \n" 
helm install nginx ingress-nginx/ingress-nginx \
  --set controller.service.type=LoadBalancer \
  --set controller.ingressClassResource.default=true \
  --set controller.service.annotations."service\.beta\.kubernetes\.io/aws-load-balancer-type"="nlb"

# get rid of any old installs 
helm delete ml
helm delete be 

helm install be --wait --timeout 300s mojaloop/example-mojaloop-backend
helm install ml --wait --timeout 2400s mojaloop/mojaloop \
  --set account-lookup-service.account-lookup-service.config.featureEnableExtendedPartyIdType=true \
  --set account-lookup-service.account-lookup-service-admin.config.featureEnableExtendedPartyIdType=true \
  --set thirdparty.enabled=true \
  --set ml-ttk-test-setup-tp.tests.enabled=true \
  --set ml-ttk-test-val-tp.tests.enabled=true 
   
helm test ml --logs

printf " ** WARNING: before running terraform destory , you need to run helm delete nginx \n"
printf "             otherwise the terraform destory will fail when trying to remove the vpc and other resources\n"
