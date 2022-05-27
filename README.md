# Bioplatforms Australia - Operational taxonomic unit (OTU) query system

BPA-OTU is a web-based portal into Operational Taxonomic Unit (OTU) data, developed to access data from the Australian Microbiome.


## System overview

* The backend is implemented in [Django](https://www.djangoproject.com/), but uses
  [SQLAlchemy](https://www.sqlalchemy.org/) for most database operations.
* The frontend is implemented in [React](https://reactjs.org/) and uses
  [Plotly](https://plotly.com/javascript/) for charts and
  [Leaflet](https://leafletjs.com/) for maps. It has its own webserver, separate from
  Django, which serves the React assets and also proxies requests from the user
  interface through to Django.
* In production, the system requires that the browser session be logged in to
  the configured [CKAN](https://docs.ckan.org/) instance (see settings.py). This
  is an administrative restriction, and the system doesn't require CKAN
  authentication for functionality.
* All data for the system is contained within a Postgres database which is
  loaded from a set of files by an ingest operation (see below). Some ancillary
  data may be fetched using the Python `ckanapi` (e.g. sample site images).
* It uses a git submodule `bpa-ingest`, maintained externally. It's important to
  update this submodule frequently in order to be able to ingest the latest
  version of the sample context metadata.
* For development, Django runs in a Docker container, while the frontend
  webserver is started from a shell prompt outside of the container. The
  container mounts `./` as a volume, which means that Django will monitor all of
  its *.py files and restart when they are updated outside of the container.
* The production instance is hosted at https://data.bioplatforms.com/
* For production, both Django and the frontend webserver run in Docker containers.
* Deployment into production from github is performed by [Bioplatforms Australia](
  https://bioplatforms.com/) using [CircleCI](https://circleci.com/)

## Development environment setup

* [Install docker and compose](https://docs.docker.com/compose/install/)
* `git clone --recurse-submodules` [https://github.com/BioplatformsAustralia/bpaotu.git](https://github.com/BioplatformsAustralia/bpaotu.git)
* Generate `./.env_local`. This should contain `KEY=value` lines. See `./.env`
  for keys. The values are beyond the scope of this README.
* `docker-compose -f docker-compose-build.yml build base dev`

## Input data

BPA-OTU loads input data to generate a PostgreSQL schema named `otu`. The
importer functionality completely erases all previously loaded data.

Three categories of file are ingested:

* contextual metadata (extension: `.xlsx` for Excel file [default] or `.db` for SQLite DB)
* taxonomy files (extension: `.taxonomy`)
* OTU abundance tables (extension: `.txt`)


By default the contextual metadata will be downloaded during the ingest
operation, or it can be provided as either

    /data/amd-metadata/amd-samplecontextual/*.db # sqlite database
    /data/amd-metadata/amd-samplecontextual/*.xlsx # Excel spreadsheet

See "Additional arguments" below. `/data` is a mount point in a Docker
container. See `./docker-compose.yml`

Abundance and taxonomy files must be placed under a base directory, structured
as follows:

    $dir/$amplicon_code/*[0-9].txt.gz
    $dir/$amplicon_code/*_20K.txt.gz
    $dir/$amplicon_code/*.$classifier_db.$classifier_method.taxonomy.gz

`$classifier_db` and `$classifier_method` describe the database and method used to
generate a given taxonomy. They can be arbitrary strings.

 The ingest is then run as a Django management command:

```console
cd ~/bpaotu # or wherever docker-compose.yml lives
docker-compose exec runserver bash

## Either ingest using local sqlite db file for contextual metadata...
root@05abc9e1ecb2:~# /app/docker-entrypoint.sh django-admin otu_ingest $dir $yyyy_mm_dd --use-sql-context --no-force-fetch

## or download contextual metadata and use that:
root@420c1d1e9fe4:~# /app/docker-entrypoint.sh django-admin otu_ingest $dir $yyyy_mm_dd
```

`$dir` is the base directory for the abundance and taxonomy files.

`$yyyy_mm_dd` is the ingest date .e.g. 2022-01-01

Additional arguments:
* --no-force-fetch: Add this to avoid fetch of contextual metadata file from server and instead use the one available in local folder (default: fetch from server)
* --use-sql-context: Add this to use contextual metadata file in format of SQLite DB instead of XLSX file (default: use XLSX file)



### Contextual Metadata

This file describes sample specific metadata. The current schema of the contextual metadata can be found [here](https://github.com/AusMicrobiome/contextualdb_doc/)

### Taxonomy files

A gzip-compressed tab-delimited file with extension `.taxonomy.gz`

The first row of this file must contain a header. The required header fields are:

```tsv
#OTU ID\tkingdom\tphylum\tclass\torder\tfamily\tgenus\tspecies\tamplicon\ttraits
```
or

```tsv
#OTU ID\tkingdom\tsupergroup\tdivision\tclass\torder\tfamily\tgenus\tspecies\tamplicon\ttraits

```

Each column value is an arbitrary character string, with the following restrictions:

* #OTU ID: a string describing the OTU (GATC string)
* kingdom...species: taxon as a text string, e.g., d_Bacteria
* amplicon: text string (e.g. 16S, A16S, 18S, ITS, ...)
* traits: text string (multiple traits are comma separated)

NB: Taxonomic ranks must be forward filled with last known field assignment if empty (e.g. d__bacteria, d__bacteria_unclassified, d__bacteria_unclassified, d__bacteria_unclassified, d__bacteria_unclassified, d__bacteria_unclassified, d__bacteria_unclassified)

### Abundance files

A gzip-compressed tab-delimited file with the extension `.txt.gz`

The first row is a header, with the following format:

```tsv
#OTU ID\tSample_only\tAbundance
```

Each column has the following format:

* #OTU ID:  text string, corresponding to the strings in the taxonomy file
* Sample_only [repeated]: the identifier for the sample ID for which this column specifies abundance
* Abundance [repeated]: the abundance (floating point) for the column's sample ID

## Development

Ensure a late version of both docker and docker-compose are available in your environment.

Bpaotu is available as a fully contained Dockerized stack. The dockerised stack are used for both production
and development. Appropriate configuration files are available depending on usage.

Note that for data ingestion to work you need passwords to the hosted data, these are available from BPA on request.
Set passwords in your environment, these will be passed to the container.

The steps to follow are basically those, above, for:
* Development environment setup
* Input Data

But in summary:

* Build images, source environment file (from one of the developers), and bring up containers
```
docker-compose -f docker-compose-build.yml build base dev
docker-compose up -d
```
* Build frontend and launch browser window to portal
```
cd frontend
yarn install
yarn start
```
* Get (data file from 1 of developers), unarchive and copy data to ./data/dev, and ingest data using today's date:
```
cd ./data/dev
tar -xvzf </path/to/dataarchive.tar.gz> ./
cd ~/bpaotu # or wherever docker-compose.yml lives
docker-compose exec runserver bash
### Also see  "Additional arguments" above
/app/docker-entrypoint.sh django-admin otu_ingest /data/2019-02 2021-08-02
```
NB: In example above,
* /data/2019-02: location of the data folder
* 2021-08-02: today's date


## Deployments

[Bioplatforms Australia - Australian Microbiome Search Facility](https://data.bioplatforms.com/bpa/otu/)

## Licence

Copyright &copy; 2017, Bioplatforms Australia.

BPA OTU is released under the GNU Affero GPL. See source for a licence copy.

## Contributing

* Fork next_release branch
* Make changes on a feature branch
* Submit pull request
