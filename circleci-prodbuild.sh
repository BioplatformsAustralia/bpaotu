#!/bin/bash

set -e

mkdir -p data/ build/

eval `cat ~/sudo` docker-compose -f docker-compose-build.yml build base

eval `cat ~/sudo` docker run --rm -v /Users/matthewmulholland/apps/projects/circleci/project/build:/build -v /Users/matthewmulholland/apps/projects/circleci/project/frontend:/frontend node:latest bash /frontend/prodbuild.sh

eval `cat ~/sudo` docker-compose -f docker-compose-build.yml build builder

## mount the archive for prod use
eval `cat ~/sudo` docker-compose -f docker-compose-build.yml run --rm builder

eval `cat ~/sudo` docker-compose -f docker-compose-build.yml build prod

#docker push bioplatformsaustralia/${DOCKER_NAME}
#if [ x"$GIT_TAG" != x"" ]; then
#  docker tag bioplatformsaustralia/${DOCKER_NAME}:latest bioplatformsaustralia/${DOCKER_NAME}:${GIT_TAG}
#  docker push bioplatformsaustralia/${DOCKER_NAME}:${GIT_TAG}
#fi
