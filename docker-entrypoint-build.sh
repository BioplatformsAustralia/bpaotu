#!/bin/bash

info () {
    printf "\r  [\033[00;34mINFO\033[0m] %s\n" "$1"
}

trap exit SIGHUP SIGINT SIGTERM
env | grep -iv PASS | sort

if [ "$1" = 'checkout' ]; then
    info "[Run] Clone the source code"
    info "BUILD_VERSION ${BUILD_VERSION}"
    info "PROJECT_SOURCE ${PROJECT_SOURCE}"

    set -e
    rm -rf "/data/app/"
    mkdir "/data/app/"

    # clone and install the app
    set -x
    cd /data/app
    git clone --depth=1 --branch="${GIT_TAG}" "${PROJECT_SOURCE}" .
    git rev-parse HEAD > .version
    cat .version
    exit 0
fi

# prepare a tarball of build
if [ "$1" = 'releasetarball' ]; then
    info "[Run] Preparing a release tarball"
    info "BUILD_VERSION ${BUILD_VERSION}"
    info "PROJECT_SOURCE ${PROJECT_SOURCE}"

    # extract frontend assets into static directory so they can be served out
    echo "** extracting frontend assets **"
    ( cd /data/app/bpaotu/bpaotu/static/bpaotu && tar xzvf /data/frontend.tgz )

    cd /data/app
    pip install --upgrade -r requirements/runtime-requirements.txt
    pip install --upgrade -r requirements/biom-requirements.txt
    pip install --upgrade -r bpa-ingest/requirements.txt
    ls -l
    cd "${PROJECT_NAME}" && pip install .
    cd "bpa-ingest" && pip install .

    set +x

    cd /data

    rm -rf env
    cp -rp /env .

    # vars for creating release tarball
    ARTIFACTS="env
               app/docker-entrypoint.sh
               app/uwsgi
               app/${PROJECT_NAME}"
    TARBALL="/data/${PROJECT_NAME}-${BUILD_VERSION}.tar"
    # shellcheck disable=SC2037
    TAR_OPTS="--exclude-vcs
              --exclude=app/bpaotu/bpaotu/frontend/*
              --verify
              --checkpoint=1000
              --checkpoint-action=dot
              --create
              --preserve-permissions"

    info "ARTIFACTS ${ARTIFACTS}"
    info "TARBALL ${TARBALL}"

    set -x
    # shellcheck disable=SC2086
    rm -f "${TARBALL}" && tar ${TAR_OPTS} -f "${TARBALL}" ${ARTIFACTS}
    set +x
    info "$(ls -lath "${TARBALL}")"
    rm -f "${TARBALL}.gz" && gzip "${TARBALL}"
    info "$(ls -lath "${TARBALL}.gz")"
    exit 0
fi

info "[RUN]: Builtin command not provided [checkout|releasetarball]" info "[RUN]: $*"

exec "$@"
