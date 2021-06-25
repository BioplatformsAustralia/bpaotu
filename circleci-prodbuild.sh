#!/bin/bash

set -e

## For now combine old bioplatforms dev and prod build until have time to create simpler Docker setup
#
# Development build and tests
#
echo "pre-dev BUILD_VERSION is ${BUILD_VERSION}"
# bioplatforms-composer runs as this UID, and needs to be able to
# create output directories within it
mkdir -p data/ build/
sudo chown 1000:1000 data/ build/
cp .env .env_local

./develop.sh build base
./develop.sh build builder
./develop.sh build dev
./develop.sh run build lint

#
# Production (deployable) build and tests
#
echo "pre-prod BUILD_VERSION is ${BUILD_VERSION}"
docker run --rm -v $(pwd)/build:/build -v $(pwd)/frontend:/frontend node:latest bash /frontend/prodbuild.sh

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
docker push bioplatformsaustralia/${DOCKER_NAME}
if [ x"$GIT_TAG" != x"" ]; then
  docker tag bioplatformsaustralia/${DOCKER_NAME}:latest bioplatformsaustralia/${DOCKER_NAME}:${GIT_TAG}
  docker push bioplatformsaustralia/${DOCKER_NAME}:${GIT_TAG}
fi
