#!/usr/bin/env bash
# Push docker image to AWS ECR
# Should be run in the project root
source scripts/variables.sh

aws ecr get-login-password | docker login --username AWS --password-stdin $CONTAINER_REGISTRY

COMMAND="docker push $CONTAINER_REGISTRY/$NAME_AND_VERSION_TAG"
echo $COMMAND
eval $COMMAND

# Push latest if the branch is $PRODUCTION_BRANCH
if [ "$BRANCH_NAME" == "$PRODUCTION_BRANCH" ]; then
  COMMAND="docker push $CONTAINER_REGISTRY/$IMAGE_NAME:latest"
  echo $COMMAND
  eval $COMMAND
fi