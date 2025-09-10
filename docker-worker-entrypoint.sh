#!/bin/bash
set -e

# as in docker-entrypoint
function info () {
    printf "\r  [\033[00;34mINFO\033[0m] %s\n" "$1"
}

# celery_worker entrypoint
if [ "$1" = 'celery_worker' ]; then
    info "[Run] Starting celery_worker"

    # activate conda environment and run celery
    source /opt/conda/etc/profile.d/conda.sh
    conda activate celeryenv

    set -x
    exec celery -A bpaotu worker --loglevel=info
fi

# fallback; run given command
exec "$@"
