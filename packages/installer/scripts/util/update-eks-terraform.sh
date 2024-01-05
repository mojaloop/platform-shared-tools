#!/usr/bin/env bash
# update-eks-terraform.sh 
#   - update the terraform for building the EKS cluster from the GitHub repo where the Mojaloop vNext team
#     is collaborating with Thitsaworks on its development. 

# set some directory variables to enable navigation
SCRIPT_DIR="$( cd $(dirname "$0") ; pwd )"
echo "SCRIPT_DIR = $SCRIPT_DIR"
REPO_BASE_DIR="$( cd $(dirname "$SCRIPT_DIR")/../../.. ; pwd )"
echo "REPOSITORY_BASE_DIR = $REPO_BASE_DIR"
EKS_TF_DIR=$REPO_BASE_DIR/packages/installer/aws/terraform
echo "EKS TERRAFORM DIRECTORY= $EKS_TF_DIR"
#  terraform subdirectories
TF_SUB_DIRS=("backend" "eks-setup" "addons")

# clone the ThisaX eks-iac repo and the vnext_br
# note in the future we should probably have a defined release to use
cd /tmp
rm -rf eks-iac
git clone https://github.com/ThitsaX/eks-iac.git
cd /tmp/eks-iac
git fetch origin vnext_br
git checkout vnext_br

# copy aside the env.hcl file before we start to copy in the Thitsaworks terraform
cp $EKS_TF_DIR/eks/env.hcl /tmp


# now because we don't want to clone or copy one git repo into another we copy the specific directories into the 
# Mojaloop vNext repo 
#echo "rm -rf $EKS_TF_DIR/*" 

for dir in "${TF_SUB_DIRS[@]}"; do
    rm -rf $EKS_TF_DIR/eks/$dir
    cp -r Terraform/$dir $EKS_TF_DIR/eks
done
ls $EKS_TF_DIR/eks

# restore the env.hcl file 
cp /tmp/env.hcl $EKS_TF_DIR/eks




