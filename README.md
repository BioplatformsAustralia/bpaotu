# Bioplatforms Australia - Operational taxonomic unit (OTU) query system

BPA-OTU is a web-based portal into Operational Taxonomic Unit (OTU) data, developed to access data produced for the [Australian Microbiome Initiative](https://www.australianmicrobiome.com/).

## System overview

The project consists of these core components:

- The backend is implemented in [Django](https://www.djangoproject.com/), but uses [SQLAlchemy](https://www.sqlalchemy.org/) for most database operations.

  - Background jobs are handled by a [Celery](https://docs.celeryq.dev) instance

  - Both the Celery broker and result backend are handled by a [Redis](https://redis.io/) instance

- The frontend is implemented in [React](https://reactjs.org/) and uses [Plotly](https://plotly.com/javascript/) for charts and [Leaflet](https://leafletjs.com/) for maps.

- The data are stored in a Postgres database, which is populated from a set of files by an ingest operation (see below). 

  - The ingest process depends on another Bioplatforms Australia project called `bpa-ingest` which is [maintained externally](https://github.com/BioplatformsAustralia/bpa-ingest).

  - Some ancillary data is fetched using the Python `ckanapi` periodically (sample metagenome data) and during operation (sample site images).


All components run in separate Docker containers and are orchestrated using Docker Compose

The production instance is hosted at https://data.bioplatforms.com/

Authentication and access to the data are free via [BioCommons Access](https://www.biocommons.org.au/access)

Deployment into production from github is performed by [Bioplatforms Australia](https://bioplatforms.com/) using [CircleCI](https://circleci.com/)

### Notes on Dependencies

#### bpa-ingest

- The version of `bpa-ingest` used is maintained in the `runtime-requirements.txt` file. When the AM metadata schema is updated, the `bpa-ingest` repository requires changes. These changes will be associated with a git tag by the `bpa-ingest` team for the new version. The entry in `runtime-requirements.txt` must be updated to use the version at this new tag. Note: This dependency was handled previously as a git submodule.

#### ckanapi

- The docker containers (at least `runserver` and `celeryworker`) need to run with a valid CKAN_API_KEY environment variable (see ./.env_local and ./docker-compose.yml).

## Dockerfiles

The main Dockerfile defines all build stages for both development and production, as well as for the background worker.

- In _development_ mode, it has its own webserver, separate from Django, which serves the React assets and also proxies requests from the user interface through to Django.

- In _production_ mode, the system requires that the browser session be logged in to the configured OAuth instance (see settings.py). This is an administrative restriction, and the system doesn't require authentication for functionality.

Separate `docker-compose.yml` files are supplied for running the project in development and production modes.

- `docker-compose.yml` as is runs in development mode

  - e.g. `docker compose up`

- `docker-compose.prod.yml` runs in production mode locally

  - e.g. `docker compose -f docker-compose.prod.yml up`

The `docker-compose.yml` for the real production server is managed externally.

### Development

This mode builds images that are intended for local development work. Development mode allows features such as hot-reloading for both Django and React.

Everything, including the frontend (accessible on localhost:3000), is run in a docker container.

```
docker compose -f docker-compose-build.yml build dev worker frontend-dev
docker compose up
```

### Production

In production deployments, the TLS termination is performed by an external reverse proxy, so the production container listens on HTTP only.

The production build can still be tested locally by using a reverse-proxy running on the host. An example reverse-proxy nginx config can be found at `frontend/nginx/reverse-proxy.conf`. To test HTTPS, use `mkcert` to generate self-signed certs for testing the production deployment, placing them in the location expected by the reverse proxy config.

The build is handled by the `circleci-prodbuild.sh` script, but can be summarised as:

```
docker compose -f docker-compose-build.yml build prod worker frontend
```

When construction a docker-compose.yml for use in production / use the prod compose file alone:

```
docker compose -f docker-compose.prod.yml up
```

> Do not include `docker-compose.yml` here, because that file mounts the local repo into `/app` for hot-reloading in development mode. In prod mode that mount will overwrite the image contents (e.g. will cause `Permission denied` on `/app/docker-entrypoint.sh`).

### Frontend

The frontend `Dockerfile` supports building both development and production containers for the frontend. This keeps the CircleCI/prod build behaviour unchanged while making it easy to build a "local prod" image for development.

This is made possible with the different build targets in `docker-compose-build.yml`:
- `frontend` for production, running on nginx
- `frontend-dev` for development, running on a Webpack Dev Server

The only page served by Django itself is the ingest log (viewable at /ingest).

### DB Volume backup

Running an ingest drops and recreates the schema every time -- meaning that existing ingested data is lost when performaning a new ingest. Since a full ingest can take many (~5) hours, this is a bit annoying when testing the ingest code, and afterwards wanting to go back to having all the data available locally.

The following docker commands allow the dbdata volume to be backed up and restored easily, so that a full ingest can be saved while testing ingest code. These commands save the data uncompressed since (de)compressing it takes a very long time. As a result the backup file is quite large (50GB), but it only takes a few minutes to backup/restore.

```
docker compose -f docker-compose.yml -f docker-compose.backup.yml run --rm backup
docker compose -f docker-compose.yml -f docker-compose.backup.yml run --rm restore
```

## Development environment setup

### Backend (Django)

- Install Docker Engine and the Docker Compose plugin by following the instrutions on the [Docker website](https://docs.docker.com/compose/install/)

- Generate `./.env_local`. This should contain `KEY=value` lines. See `./.env_local.template` for keys.

  - Note that `.env_local` is used to supply environment variables to the backend running in a docker container. Don't confuse this with the various `.env.*` files that can be used by React to supply environment variables to the frontend. [More info](https://create-react-app.dev/docs/adding-custom-environment-variables/#what-other-env-files-can-be-used)
  
  - It must have a valid `CKAN_API_KEY` so that site images and sample metagenome data can be fetched during development. You can use your personal `CKAN_API_KEY` in the development environment. This key can be found on the profile page after logging on to the bioplatforms.com data portal.

  - It must have a valid `BPA_BPAINGEST_DOWNLOADS_PASSWORD` for the ingest process.

  - Ensure that other keys have a value set so the page will work (dummy values are fine).
  
  - Worth mentioning is the `SKIP_WARMCACHE` key. If this is set to `yes` then the cache warming steps will be skipped when the server is started, which is very helpful for development, as this process can take a couple of hours.

  - If testing OAuth then the relevant keys must be provided. Otherwise set `ENABLE_AUTH=0` to bypass this locally and be logged in as a development user.

- Generate `./.env`. This should contain `KEY=value` lines. See `./.env.template` for keys.

  - Note that `.env` is used to supply environment variables to the `docker-compose.yml` file, which are then passed to the relevant containers. This way sensitive information is not included in `docker-compose.yml`.

  - This must have valid values for: `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` and `REDIS_PASSWORD`.

- Build the docker images

  `docker compose -f docker-compose-build.yml build base dev`

  `docker compose -f docker-compose-build.yml build dev worker frontend-dev`

- Start all of the containers. Check comments in the `docker-compose.yml` file for ways to facilitate easier development. Worth mentioning is the `.:/app` bind-mount for the runserver service so that the server restarts automatically with changed code during development.

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

- Extract the ingest archive to a mounted volume, e.g. `/path/to/bpaotu/data/dev`

  `tar -zxvf </path/to/dataarchive.tar.gz> -C /path/to/bpaotu/data/dev`

- Update the sample contextual database for the import

  `cp /path/to/bpaotu/data/dev/$ingest_dir/db/AM_db_* /path/to/bpaotu/data/dev/amd-metadata/amd-samplecontextual/`

- Run the otu_ingest management task on the app container

  ```
  docker compose exec runserver bash
  /app/docker-entrypoint.sh django-admin otu_ingest $ingest_dir $yyyy-mm-dd --use-sql-context --no-force-fetch
  ```

  Where:
  - `$ingest_dir` is the directory of the extracted ingest archive (note: tab complete will work here)
  - `$yyyy-mm-dd` is the date of the ingest (i.e. today's date)

### Frontend (React)

The frontend is already managed in a Docker container, so there is no need to install yarn (development) or nginx (production*) to run the server. *Although see the note about a reverse proxy for testing TLS above

In development, to see the output of the yarn server and view the logs (e.g. to see eslint warnings):

`docker compose logs frontend -f`

To update existing packages or install new packages, the ./frontend/package.json and ./frontend/yarn.lock files both must be updated.


To avoid installing `yarn` or `npm` on the host, you can run `yarn` inside a Node container. A small helper script is included at `frontend/container-yarn.sh`, which can be executed manually, or by using the npm scripts in `frontend/package.json` to call it. These run Yarn in a container, update `package.json` and `yarn.lock`, and fix file ownership so the files are writable by your user.

From the repository root or the `frontend/` directory, regenerate the lockfile after editing `package.json`:

```bash
cd frontend
./container-yarn.sh install
# or
npm run container:install
```

Add a package (this updates both `package.json` and `yarn.lock`):

```bash
cd frontend
./container-yarn.sh add <package>@<version-or-tag>
# or
npm run container:add -- <package>@<version-or-tag>
```

Commit both `frontend/package.json` and `frontend/yarn.lock` after running these commands.

### KronaTools

KronaTools is used for some visualisations. In production, KronaTools is installed to the /app directory in the container during the production build. This doesn't work in the development container as /app is mounted to the code directory. To get around this, install KronaTools directly in the code directory to ./krona (this path is included in the .gitignore file, so it's not committed to the repository). It will then be accessible at /app/krona by the development container.

`/path/to/bpaotu` is the app root (i.e. where docker-compose.yml is)

```
cd /path/to/bpaotu

git clone https://github.com/marbl/Krona.git ./krona
cd krona
git checkout v2.8.1
cd KronaTools
./install.pl --prefix ./
```

Not installing KronaTools won't cause the development environment to fail, but it will raise errors when trying to produce Krona plots.

### jupyter notebook

The jupyter and ipython are included in the dev-requirements so that a jupyter notebook can be run in the Django app environment.

- Add the default jupyter port to the runserver service in the docker-compose.yml file

  ```
  ports:
  - (existing port)
  - "8888:8888" # Jupyter port
  ```

- Run the jupyter notebook server in the container. This will use the home directory of the runserver container as the notebook directory.

  ```
  docker compose exec runserver bash
  jupyter notebook --ip=0.0.0.0 --port=8888 --no-browser --allow-root
  ```

- Open the URL given on the host machine

#### Sample Comparison Example Code

When users download results from the Sample Comparison tool, the downloaded file includes example code (in Python and R) for processing the results locally. The edit the notebooks that have the code examples, the following notebook directory must be selected instead:

`jupyter notebook --ip=0.0.0.0 --port=8888 --no-browser --allow-root --notebook-dir=/app/bpaotu/bpaotu/resources/`

Note that the code examples reference the JSON data files relative to the directory of the code example, since this is how they are packaged up for user download. To develop with these notebooks, it is necessary to copy the relevant files to the resources/examples directory. For this reason, the .gitignore includes an entry for \*.json files in this directory so that they can be placed there in a development environment without being committed to the repository.

To convert the notebooks to updated example code files:

```
docker compose exec runserver bash
python /app/bpaotu/manage.py export_comparison_examples
```

These should be committed to the repository so that they are available for download in production.

## Input data description

BPA-OTU loads input data to generate a PostgreSQL schema named `otu`. The importer functionality completely erases all previously loaded data, so there is no need for it to manage updating existing data.

Three categories of file are ingested:

- contextual metadata (extension: `.xlsx` for Excel file [default] or `.db` for SQLite DB)
- taxonomy files (extension: `.taxonomy`)
- OTU abundance tables (extension: `.txt`)

Note that `/data/dev` is a mount point in a Docker container. See `./docker-compose.yml`

By default the contextual metadata will be downloaded during the ingest operation, or it can be provided as either a sqlite database or an Excel spreadsheet

```
./data/dev/amd-metadata/amd-samplecontextual/*.db # sqlite database
./data/dev/amd-metadata/amd-samplecontextual/*.xlsx # Excel spreadsheet
```

See "Additional arguments" below for more context on these.

Abundance and taxonomy files must be placed under a base directory for the particular ingest `$dir`, which is under the mount point for the Docker container, structured as follows:

```
./data/dev/$dir/$amplicon_code/*.txt.gz
./data/dev/$dir/$amplicon_code/*.$classifier_db.$classifier_method.taxonomy.gz
```

`$classifier_db` and `$classifier_method` describe the database and method used to generate a given taxonomy. They can be arbitrary strings.

The ingest is then run as a Django management command. To run this you will need to shell into the runserver container

```console
cd ~/bpaotu # or wherever docker-compose.yml lives

docker compose exec runserver bash

## Either ingest using local sqlite db file for contextual metadata...
root@05abc9e1ecb2:~# /app/docker-entrypoint.sh django-admin otu_ingest $dir $yyyy_mm_dd --use-sql-context --no-force-fetch

## or download contextual metadata and use that:
root@420c1d1e9fe4:~# /app/docker-entrypoint.sh django-admin otu_ingest $dir $yyyy_mm_dd
```

`$dir` is the base directory for the abundance and taxonomy files (as viewed by the runserver container).

`$yyyy_mm_dd` is the ingest date; e.g. 2022-01-01

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

- `--use-sql-context`: Add this to use contextual metadata file in format of a SQLite DB instead of XLSX file (default: use XLSX file)
- `--no-force-fetch`: Add this to avoid fetch of contextual metadata file from server and instead use the one available in local folder (default: fetch from server)

### Contextual Metadata

This file describes sample specific metadata. The current schema of the contextual metadata can be found [here](https://github.com/AusMicrobiome/contextualdb_doc/).

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

- \#OTU ID: a string describing the OTU (GATC string, md5sum or string prefixed with mxa\_)
- kingdom...species: taxon as a text string, e.g., d_Bacteria
- amplicon: text string (e.g. 16S, A16S, 18S, ITS, ...)
- traits: text string (multiple traits are comma separated)

NB: Taxonomic ranks must be forward filled with last known field assignment if empty (e.g. d\_\_bacteria, d\_\_bacteria_unclassified, d\_\_bacteria_unclassified, d\_\_bacteria_unclassified, d\_\_bacteria_unclassified, d\_\_bacteria_unclassified, d\_\_bacteria_unclassified)

Example:

```console
$ zcat data/dev/202203050842/16S/16S_PWSW_seqs_listSET_OTU_taxon_20220304_withAMPLICON_FAPROTAXv124.silva132.SKlearn.taxonomy.gz  | head -4
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

To generate an SVG diagram of the database schema, install the `postgresql-autodoc` and `graphviz` packages (Ubuntu), and then run:

```
PGPASSWORD=$db_password postgresql_autodoc -d webapp -h localhost -u webapp -s otu
dot -Tsvg webapp.dot > webapp.svg
```

### Interactive CLI

Run `psql` on the db container and log in with the webapp role:

```
docker compose exec db psql -U webapp
```

Then set the search path to the "otu" schema at the psql prompt:

```
webapp=# SET search_path TO otu;
SET
```

Now it's possible to inspect and run queries on the ingested data. Note that some tables unrelated to ingest data, such as the logged metagenome requests, are on the `public` schema.

## Testing

### Ad-hoc

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

- Fork relevant branch (`main` or applicable feature branch)
- Make changes on a new feature branch
- Submit pull request
