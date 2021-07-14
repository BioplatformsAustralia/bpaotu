#!/bin/bash

set -e 

chown -R root:root /frontend

whoami

mkdir -p /frontend/node_modules/@babel/code-frame/

ls -lhrta /
ls -lhrta /frontend
echo "cache..."
ls -lhrta /usr/local/share/.cache/yarn/
cd /frontend

# run production build (under travis)
yarn cache clean --all
yarn install --force
yarn build

cd /frontend/build && tar czvf /build/frontend.tgz .
