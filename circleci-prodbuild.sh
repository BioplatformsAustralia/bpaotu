#!/bin/bash

set -e

#
# Production (deployable) build and tests
#

docker build -t bioplatformsaustralia/${DOCKER_NAME}:latest .
docker push bioplatformsaustralia/${DOCKER_NAME}
if [ x"$GIT_TAG" != x"" ]; then
  docker tag bioplatformsaustralia/${DOCKER_NAME}:latest bioplatformsaustralia/${DOCKER_NAME}:${GIT_TAG}
  docker push bioplatformsaustralia/${DOCKER_NAME}:${GIT_TAG}
fi
