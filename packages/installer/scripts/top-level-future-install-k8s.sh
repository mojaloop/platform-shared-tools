#!/usr/bin/env bash
# install.sh
#    - top level script for Mojaloop vNext installation 
# refer : @#see @https://github.com/mojaloop/platform-shared-tools            
# Author Tom Daly 
# Date Sept 2023

################################################################################
# Function: showUsage
################################################################################
# Description:		Display usage message
# Arguments:		none
# Return values:	none
#
function showUsage {
  # echo "$#"
	# if [ $# -lt 1 ] ; then

	# 	echo "Incorrect number of arguments passed to function $0"
	# 	exit 1
	# else
echo  "USAGE: $0 -a <action> -m <mode> 
Example 1 : $0 -m install_ml  # install kubernetes mini-loop mode (k3s) 
Example 2 : $0 -m delete_ml   # delete kubernetes mini-loop mode (k3s) 
Example 3 : $0 -m install_eks # install kubernetes EKS mode
Example 4 : $0 -m delete_eks  # delete  kubernetes EKS mode

Options:
-m mode ............ install_ml|delete_ml|install_eks|delete_eks 
-h|H ............... display this message
"
#	fi
}

################################################################################
# MAIN
################################################################################

# Process command line options as required
while getopts "m:hH" OPTION ; do
   case "${OPTION}" in
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

if [[ "$mode" == "install_ml" ]]; then
  echo "install local k8s cluster i.e. setup for mini-loop mode "
elif [[ "$mode" == "delete_ml" ]]; then
  echo "delete mini-loop k3s" 
elif [[ "$mode" == "install_eks" ]]; then
  echo "install EKS cluster" 
elif [[ "$mode" == "delete_eks" ]]; then
  echo "delete eks cluster" 
else 
  printf "** Error : wrong value for -m ** \n\n"
  showUsage
  exit 1
fi 