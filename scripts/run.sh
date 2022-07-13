#!/usr/bin/env bash
# Should be run in the project root
source scripts/variables.sh

TAG="$IMAGE_NAME:latest"

echo "Running docker image '$TAG'" 

COMMAND="docker run -it --rm --name rmrk-dao-consolidator --env-file=.env $TAG $@"

echo "Executing command: $COMMAND"

eval $COMMAND