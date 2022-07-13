#!/usr/bin/env bash
# Should be run in the project root
source scripts/variables.sh

LATEST_TAG="$IMAGE_NAME:latest"
VERSION_REMOTE_REGISTRY_TAG="$CONTAINER_REGISTRY/$NAME_AND_VERSION_TAG"

printf "Tagging latest docker image with tags \n\t- '$VERSION_REMOTE_REGISTRY_TAG'\n" 

docker tag $LATEST_TAG $VERSION_REMOTE_REGISTRY_TAG

# Tag as latest if the branch is $PRODUCTION_BRANCH
if [ "$BRANCH_NAME" == "$PRODUCTION_BRANCH" ]; then
  LATEST_REMOTE_REGISTRY_TAG="$CONTAINER_REGISTRY/$IMAGE_NAME:latest"
  printf "\t- '$LATEST_REMOTE_REGISTRY_TAG'\n"
  docker tag $LATEST_TAG $LATEST_REMOTE_REGISTRY_TAG
fi
