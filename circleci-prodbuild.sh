#!/bin/bash

set -e

mkdir -p ./data ./build

pwd

docker-compose -f docker-compose-build.yml build base

docker run --rm -v /home/circleci/project/build:/build -v /home/circleci/project/frontend:/frontend node:latest bash /frontend/prodbuild.sh

docker-compose -f docker-compose-build.yml build builder

docker-compose -f docker-compose-build.yml run --rm builder

eval docker-compose -f docker-compose-build.yml build prod

#docker push bioplatformsaustralia/${DOCKER_NAME}
#if [ x"$GIT_TAG" != x"" ]; then
#  docker tag bioplatformsaustralia/${DOCKER_NAME}:latest bioplatformsaustralia/${DOCKER_NAME}:${GIT_TAG}
#  docker push bioplatformsaustralia/${DOCKER_NAME}:${GIT_TAG}
#fi
