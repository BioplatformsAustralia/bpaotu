#!/bin/bash

set -e 

cd /frontend

# run production build (under travis)
yarn clean
yarn install
yarn build

cd /frontend/build && tar czvf /build/frontend.tgz .
