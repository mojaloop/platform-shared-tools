#!/usr/bin/env bash
# install.sh
#    - top level script for Mojaloop vNext installation 
# refer : @#see @https://github.com/mojaloop/platform-shared-tools            
# Author Tom Daly 
# Date Sept 2023

################################################################################
# Function: showUsage
################################################################################
function showUsage {
echo  "USAGE: $0  -m <mode> 
Example 1 : $0 -m install_ml  # install mojaloop (vnext) in mini-loop mode
Example 2 : $0 -m delete_ml   # delete  mojaloop (vnext) in mini-loop mode
Example 3 : $0 -m install_eks # install mojaloop (vnext) in EKS mode
Example 3 : $0 -m delete_eks  # delete  mojaloop (vnext) in EKS mode

Options:
-m mode ............ install_ml|delete_ml|install_eks|delete_eks 
-h|H ............... display this message
"
	fi
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
  echo "install mini-loop k3s "
elif [[ "$mode" == "delete_ml" ]]; then
  echo "delete mini-loop k3s " 
else 
  printf "** Error : wrong value for -m ** \n\n"
  showUsage
  exit 1
fi 