#!/bin/sh
set -e

# Run yarn inside a node container, forwarding arguments from the host.
# Usage examples from `frontend/`:
#   ./container-yarn.sh install
#   ./container-yarn.sh add lodash@4.17.21

# Make sure the node version in the container matches the version specified in package.json and frontend/Dockerfile

docker run --rm -v "$PWD":/frontend -w /frontend node:22-alpine \
  sh -c "if command -v yarn >/dev/null 2>&1; then yarn $*; else npm install -g yarn && yarn $*; fi && chown -R $(id -u):$(id -g) /frontend"
