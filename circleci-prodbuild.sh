#!/bin/bash

set -e

echo "GIT BRANCH is: '${GIT_BRANCH}'"
echo "BUILD VERSION is: '${BUILD_VERSION}'"

# build and push the runserver image
docker-compose -f docker-compose-build.yml build prod

# tag the prod image with latest, prod, and the build version; only push prod derived images
docker tag bioplatformsaustralia/${PROJECT_NAME}:prod \
           bioplatformsaustralia/${PROJECT_NAME}:latest

docker tag bioplatformsaustralia/${PROJECT_NAME}:prod \
           bioplatformsaustralia/${PROJECT_NAME}:${BUILD_VERSION}

docker push bioplatformsaustralia/${PROJECT_NAME}:latest
docker push bioplatformsaustralia/${PROJECT_NAME}:${BUILD_VERSION}

# build and push the worker image
docker-compose -f docker-compose-build.yml build worker

docker tag bioplatformsaustralia/${PROJECT_NAME}-worker:latest bioplatformsaustralia/${PROJECT_NAME}-worker:${BUILD_VERSION}
docker push bioplatformsaustralia/${PROJECT_NAME}-worker
docker push bioplatformsaustralia/${PROJECT_NAME}-worker:${BUILD_VERSION}

# build and push the frontend image
docker-compose -f docker-compose-build.yml build frontend

# tag the prod image with latest, prod, and the build version; only push prod derived images
docker tag bioplatformsaustralia/${PROJECT_NAME}-frontend:prod \
           bioplatformsaustralia/${PROJECT_NAME}-frontend:latest

docker tag bioplatformsaustralia/${PROJECT_NAME}-frontend:prod \
           bioplatformsaustralia/${PROJECT_NAME}-frontend:${BUILD_VERSION}

docker push bioplatformsaustralia/${PROJECT_NAME}-frontend
docker push bioplatformsaustralia/${PROJECT_NAME}-frontend:${BUILD_VERSION}
