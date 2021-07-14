#!/bin/bash

set -e 

ls -lhrta /
ls -lhrta /frontend

cd /frontend

# run production build (under travis)
yarn cache clean --all
yarn install --force
yarn build

cd /frontend/build && tar czvf /build/frontend.tgz .
