#!/bin/bash

set -e

## For now combine old bioplatforms dev and prod build until have time to create simpler Docker setup
#
# Development build and tests
#
whoami
ls -lhrta
ls -lhrta /home/circleci/project
ls -lhrta /home/circleci/project/build
echo "pre-dev BUILD_VERSION is ${BUILD_VERSION}"
# bioplatforms-composer runs as this UID, and needs to be able to
# create output directories within it
mkdir -p data/ build/
sudo chown 1000:1000 data/ build/
cp .env .env_local

eval `cat ~/sudo` docker-compose -f docker-compose-build.yml build base
eval `cat ~/sudo` docker-compose -f docker-compose-build.yml build builder

#
# Production (deployable) build and tests
#
echo "pre-prod BUILD_VERSION is ${BUILD_VERSION}"
echo "pwd is `pwd`"
eval `cat ~/sudo` docker run --rm -v /Users/matthewmulholland/apps/projects/circleci/project/build:/build -v /Users/matthewmulholland/apps/projects/circleci/project/frontend:/frontend node:latest ls -lhrta /frontend
eval `cat ~/sudo` docker run --rm -v /Users/matthewmulholland/apps/projects/circleci/project/build:/build -v /Users/matthewmulholland/apps/projects/circleci/project/frontend:/frontend node:latest bash /frontend/prodbuild.sh

./develop.sh run-builder checkout
./develop.sh run-builder releasetarball
sudo chown -R 1000 build
#./develop.sh build prod
#./develop.sh push prod
echo "post-prod BUILD_VERSION is ${BUILD_VERSION}"

#
# Extra for circleCI running from tags not branches and following pattern in docker-bpa-ckan which now has no dependency on bioplatoforms-compose
#

docker build -t bioplatformsaustralia/${DOCKER_NAME}:latest .
#docker push bioplatformsaustralia/${DOCKER_NAME}
#if [ x"$GIT_TAG" != x"" ]; then
#  docker tag bioplatformsaustralia/${DOCKER_NAME}:latest bioplatformsaustralia/${DOCKER_NAME}:${GIT_TAG}
#  docker push bioplatformsaustralia/${DOCKER_NAME}:${GIT_TAG}
#fi
