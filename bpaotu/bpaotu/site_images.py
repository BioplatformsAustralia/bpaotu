from django.core.cache import caches
from django.conf import settings
from collections import defaultdict

import ckanapi
import mimetypes

import requests
from io import BytesIO
from PIL import Image
from django.http import HttpResponseForbidden

import logging
logger = logging.getLogger("rainbow")


THUMBNAIL_SIZE = 480
CACHE_1DAY = (60 * 60 * 24)
SITE_IMAGE_DATA_TYPE = 'base-site-image'
LOOKUP_TABLE_KEY = 'CKAN_IMAGE_LOOKUP_TABLE'
image_cache = caches['image_results']


def make_ckan_remote():
    return ckanapi.RemoteCKAN(settings.CKAN_SERVER['base_url'], apikey=settings.CKAN_SERVER['api_key'])


def _get_image_packages():
    remote = make_ckan_remote()
    return remote.action.package_search(
        q='type:{}'.format(SITE_IMAGE_DATA_TYPE),
        include_private=True,
        rows=100000
    )['results']


def _get_and_verify_resource(package_id, resource_id):
    """
    verify that package_id is of the correct data type,
    and that resource_id is contained within the package

    if these conditions hold, returns the CKAN resource
    otherwise, returns None
    """
    remote = make_ckan_remote()
    package = remote.action.package_show(id=package_id)
    if package['id'] != package_id or package['type'] != SITE_IMAGE_DATA_TYPE:
        return None
    resources = {t['id']: t for t in package.get('resources', [])}
    return resources.get(resource_id)


def _build_lookup_table():
    lookup_table = defaultdict(list)

    def has_latlng_and_images(package):
        return 'latitude' in package and 'longitude' in package \
            and 'resources' in package and len(package['resources']) > 0

    for package in filter(has_latlng_and_images, _get_image_packages()):
        coord = (package['latitude'], package['longitude'])
        lookup_table[coord] += [
            {
                'package_id': package['id'],
                'resource_id': resource['id']
            } for resource in package['resources']]
    return dict(lookup_table)


def get_site_image_lookup_table():
    '''
    Get lookup table of all images in CKAN from cache,
    or alternatively build it and add it to the cache.
    '''

    lookup_table = image_cache.get(LOOKUP_TABLE_KEY)
    if lookup_table:
        return lookup_table
    lookup_table = _build_lookup_table()
    image_cache.set(LOOKUP_TABLE_KEY, lookup_table, CACHE_1DAY)
    return lookup_table


def resize_image(content):
    with Image.open(BytesIO(content)) as img_obj:
        # Resizing an image while maintaining aspect ratio:
        # https://stackoverflow.com/questions/24745857/python-pillow-how-to-scale-an-image/24745969
        maxsize = (THUMBNAIL_SIZE, THUMBNAIL_SIZE)
        img_obj.thumbnail(maxsize, Image.ANTIALIAS)
        # Needed fix for some cases with Alpha channel
        img_obj = img_obj.convert('RGB')

        with BytesIO() as img_buf:
            img_obj.save(img_buf, format='JPEG')
            img_data = img_buf.getvalue()
    return img_data


def fetch_image(package_id, resource_id):
    # security: we do not want this API endpoint to be used to retrieve
    # any data that is not a BASE site image.
    resource = _get_and_verify_resource(package_id, resource_id)
    if resource is None:
        raise HttpResponseForbidden()
    img_url = resource['url']
    content_type, _ = mimetypes.guess_type(img_url)
    r = requests.get(img_url, headers={'Authorization': settings.CKAN_SERVER['api_key']})
    img_data = resize_image(r.content)
    return (BytesIO(img_data), content_type)
