# Bioplatforms Australia - Operational taxonomic unit (OTU) query system

BPA-OTU is a web-based portal into Operational Taxonomic Unit (OTU) data,
developed to access data from the Australian Microbiome.

## System overview

- The backend is implemented in [Django](https://www.djangoproject.com/), but uses
  [SQLAlchemy](https://www.sqlalchemy.org/) for most database operations.

- The frontend is implemented in [React](https://reactjs.org/) and uses
  [Plotly](https://plotly.com/javascript/) for charts and
  [Leaflet](https://leafletjs.com/) for maps. It has its own webserver, separate from
  Django, which serves the React assets and also proxies requests from the user
  interface through to Django.

- In production, the system requires that the browser session be logged in to
  the configured [CKAN](https://docs.ckan.org/) instance (see settings.py). This
  is an administrative restriction, and the system doesn't require CKAN
  authentication for functionality.

- All data for the system is contained within a Postgres database which is
  loaded from a set of files by an ingest operation (see below). Some ancillary
  data is fetched using the Python `ckanapi` (e.g. sample site images and sample
  metagenome data). For this reason the docker containers (at least `runserver`
  and `celeryworker`) need to run with a valid CKAN_API_KEY environment
  variable (see ./.env_local and ./docker-compose.yml).

- It depends on another Bioplatforms Australia project called `bpa-ingest`
  [(maintained externally)](https://github.com/BioplatformsAustralia/bpa-ingest).
  The version of `bpa-ingest` used is maintained in the `runtime-requirements.txt` file.
  When updating the AM metadata schema, the `bpa-ingest` repository requires changes.
  These changes will be associated with a git tag by the `bpa-ingest` team for the new version.
  The entry in `runtime-requirements.txt` must be updated to use the version at this new tag.
  Note: This dependency was handled previously as a git submodule.

- For development, Django runs in a Docker container, while the frontend
  webserver is started from a shell prompt outside of the container. The
  container mounts `./` as a volume, which means that Django will monitor all of
  its \*.py files and restart when they are updated outside of the container.

- The production instance is hosted at https://data.bioplatforms.com/

- For production, both Django and the frontend webserver run in Docker containers.

- Deployment into production from github is performed by [Bioplatforms Australia](https://bioplatforms.com/) using [CircleCI](https://circleci.com/)

## Development environment setup

### Backend (Django)

- [Install Docker and the Docker Compose plugin](https://docs.docker.com/compose/install/)

- Generate `./.env_local`. This should contain `KEY=value` lines. See `./.env_local.template`
  for keys. This must have a valid `CKAN_API_KEY` so that site images and sample
  metagenome data can be fetched during development. You can use your personal
  `CKAN_API_KEY` in the development environment. This key can be found on the
  profile page after logging on to the bioplatforms.com data portal.

  Note that `.env_local` is used to supply environment variables to the backend
  running in a docker container. Don't confuse this with the various `.env.*`
  files that can be used by React to supply environment variables to the
  frontend[info](https://create-react-app.dev/docs/adding-custom-environment-variables/#what-other-env-files-can-be-used)

  The only purpose of `./.env_local.template` is to document the available keys
  for manual generation of `./.env_local`.

  Ensure that other keys have a value set so the page will work (dummy values are fine). In particaular, CKAN_DEVEL_USER_EMAIL and BPAOTU_AUTH_SECRET_KEY need values, and possibly others.

- Generate `./.env`. This should contain `KEY=value` lines. See `./.env.template` for keys.
  This must have valid `POSTGRES_USER`, `POSTGRES_PASSWORD` and `REDIS_PASSWORD` values.

  Note that `.env` is used to supply environment variables to the `docker-compose.yml` file,
  and that these variables are not passed to any container. This way sensitive information
  is not included in `docker-compose.yml`.

- Build the docker images

  `docker compose -f docker-compose-build.yml build base dev`

- Start all of the containers

  `docker compose up`

  There are 4 containers: runserver, db, cache, celeryworker

  This will start the docker containers attached to the current terminal process. Logs will be written to the terminal screen.

- If you want the containers to persist running after closing the terminal, start the containers with the `-d` argument:

  `docker compose up -d`

  And then manage the containers with usual docker commands, e.g. `docker compose ps`, `docker compose stop`, `docker compose start`; and monitor the logs with `docker compose logs`, `docker compose logs runserver` or `docker compose logs celeryworker` as appropriate

- Troubleshooting:

  If the local machine already has a postgresql server instance it will need to be stopped, since the ports will conflict (`sudo service postgresql stop`)

### Ingest

Once the BE is operational it's possible to do a data ingest. This is described in detail in the _Input data description_ section. For quick reference:

`/path/to/bpaotu` is the app root (i.e. where docker-compose.yml is)

- Extract the ingest archive to /path/to/bpaotu/data/dev

  `tar -zxvf </path/to/dataarchive.tar.gz> -C /path/to/bpaotu/data/dev`

- Update the sample contextual database for the import

  `cp /path/to/bpaotu/data/dev/$ingest_dir/db/AM_db_* /path/to/bpaotu/data/dev/amd-metadata/amd-samplecontextual/`

- Run the otu_ingest management task on the app container

  `docker compose exec runserver bash`

  `/app/docker-entrypoint.sh django-admin otu_ingest $ingest_dir $yyyy-mm-dd --use-sql-context --no-force-fetch`

  Where: $ingest_dir is the directory of the extracted ingest archive (note: tab complete will work here), $yyyy-mm-dd is the date of the ingest (i.e. today's date)

### Frontend (React)

These steps are performed in a separate terminal, i.e. not in the container, and from the `frontend/` directory.

- Install node

  - The required version is in the `frontend/package.json` under the `"engines"`` property

  - Most systems will already have a version of node installed. The easiest way to install the required version for this app is to use [`nvm`](https://github.com/nvm-sh/nvm#installing-and-updating) (Node Version Manager)

  - Once nvm is installed, install the required version of node, e.g.: `nvm install x.y.z`

  - There is also a file in the `frontend/` directory called `.nvmrc` that specifies the version of node to be used for this project in the event that the local system has multiple versions of node.

- Install yarn

  - This is the preferred package manager for node projects

  `npm install -g yarn`

- Install node modules for the web app

  - Run `yarn install` to install the node modules

- Start the React frontend

  - Run `yarn start`
  - The page will be accessible on port 3000 by default

### KronaTools

KronaTools is used for some visualisations. In production, KronaTools is installed to the /app directory in the container during the production build. This doesn't work in development mode as /app is mounted to the code directory. To get around this, install KronaTools directly in the code directory to ./krona (this path is included in the .gitignore file, so it's not committed to the repository).

Not installing KronaTools won't cause the development environment to fail, but it will raise errors when trying to produce Krona plots.

`/path/to/bpaotu` is the app root (i.e. where docker-compose.yml is)

```
cd /path/to/bpaotu

git clone https://github.com/marbl/Krona.git ./krona
cd krona
git checkout v2.8.1
cd KronaTools
./install.pl --prefix ./
```

### jupyter notebook

The jupyter and ipython are included in the dev-requirements so that a jupyter notebook can be run in the Django app environment.

- Add the default jupyter port to the runserver service in the docker-compose.yml file

  ```
  ports:
  - "8000:8000"
  - "8888:8888" # Jupyter port
  ```

- Run the jupyter notebook server in the container

  `docker compose exec runserver bash`
  `jupyter notebook --ip=0.0.0.0 --port=8888 --no-browser --allow-root`

- Open the URL given on the host machine

## Input data description

BPA-OTU loads input data to generate a PostgreSQL schema named `otu`. The
importer functionality completely erases all previously loaded data.

Three categories of file are ingested:

- contextual metadata (extension: `.xlsx` for Excel file [default] or `.db` for SQLite DB)
- taxonomy files (extension: `.taxonomy`)
- OTU abundance tables (extension: `.txt`)

Note that `/data/dev` is a mount point in a Docker container. See `./docker-compose.yml`

By default the contextual metadata will be downloaded during the ingest
operation, or it can be provided as either a sqlite database or an Excel spreadsheet

    ./data/dev/amd-metadata/amd-samplecontextual/*.db # sqlite database
    ./data/dev/amd-metadata/amd-samplecontextual/*.xlsx # Excel spreadsheet

See "Additional arguments" below for more context on these.

Abundance and taxonomy files must be placed under a base directory for the particular ingest `$dir`, which is under the mount point for the Docker container, structured as follows:

    ./data/dev/$dir/$amplicon_code/*.txt.gz
    ./data/dev/$dir/$amplicon_code/*.$classifier_db.$classifier_method.taxonomy.gz

`$classifier_db` and `$classifier_method` describe the database and method used to
generate a given taxonomy. They can be arbitrary strings.

The ingest is then run as a Django management command. To run this you will need to shell into the runserver container

```console
cd ~/bpaotu # or wherever docker-compose.yml lives
# either this
docker compose exec runserver bash
# or this
docker exec -it bpaotu_runserver_1 bash

## Either ingest using local sqlite db file for contextual metadata...
root@05abc9e1ecb2:~# /app/docker-entrypoint.sh django-admin otu_ingest $dir $yyyy_mm_dd --use-sql-context --no-force-fetch

## or download contextual metadata and use that:
root@420c1d1e9fe4:~# /app/docker-entrypoint.sh django-admin otu_ingest $dir $yyyy_mm_dd
```

> If `docker compose exec runserver bash` does not work, then find the id of the container
> with `docker container ls` (the system will need to be running for this to work, i.e. with `docker compose up`)
> and then run `docker exec -it 2361ab2339af bash` (name will be different for the reader)

`$dir` is the base directory for the abundance and taxonomy files.

`$yyyy_mm_dd` is the ingest date .e.g. 2022-01-01

**Example usage:**

Get data file, unarchive and copy data to ./data/dev, and ingest data using a particular date:

```console
cd ./data/dev
tar -xvzf </path/to/dataarchive.tar.gz> ./

cd ~/bpaotu # or wherever docker-compose.yml lives
docker compose exec runserver bash
/app/docker-entrypoint.sh django-admin otu_ingest AM_data_db_submit_202303211107/ 2023-11-29 --use-sql-context --no-force-fetch
```

Additional arguments:

**NOTE**: the order is important if supplying both of these arguments

- --use-sql-context: Add this to use contextual metadata file in format of
  SQLite DB instead of XLSX file (default: use XLSX file)
- --no-force-fetch: Add this to avoid fetch of contextual metadata file from
  server and instead use the one available in local folder (default: fetch from
  server)

### Contextual Metadata

This file describes sample specific metadata. The current schema of the
contextual metadata can be found
[here](https://github.com/AusMicrobiome/contextualdb_doc/)

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

- #OTU ID: a string describing the OTU (GATC string, md5sum or string prefixed with mxa\_)
- kingdom...species: taxon as a text string, e.g., d_Bacteria
- amplicon: text string (e.g. 16S, A16S, 18S, ITS, ...)
- traits: text string (multiple traits are comma separated)

NB: Taxonomic ranks must be forward filled with last known field assignment if
empty (e.g. d**bacteria, d**bacteria_unclassified, d**bacteria_unclassified,
d**bacteria_unclassified, d**bacteria_unclassified, d**bacteria_unclassified,
d\_\_bacteria_unclassified)

Example:

```console
hou098@terrible-hf:~/bpaotu$ zcat  data/dev/202203050842/16S/16S_PWSW_seqs_listSET_OTU_taxon_20220304_withAMPLICON_FAPROTAXv124.silva132.SKlearn.taxonomy.gz  | head -4
#OTU ID confidence  kingdom phylum  class order family  genus species amplicon  traits
GATTGGCTCACGGACGCAAAACCACCAAAAAACACGTGACGTTACTGGTTGTCCGTCCTTTTGGTTTTTTTGCCCTTCTATGGTAATGCTATGAGTGCTTTTTGCAAAATGCTGCTCTGGGATTCGCTCCCGAACGCAACGCGCTACCTATTACTACTATCATAATTACATCACGCAAATTCAGGAGCTCATCAATGGTGAGCCAGCCAAGTTCATTCAAGATAGGTGAAATATGATCAAATTTCTTAGTATTAGTCAAAATACGGGCAGCAAAATTTTGTATAAGTTGTAGTTTATGAACATTATCCTTTGAAGTCCCAGACCATACAGTAGAACAGTAAAATAATTTACTAAAAACTAGTGAATTCAAAATGGTGTTCAATACCTCTCTAGAAAATAGGTGACGGACTCTATTTACTTGACATAAAGTAGATAAAAGGGAAGAACTAAGTGATGTAACGTAGTCATTAAAGTTAAAGTTCGAGTCTAGCAGAAGCCACGGGTTTTAACTCTTGACCAAGAAAAGGCACAGTGACATCTGGGAGCTGAGATAGGAGCTGTCTTACTCCGAA  0.4340600531226606  d__Unassigned d__Unassigned_unclassified  d__Unassigned_unclassified  d__Unassigned_unclassified  d__Unassigned_unclassified  d__Unassigned_unclassified  d__Unassigned_unclassified  27f519r_bacteria
AACGAACGCCGGCGGCGTGCTTAACACATGCAAGTCGAACGCGAAAGCCTGGGCAACTGGGCGAGTAGAGTGGCGAACGGGTGAGTAATACGTGAGTAACCTGCCCTTGAGTGGGGAATAACTCCTCGAAAGGGGAGCTAATACCGCATAAGACCACGACCCCGATGGGAGTTGCGGTCAAAGGTGGCCTCATGCACCAGAGCGTTTGGGCACAGATTCTGCGTGCCGGAAAAGAATCTGTACCCCAGCGCTTTGTCAGTGAAGCTATCGCTTGAGGAGGGGCTCGCGGCCCATCAGCTAGTTGGTAGGGTAATGGCCTACCAAGGCGACGACGGGTAGCTGGTCTGAGAGGACGACCAGCCACACGGGAATTGAGAGACGGTCCCGACTCCTACGGGAGGCAGCAGTGGGGAATCTTGGGCAATGGGGGAAACCCTGACCCAGCGACGCCGCGTGGGGGATGAAGGCCTTCGGGTTGTAAACCCCTGTTCGGTGGGACGAACATCTTCCCATGAACAGTGGGAAGATTTGACGGTACCACCAGAGTAAGCCCCGGCTAACTCCGTGC  0.9999802845765206  d__Bacteria d__Bacteria_unclassified  d__Bacteria_unclassified  d__Bacteria_unclassified  d__Bacteria_unclassified  d__Bacteria_unclassified  d__Bacteria_unclassified  27f519r_bacteria
GATGAACGCTGGCGGCGTGCTTAACACATGCAAGTCGAACGGTAACAGGCTTTCACTGTTTACTGCTCTTCTTTCGATATGGAGCAAAGGTTTTCCAAACCTTATTCCTAACGGAGGAGTATCATCTCGTACTTTGACCTAGTCAAGATACGAAATGTAGAGAAGTGAAGAGTGAAAGTGCTGACGAGTGGCGGACGGCTGAGTAACGCGTGGGAACGTGCCCCAAAGTGAGGGATAAGCACCGGAAACGGTGTCTAATACCGCATATGATCTTCGGATTAAAGCAGAAATGCGCTTTGGGAGCGGCCCGCGTTGGATTAGGTAGTTGGTGAGGTAAAGGCTCACCAAGCCGACGATCCATAGCTGGTCTGAGAGGATGACCAGCCAGACTGGAACTGAGACACGGTCCAGACTCCTACGGGAGGCAGCAGTGAGGAATCTTCCACAATGGGCGAAAGCCTGATGGAGCAACGCCGCGTGCAGGATGAAGGCCTTAGGGTCGTAAACTGCTTTTATTAGTGAGGAATATGACGGTAACTAATGAATAAGGGTCGGCTAACTACGTGC 0.8979041295444753  d__Bacteria p__Patescibacteria  c__Saccharimonadia  o__Saccharimonadales  f__Saccharimonadales  g__Saccharimonadales  g__Saccharimonadales_unclassified 27f519r_bacteria
```

### Abundance files

A gzip-compressed tab-delimited file with the extension `.txt.gz`

The first row is a header, with the following format:

```tsv
#OTU ID\tSample_only\tAbundance\tAbundance_20K

```

Each column has the following format:

- `#OTU ID`: text string, corresponding to the strings in the taxonomy file
- `Sample_only`: the identifier for the sample ID for which this column specifies abundance
- `Abundance` (floating point) : the abundance of the OTU in the sample
- `Abundance_20K` (integer): the abundance of the OTU in the sample after
  randomly sub-sampling 20,000 reads.

Missing values for `Abundance` or `Abundance_20K` are indicated by empty
strings. `Abundance` can be the last field on the line if `Abundance_20K` is
missing.

Example:

```tsv
#OTU ID Sample_only Abundance Abundance_20K
AAAAGAAGTAAGTAGTCTAACCGCAAGGAGGGCGCTTACCACTTTGTGATTCATGACTGGGG  21646 17
AAAAGAAGTAAGTAGTCTAACCGTTTACGGAGGGCGCTTACCACTTTGTGATTCATGACTGGGG  21653 14
AAAAGAAGTAGATAGCTTAACCTTCGGGAGGGCGTTTACCACTTTGTGATTCATGACTGGGG  21644 70  2
```

## Database

### Database visualisation

To generate an SVG diagram of the database schema, install the
`postgresql-autodoc` and `graphviz` packages (Ubuntu), and then

```
PGPASSWORD=$db_password postgresql_autodoc -d webapp -h localhost -u webapp -s otu
dot  -Tsvg webapp.dot  > webapp.svg
```

### Database login

Start a bash terminal on the db container and run log into psql with the webapp role:

```
psql -U webapp
```

Then set the search path to the "otu" schema at the psql prompt

```
SET search_path TO otu;
```

## Testing

### Add-hoc

There is a script to test the output of the `OTU and Contextual Download` feature. This counts and displays the number of unique OTU hashes in the OTU.fasta file, the number of unique Sample IDs in the contextual.csv file, and for each domain .csv file, counts and displays the number of unique OTU hashes and unique Sample IDs. The results can then be inspected to ensure they are as expected for the given search.

To run, download a search, extract the results to a directory, cd to that directory and run the script:

`. /path/to/bpaotu/test/verify-otu-contextual-export.sh`

### Automated

There are no automated tests

## Deployments

[Bioplatforms Australia - Australian Microbiome Search Facility](https://data.bioplatforms.com/bpa/otu/)

## Licence

Copyright &copy; 2017, Bioplatforms Australia.

BPA OTU is released under the GNU Affero GPL. See source for a licence copy.

## Contributing

- Fork next_release branch
- Make changes on a feature branch
- Submit pull request
