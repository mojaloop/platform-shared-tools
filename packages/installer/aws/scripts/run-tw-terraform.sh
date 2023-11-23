#!/usr/bin/env bash
# script to run the Terraform from Thitsaworks so as to create an EKS cluster
# Nov 2023 
# Author Tom Daly 


# Function to display usage information
usage() {
    echo "Usage: $0 [OPTION] [DIRECTORY]"
    echo "Deploy and manage Terraform configurations for EKS infrastructure."
    echo "Options:"
    echo "  --apply        Apply Terraform configurations."
    echo "  --destroy      Destroy Terraform resources."
    echo "  -h, --help     Display this help and exit."
    exit 1
}

function configure_kubectl {
  printf "==> configuring kubectl access to cluster...    "
  # Store the current directory
  local current_dir=$(pwd)
  cd $TF_TOP_DIR/eks-setup
  local region=`grep region $TF_TOP_DIR/env.hcl | cut -d "=" -f2 | tr -d "\"" | tr -d " "`
  local cluster=`terraform output -raw cluster_name`
  aws eks --region $region update-kubeconfig --name $(terraform output -raw cluster_name) > /dev/null 2>&1 
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

# Function to run Terraform commands
run_terraform() {
    local directory="$1"
    local action="$2"

    # Store the current directory
    local current_dir=$(pwd)

    # Change to the specified directory
    cd "$directory" || { echo "Error: Unable to change directory to $directory. Exiting..."; exit 1; }
    
    # Initialize Terraform
    echo "directory is $directory"
    terraform_init_config=" --backend-config=../backend/backend.hcl"
    if [ `basename "$directory"` == "eks-setup" ] || [ `basename "$directory"`  == "addons" ]; then
        terraform init $terraform_init_config
    else
        terraform init
    fi

    # Run Terraform command based on the specified action
    if [ "$action" == "apply" ]; then
        # Run Terraform plan with the common HCL configuration file and output to a plan file
        echo "==============================================================================="
        echo "INFO: Running Terraform plan for $directory..."
        echo "==============================================================================="
        terraform plan -out=tfplan "$TF_VAR_FILE"
        
        # Check for errors in the plan
        if [ $? -eq 0 ]; then
            # Apply the Terraform plan
            echo "==============================================================================="
            echo "INFO: Applying Terraform plan for $directory..."
            echo "==============================================================================="
            terraform apply tfplan -compact-warnings
        else
            echo "Error: Terraform plan failed. Exiting..."
            exit 1
        fi
        if [ `basename "$directory"` == "eks-setup" ]; then 
            configure_kubectl 
        fi 
    elif [ "$action" == "destroy" ]; then
        # Run Terraform destroy with the common HCL configuration file and auto-approve
        echo "==============================================================================="
        echo "INFO: Destroying Terraform resources for $directory..."
        echo "==============================================================================="
        terraform destroy --auto-approve "$TF_VAR_FILE"
    else
        echo "Error: Invalid action specified. Use '--apply' for apply or '--destroy' for destroy."
        exit 1
    fi

    # Return to the original directory
    cd "$current_dir" || exit 1
}


################################################################################
# MAIN
################################################################################
EKS_SCRIPTS_DIR="$( cd $(dirname "$0") ; pwd )"
echo "EKS_SCRIPTS_DIR = $EKS_SCRIPTS_DIR"
REPO_BASE_DIR="$( cd $(dirname "$MINI_LOOP_SCRIPTS_DIR")/../../.. ; pwd )"
echo "REPOSITORY_BASE_DIR = $REPO_BASE_DIR"

# Set the top-level directory
# TODO set this properly once Thitsaworks terraform is integrated into platform-shared-tools
TF_TOP_DIR="/home/ubuntu/eks-iac/Terraform"

# Common HCL configuration file
TF_VAR_FILE="--var-file=$TF_TOP_DIR/env.hcl"

# Declare a global list of terraform subdirectories
TF_SUB_DIRS=("backend" "eks-setup" "addons")


# Check for valid input parameters
if [ "$#" -eq 0 ]; then
    usage
fi


while [ "$#" -gt 0 ]; do
    case "$1" in
        "--apply") 
            shift
            if [ -n "$1" ]; then
                run_terraform "$TF_TOP_DIR/$1" "apply"
            else
                # Process all directories for apply
                for dir in "${TF_SUB_DIRS[@]}"; do
                    run_terraform "$TF_TOP_DIR/$dir" "apply"
                done
            fi
            ;;
        "--destroy")
            shift
            if [ -n "$1" ]; then
                run_terraform "$TF_TOP_DIR/$1" "destroy"
            else
                # Process all directories for destroy in reverse order
                for ((i=${#TF_SUB_DIRS[@]}-1; i>=0; i--)); do
                    echo "directory is $TF_TOP_DIR/${TF_SUB_DIRS[$i]}"
                    run_terraform "$TF_TOP_DIR/${TF_SUB_DIRS[$i]}" "destroy"
                done
            fi
            ;;
        "-h" | "--help")
            usage
            ;;
        *)
            echo "Error: Invalid option. Use '-h' or '--help' for usage information."
            exit 1
            ;;
    esac
    shift
done
