#!/bin/bash

set -e

docker-compose -f docker-compose-build.yml build base

echo "building and archiving frontend..."
docker create -v /build -v /frontend --name fend node:latest /bin/true
docker cp frontend fend:/
docker run --volumes-from fend --name fend-archive node:latest bash /frontend/prodbuild.sh
mkdir ./build
docker cp fend-archive:/build .
docker rm fend && docker rm fend-archive

docker-compose -f docker-compose-build.yml build builder

echo "Retrieving prod-build archive..."
docker create --name prod-archive bioplatformsaustralia/bpaotu-builder /bin/true
docker cp prod-archive:/data/${PROJECT_NAME}-${BUILD_VERSION}.tar.gz ./build/
docker rm prod-archive

eval docker-compose -f docker-compose-build.yml build prod

docker push bioplatformsaustralia/${DOCKER_NAME}
if [ x"$GIT_TAG" != x"" ]; then
  docker tag bioplatformsaustralia/${DOCKER_NAME}:latest bioplatformsaustralia/${DOCKER_NAME}:${GIT_TAG}
  docker push bioplatformsaustralia/${DOCKER_NAME}:${GIT_TAG}
fi
