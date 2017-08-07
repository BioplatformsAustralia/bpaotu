# Bioplatforms Australia - Operational taxonomic unit (OTU) query system

BPA-OTU is a web portal into Bioplatforms Australia's analysed OTU data.

# Development
Ensure a late version of both docker and docker-compose are available in your environment.

bpaotu is available as a fully contained Dockerized stack. The dockerised stack are used for both production
and development. Appropiate configuration files are available depending on usage.

Note that for data ingestion to work you need passwords to the hosted data, these are available from BPA on request.
Set passwords in your environment, these will be passed to the container.

## Quick Setup

* [Install docker and compose](https://docs.docker.com/compose/install/)
* git clone https://github.com/muccg/bpaotu.git
* `./develop.sh build base`
* `./develop.sh build builder`
* `./develop.sh build dev`

`develop.sh up` will spin up the stack. See `./develop.sh` for some utility methods, which typically are simple 
wrappers arround docker and docker-compose.

docker-compose will fire up the stack like below:
```
docker ps -f name="bpaotu*"

IMAGE                       PORTS                                                                          NAMES
muccg/nginx-uwsgi:1.10      0.0.0.0:8080->80/tcp, 0.0.0.0:8443->443/tcp                                    bpaotu_nginx_1
mdillon/postgis:9.5         0.0.0.0:32944->5432/tcp                                                        bpaotu_db_1
muccg/bpaotu-dev            0.0.0.0:9000-9001->9000-9001/tcp, 8000/tcp, 0.0.0.0:9100-9101->9100-9101/tcp   bpaotu_uwsgi_1
muccg/bpaotu-dev            9000-9001/tcp, 0.0.0.0:8000->8000/tcp, 9100-9101/tcp                           bpaotu_runserver_1
```

Setup mirror config
```
docker exec -it bpaotu_runserver_1 /app/docker-entrypoint.sh django-admin set_mirrors
```

To execute the ingestion scripts run `docker exec -it bpaotu_runserver_1 /app/docker-entrypoint.sh django-admin`, be sure
to have the relevant variables below available in the environment. 

```
DJANGO_MAILGUN_API_KEY
BASE_REQUEST_LIST
BPA_MELANOMA_DOWNLOADS_PASSWORD
BPA_BASE_DOWNLOADS_PASSWORD
BPA_USERS_DOWNLOADS_PASSWORD
BPA_GBR_DOWNLOADS_PASSWORD
BPA_SEPSIS_DOWNLOADS_PASSWORD
```

## Sites
- *Production* https://downloads.bioplatforms.com

## Licence
BPA Metadata is released under the GNU Affero GPL. See source for a licence copy.

## Contributing
* Fork next_release branch
* Make changes on a feature branch
* Submit pull request

## CCG Internal documentation

https://ccgmurdoch.atlassian.net/wiki/display/BM/BPA+Metadata+Home

[1]: Be aware that all CDN supported content still needs to be fetched from the internet. 
