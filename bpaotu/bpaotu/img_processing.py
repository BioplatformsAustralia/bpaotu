from django.core.cache import caches
from django.conf import settings

from collections import defaultdict

import ckanapi

import logging

logger = logging.getLogger("rainbow")


CACHE_7DAYS = (60 * 60 * 24 * 7)

# img file extension corresponding to pillow processing format and HttpResponse format
IMG_EXTENSION_TABLE = {
    'jpg': ['JPEG', 'image/jpeg']
}


LOOKUP_TABLE_KEY = 'lkup_tbl_key'


def _get_cached_item(key):
    try:
        cache = caches['image_results']

        return cache.get(key)
    except Exception as e:
        logger.error(str(e))


def _set_cached_item(key, value):
    try:
        cache = caches['image_results']
        cache.set(key, value, CACHE_7DAYS)
    except Exception as e:
        logger.error(str(e))

    return True


def _create_img_lookup_table():
    '''
    Create a lookup table of all images in ckan.
    '''
    if _get_cached_item(LOOKUP_TABLE_KEY) is None:
        remote = ckanapi.RemoteCKAN(settings.BPA_PROD_URL, apikey=settings.CKAN_API_KEY)

        packages = remote.action.package_search(
            fq='tags:site-images',
            include_private=True,
            rows=100000
        )['results']

        lookup_table = defaultdict(list)

        for i in packages:
            try:
                coords = (i['latitude'], i['longitude'])
                img_url = i['resources'][0]['url']

                lookup_table[coords].append(img_url)

            except Exception as e:
                logger.error("Either latitude or longitude is missing for: {}".format(img_url))
                logger.error("Missing parameter is: {}".format(str(e)))

                continue

        lookup_table = dict(lookup_table)
        _set_cached_item(LOOKUP_TABLE_KEY, lookup_table)
