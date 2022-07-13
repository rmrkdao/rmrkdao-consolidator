#!/usr/bin/env bash
# Should be run in the project root

set -e # TODO: Consider upgrading this script to use the advice from this SO post: https://stackoverflow.com/a/19622569/6010889

source scripts/variables.sh

docker stop $TEST_CONTAINER_NAME