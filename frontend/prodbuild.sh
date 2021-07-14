#!/bin/bash

set -e 

cd /frontend

# run production build (under travis)
yarn cache clean
yarn install
yarn build

cd /frontend/build && tar czvf /build/frontend.tgz .
