#!/bin/bash

set -e

docker-compose -f docker-compose-build.yml build base

## circleci remote-docker does not allow for use of volumes
echo "building and archiving frontend..."
docker create -v /build -v /frontend --name fend node:latest /bin/true
docker cp frontend fend:/
docker run --volumes-from fend --name fend-archive node:latest bash /frontend/prodbuild.sh
mkdir ./build
docker cp fend-archive:/build .
docker rm fend && docker rm fend-archive

docker-compose -f docker-compose-build.yml build builder

## circleci remote-docker does not allow for use of volumes
echo "Retrieving prod-build archive..."
docker create --name prod-archive bioplatformsaustralia/bpaotu-builder /bin/true
docker cp prod-archive:/data/${PROJECT_NAME}-${BUILD_VERSION}.tar.gz ./build/
docker rm prod-archive

eval docker-compose -f docker-compose-build.yml build prod

docker push bioplatformsaustralia/${PROJECT_NAME}
docker tag bioplatformsaustralia/${PROJECT_NAME}:latest bioplatformsaustralia/${PROJECT_NAME}:${BUILD_VERSION}
docker push bioplatformsaustralia/${PROJECT_NAME}:${BUILD_VERSION}
