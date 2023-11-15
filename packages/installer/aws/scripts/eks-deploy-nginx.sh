#!/usr/bin/env bash
# see https://aws.amazon.com/blogs/containers/exposing-kubernetes-applications-part-3-nginx-ingress-controller/


# helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
# #helm repo add eks https://aws.github.io/eks-charts

# # install nginx 
# helm install nginx ingress-nginx/ingress-nginx \
#   --set controller.service.type=LoadBalancer \
#   --set controller.ingressClassResource.default=true \
#   --set controller.service.annotations."service\.beta\.kubernetes\.io/aws-load-balancer-type"="nlb"

function deploy_nginx_configure_nlb {
  local nginx_yaml_dir="$1"
  nginx_secret_yaml="$nginx_yaml_dir/nginx-secret.yaml"
  nginx_deploy_yaml="$nginx_yaml_dir/nginx-deploy.yaml" 
  echo "kubectl apply -f $nginx_secret_yaml > /dev/null 2>&1" 
  echo "kubectl apply -f $nginx_deploy_yaml > /dev/null 2>&1" 
  exit 1 
} 

function create_cert {
  rm $KEY_FILE $CERT_FILE
  openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout ${KEY_FILE} -out ${CERT_FILE} -subj "/CN=${HOST}/O=${HOST}" -addext "subjectAltName = DNS:${HOST}"
  kubectl delete secret ${CERT_NAME}
  kubectl create secret tls ${CERT_NAME} --key ${KEY_FILE} --cert ${CERT_FILE}
}


####### main ##### 
KEY_FILE="/tmp/vnext.key"
CERT_FILE="/tmp/vnext.cert" 
CERT_NAME="toms-cert"
HOST=".local"
SECRET_NAME="nginx-tls-secret"

create_cert

