#!/bin/bash
set -a # Enable allexport

########################################################################################
## Shared functions
########################################################################################

function printHeader() {
    echo -e "\n********************************************************************************"
    echo -e "${1}"
    echo -e "********************************************************************************"
}

function testEnv(){
    if [[ -z "${CIRCLE_BRANCH}" ]]; then
        echo -e "\e[93mEnvironment variable CIRCLE_BRANCH is not set. Exiting.\e[0m"
        exit 1
    fi

    if [[ -z "${CIRCLE_SHA1}" ]]; then
        echo -e "\e[93mEnvironment variable CIRCLE_SHA1 is not set. Exiting.\e[0m"
        exit 1
    fi

    if [[ -z "${CIRCLE_TOKEN}" ]]; then
        echo -e "\e[93mEnvironment variable CIRCLE_TOKEN is not set. Exiting.\e[0m"
        exit 1
    fi

    if [[ -z "${CIRCLE_PROJECT_REPONAME}" ]]; then
        echo -e "\e[93mEnvironment variable CIRCLE_PROJECT_REPONAME is not set. Exiting.\e[0m"
        exit 1
    fi

    if [[ -z "${CIRCLE_PROJECT_USERNAME}" ]]; then
        echo -e "\e[93mEnvironment variable CIRCLE_PROJECT_USERNAME is not set. Exiting.\e[0m"
        exit 1
    fi

    echo -e "Provided CI Build branch: \t\t${CIRCLE_BRANCH}"
    echo -e "Provided CI Build commit hash: \t\t${CIRCLE_SHA1}"
    echo -e "Provided CI Build username: \t\t${CIRCLE_PROJECT_USERNAME}"
    echo -e "Provided project repository name: \t${CIRCLE_PROJECT_REPONAME}"

    if ! command -v curl &> /dev/null; then
        echo -e "\e[93m'curl' is not installed, cannot continue.\e[0m"
        exit 2
    fi

    if ! command -v jq &> /dev/null; then
        echo -e "\e[93m'jq' is not installed, cannot continue.\e[0m"
        exit 2
    fi

    echo -e "Node.js version is: \t\t\t$(node --version)"
}


#
# publishes COMMITS_SINCE_LAST_CI_BUILD and LAST_CI_BUILD_COMMIT
#
function loadCommits(){
    echo -e "\nFetching last successful build from CircleCI API...."
    # Note: we're trying to find the last item with either "success" or "not_run" status,
    # because we commit code at the end of the pipeline, we don't want the last commit that triggered the build, rather the last one that was processed by the CI/CD successfully
    # detail: when we push the git changes with the tags and version bumps at the end of this script, we use skip ci, that entry in cicd will have a not_run status
    #LAST_CI_BUILD_COMMIT=$(curl -s --header "Authorization: Basic $CIRCLE_TOKEN" https://circleci.com/api/v1.1/project/gh/$CIRCLE_PROJECT_USERNAME/$CIRCLE_PROJECT_REPONAME\?\&limit\=10 | jq -r 'first(.[] | select(.vcs_revision!="'${CIRCLE_SHA1}'" and .status=="success" or .status=="not_run")).vcs_revision')
    #SUCCESS=$?

    # new method using js and CircleCI v2 API - iterates all pipelines and child workflows in order
    LAST_CI_BUILD_COMMIT=$(node .circleci/getLastCommit.js --repo="$CIRCLE_PROJECT_REPONAME" --branch="$CIRCLE_BRANCH" --user="$CIRCLE_TOKEN")
    SUCCESS=$?

    if [[ ! SUCCESS -eq 0 ]]; then
        echo -e "\e[93mGet last commit failed, exiting.\e[0m"
        exit 2
    fi

    echo -e "\nLast successful CI Build commit hash: \t${LAST_CI_BUILD_COMMIT}"

    if [[ -z "${LAST_CI_BUILD_COMMIT}" ]]; then
        COMMITS_SINCE_LAST_CI_BUILD=$(git --no-pager log ${CIRCLE_SHA1} --pretty=format:%H)
    else
        COMMITS_SINCE_LAST_CI_BUILD=$(git --no-pager log ${LAST_CI_BUILD_COMMIT}..${CIRCLE_SHA1} --pretty=format:%H)
    fi
}

# packages require a package.json in the package directory
function detectChangedPackages(){
    PACKAGES=$(ls -l "${ROOT}" | grep ^d | awk '{print $9}')
    echo -e "Found these packages in this repository:"
    for PACKAGE in $PACKAGES; do
        echo -e " - ${PACKAGE}"
    done

    CHANGED_PACKAGES=""
    CHANGED_PACKAGES_COUNT=0

    #for PACKAGE in "${PACKAGES[@]}"; do
    for PACKAGE in $PACKAGES; do
        PACKAGE_PATH=${ROOT}/$PACKAGE
        PACKAGE_LAST_CHANGE_COMMIT_SHA=$(git --no-pager log -1 --format=format:%H --full-diff $PACKAGE_PATH)

        echo -e "\nChecking package: '${PACKAGE}' on path: ${PACKAGE_PATH}"

        if [[ ! -s "$PACKAGE_PATH/package.json" ]]; then
            echo -e "\tPackage does not have a package.json file - ignoring"
            continue
        fi

        echo -e "\tPackage last change commit: ${PACKAGE_LAST_CHANGE_COMMIT_SHA}"

        if [[ -z "$PACKAGE_LAST_CHANGE_COMMIT_SHA" ]] || [[ $COMMITS_SINCE_LAST_CI_BUILD == *"$PACKAGE_LAST_CHANGE_COMMIT_SHA"* ]]; then
            CHANGED_PACKAGES+="$PACKAGE "
            CHANGED_PACKAGES_COUNT=$((CHANGED_PACKAGES_COUNT + 1))
            echo -e "\tPackage changed since last CI build and has a package.json file - ADDING TO THE LIST of changed packages"
        else
            echo -e "\tPackage not changed since last CI build - IGNORING"
        fi
    done

}
