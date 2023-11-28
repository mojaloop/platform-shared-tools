#!/usr/bin/env bash

function set_cluster_name {
    # the eks-setup/eks.tf uses the name and environment from the env.hcl and 
    # creates a cluster name of name-evironment-cluster 
    name=`grep ^name $TF_VAR_FILE | cut -d "=" -f2 | tr -d " " | tr -d "\""`
    environment=`grep ^environment $TF_VAR_FILE | cut -d "=" -f2 | tr -d " " | tr -d "\""`

    # Construct the CLUSTER_NAME variable
    CLUSTER_NAME="${name}-${environment}-cluster"
}

## main ## 
TF_VAR_FILE="$TERRAFORM_CLUSTER_DIR/env.hcl" 
region=`grep region $TF_VAR_FILE | cut -d "=" -f2 | tr -d "\"" | tr -d " "`
set_cluster_name
echo "region is $region"
echo "cluster_name=$CLUSTER_NAME"
echo "terraform sets cluster_name to ${name}-${environment}-cluster using env.hcl" 

aws eks --region $region update-kubeconfig --name $CLUSTER_NAME
