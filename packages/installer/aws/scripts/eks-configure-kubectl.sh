#!/usr/bin/env bash

#TERRAFORM_RUN_DIR="/terraform/$TERRAFORM_CLUSTER_DIR"  # TERRFORM_CLUSTER_DIR should already be set in the environment of the container
cd $TERRAFORM_CLUSTER_DIR

aws eks --region $(terraform output -raw region) update-kubeconfig \
    --name $(terraform output -raw cluster_name)
