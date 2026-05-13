# ===========================
# Base images
# ===========================

FROM python:3.9-slim-bullseye AS base
LABEL maintainer=https://github.com/BioplatformsAustralia/bpaotu

# Create user + dirs
RUN addgroup --gid 1000 bioplatforms \
  && adduser --disabled-password --home /data --no-create-home --system -q --uid 1000 --ingroup bioplatforms bioplatforms \
  && mkdir /data /app \
  && chown bioplatforms:bioplatforms /data


FROM base AS runtime-deps

ENV \
  VIRTUAL_ENV=/env \
  PATH=/env/bin:$PATH \
  PROJECT_NAME=bpaotu \
  PROJECT_SOURCE=https://github.com/BioplatformsAustralia/bpaotu.git \
  DEPLOYMENT=prod \
  PRODUCTION=1 \
  DEBUG=0 \
  STATIC_ROOT=/data/static \
  WRITABLE_DIRECTORY=/data/scratch \
  MEDIA_ROOT=/data/static/media \
  LOG_DIRECTORY=/data/log \
  MONGO_DB_PREFIX=prod_ \
  DJANGO_SETTINGS_MODULE=bpaotu.settings \
  PYTHONUNBUFFERED=1

# Runtime deps
RUN apt-get update && apt-get install -y --no-install-recommends \
  gettext \
  libpcre3 \
  libpq5 \
  gdal-bin \
  libgeos-3.9.0 \
  libproj-dev \
  mime-support \
  unixodbc \
  && apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

RUN python3 -m venv $VIRTUAL_ENV

WORKDIR /app



# ===========================
# Build dependencies (shared)
# ===========================

FROM runtime-deps AS build-deps

RUN apt-get update && apt-get install -y --no-install-recommends \
  build-essential \
  git \
  libpcre3-dev \
  libpq-dev \
  libssl-dev \
  libyaml-dev \
  libxml2-dev \
  libxslt1-dev \
  libcairo2-dev \
  pkg-config \
  openssh-client \
  zlib1g-dev \
  curl \
  && apt-get clean && rm -rf /var/lib/apt/lists/*



# =========================
# Development image
# =========================
FROM build-deps AS dev

# For dev we use root so we can shell in and do evil things
USER root
WORKDIR /app

# Runtime args, don't re-use build time args
ENV PRODUCTION=0 DEBUG=1

# Install Python dependencies
# Use separate layers so that pip doesn't need to solve one giant dependency graph
COPY requirements /tmp/requirements
RUN pip install --no-cache-dir --upgrade -r /tmp/requirements/dev-requirements.txt
RUN pip install --no-cache-dir --upgrade -r /tmp/requirements/test-requirements.txt
RUN pip install --no-cache-dir --upgrade -r /tmp/requirements/runtime-requirements.txt
RUN pip install --no-cache-dir --upgrade -r /tmp/requirements/biom-requirements.txt

# Install KronaTools
## done locally; see README.md

# Copy source
COPY bpaotu/ /app/bpaotu

# Editable install
RUN pip install --no-cache-dir -e /app/bpaotu

# Copy entrypoint script
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 8000 8080 9000 9001 9100 9101
VOLUME ["/app", "/data"]

ENV HOME=/data
WORKDIR /data

ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["runserver_plus"]



# =========================
# Production image
# =========================
FROM build-deps AS prod

ARG BUILD_VERSION

# Install Python dependencies
COPY requirements /tmp/requirements

RUN pip install --no-cache-dir --upgrade \
  -r /tmp/requirements/runtime-requirements.txt \
  -r /tmp/requirements/biom-requirements.txt

# Copy source
COPY bpaotu/ /app/bpaotu

# Install app
RUN pip install --no-cache-dir /app/bpaotu

# Install KronaTools
RUN git clone https://github.com/marbl/Krona.git /app/krona \
  && cd /app/krona \
  && git checkout v2.8.1 \
  && cd KronaTools \
  && ./install.pl --prefix /app/krona

# Prepare data dir
RUN mkdir -p /data \
  && chown bioplatforms:bioplatforms /data

# Copy uwsgi config
COPY uwsgi/ /app/uwsgi/

# Copy entrypoint script
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 9000 9100 9101
VOLUME ["/data"]

# Drop privileges, set home for bioplatforms
USER bioplatforms
ENV HOME=/data
WORKDIR /data

ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["uwsgi"]



# =========================
# Worker image
# =========================
FROM base AS worker

# System packages
# git; required for pip packages on github
# ncbi-blast+; required for BLAST search
RUN apt-get update && apt-get install -y --no-install-recommends \
  git \
  ncbi-blast+ \
  && apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*;

WORKDIR /app

COPY ./requirements/worker-requirements.txt /app/bpaotu/
RUN pip install --no-cache-dir --upgrade -r bpaotu/worker-requirements.txt

# Copy source
COPY bpaotu/ /app/bpaotu

# Copy entrypoint script
COPY docker-worker-entrypoint.sh /app/docker-worker-entrypoint.sh
RUN chmod +x /app/docker-worker-entrypoint.sh

# Notes:
# Don't set HOME to /app because other containers used /data as home

# Switch to non-root user
USER bioplatforms

# Run the celery worker when container starts
# Default CMD provided for docker compose (puppet runs command explicitly)
ENTRYPOINT ["/app/docker-worker-entrypoint.sh"]
CMD ["celery_worker"]
