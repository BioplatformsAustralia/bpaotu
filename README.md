# Bioplatforms Australia - Operational taxonomic unit (OTU) query system

BPA-OTU is a web-based portal into Operational Taxonomic Unit (OTU) data, developed to access data from the Australian Microbiome.


## System overview

* The backend is implemented in [Django](https://www.djangoproject.com/), using
  mostly [SQLAlchemy](https://www.sqlalchemy.org/) for database access.
* The frontend is implemented in [React](https://reactjs.org/) and
  [Leaflet](https://leafletjs.com/). It has its own webserver, separate from
  Django, which serves the React assets and also proxies requests from the user
  interface through to Django.
* For development, Django runs in a Docker container, while the frontend
  webserver is started from a shell prompt outside of the container.
* For production, both Django and the frontend webserver run in a Docker container
* Deployment into production from github is performed by [CircleCI](https://circleci.com/)


## Quick Setup

* [Install docker and compose](https://docs.docker.com/compose/install/)
* git clone --recurse-submodules [https://github.com/BioplatformsAustralia/bpaotu.git](https://github.com/BioplatformsAustralia/bpaotu.git)
* `docker-compose -f docker-compose-build.yml build base dev`

## Input data

BPA-OTU loads input data to generate a PostgreSQL schema named `otu`. The importer functionality completely
erases all previously loaded data.

Three categories of file are ingested:

* contextual metadata (extension: `.xlsx` for Excel file [default] or `.db` for SQLite DB)
* taxonomy files (extension: `.taxonomy`)
* OTU abundance tables (extension: `.txt`)

All files should be placed under a base directory, and then the ingest can be run as a Django management command:

```console
$ docker-compose exec runserver bash
root@420c1d1e9fe4:~# /app/docker-entrypoint.sh django-admin otu_ingest /data/otu/ 2021-08-02
```

### Contextual Metadata

This file describes sample specific metadata. The current schema of the contextual metadata can be found [here](https://github.com/AusMicrobiome/contextualdb_doc/)

### Taxonomy files

A tab-delimited file with extension `.taxonomy`

The first row of this file must contains header. Only header fields required/used by bpaotu are:

```tsv
#OTU ID\tkingdom\tphylum\tclass\torder\tfamily\tgenus\tspecies\tamplicon\ttraits
```

Each column has the following format:

* #OTU ID: a string describing the OTU (GATC string)
* kingdom: text string
* phylum: text string
* class: text string
* order: text string
* family: text string
* genus: text string
* species: text string
* amplicon: text string (e.g. 16S, A16S, 18S, ITS, ...)
* traits: text string (multiple traits are comma separated)

NB: Taxonomic ranks must be forward filled with last known field assignment if empty (e.g. d__bacteria, d__bacteria_unclassified, d__bacteria_unclassified, d__bacteria_unclassified, d__bacteria_unclassified, d__bacteria_unclassified, d__bacteria_unclassified)

### Abundance files

A tab-delimited file with the extension `.txt`

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
* Quick Setup
* Input Data

But in summary:

* Build images, source environment file (from one of the developers), and bring up containers
```
docker-compose -f docker-compose-build.yml build base dev
source  </path/to/your/.env_local>
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
docker-compose exec runserver bash
/app/docker-entrypoint.sh django-admin otu_ingest /data/2019-02 2021-08-02
```
NB: In example above, 
* /data/2019-02: location of the data folder
* 2021-08-02: today's date 

Additonal argruments:
* --no-force-fetch: Add this to avoid fetch of contextual metadata file from server and instead use the one available in local folder (default: fetch from server)
* --use-sql-context: Add this to use contextual metadata file in format of SQLite DB instead of XLSX file (default: use XLSX file)

## Deployments

[Bioplatforms Australia - Australian Microbiome Search Facility](https://data.bioplatforms.com/bpa/otu/)

## Licence

Copyright &copy; 2017, Bioplatforms Australia.

BPA OTU is released under the GNU Affero GPL. See source for a licence copy.

## Contributing

* Fork next_release branch
* Make changes on a feature branch
* Submit pull request
