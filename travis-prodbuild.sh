#!/bin/bash

set -e

#
# Production (deployable) build and tests
#

if [ x"$BRANCH_NAME" != x"master" -a x"$BRANCH_NAME" != x"next_release" ]; then
    echo "Branch $BRANCH_NAME is not deployable. Skipping prod build and tests"
    exit 0
fi

./develop.sh run-builder checkout
./develop.sh run build node
./develop.sh run-builder releasetarball
./develop.sh build prod
./develop.sh push prod
