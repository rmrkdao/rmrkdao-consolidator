#!/usr/bin/env bash
# Should be run in the project root
source scripts/.env

# Get the current branch name
BRANCH_NAME=$CI_COMMIT_BRANCH
if [ -z "$BRANCH_NAME" ]; then
  BRANCH_NAME=$(git rev-parse --abbrev-ref HEAD)
fi
export BRANCH_NAME=$BRANCH_NAME

# Exit if no branch name is provided
if [ -z "$BRANCH_NAME" ]; then
  echo "Branch name required"
  exit 1
fi

export IMAGE_NAME=$(jq -r .name package.json)
export VERSION=$(git describe --match "v[0-9]*")
export NAME_AND_VERSION_TAG="$IMAGE_NAME:$VERSION"
export PRODUCTION_BRANCH=main
export TEST_CONTAINER_NAME=rmrkdao_test_db