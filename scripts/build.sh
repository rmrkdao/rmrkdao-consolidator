#!/usr/bin/env bash
# Should be run in the project root
source scripts/variables.sh

set -e

if [ ! -z "$(git diff)" ]; then
  echo "There are uncommitted changes. Please commit or stash them before running this script."
  exit 1
fi

echo "Setting up testing environment..."

./scripts/setup-test-env.sh

LATEST_TAG="$IMAGE_NAME:latest"

echo "Building docker image with tag '$LATEST_TAG'" 

COMMAND="docker build . -t $LATEST_TAG $@"

echo "Executing command: $COMMAND"

eval $COMMAND

echo "Cleaning up testing environment..."

./scripts/teardown-test-env.sh