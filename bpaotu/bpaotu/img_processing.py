from django.core.cache import caches
from django.conf import settings

from collections import defaultdict

import ckanapi

import requests
from io import BytesIO
from PIL import Image

import logging
logger = logging.getLogger("rainbow")


MAX_WIDTH = 300
MAX_HEIGHT = 300

CACHE_7DAYS = (60 * 60 * 24 * 7)


# img file extension corresponding to pillow processing format and HttpResponse format
IMG_EXTENSION_TABLE = {
    'jpg': ['JPEG', 'image/jpeg']
}


LOOKUP_TABLE_KEY = 'lkup_tbl_key'


def _get_cached_item(key):
    cache = caches['image_results']
    return cache.get(key)


def _set_cached_item(key, value):
    cache = caches['image_results']
    cache.set(key, value, CACHE_7DAYS)


def _get_lookup_table():
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

        def get_img_url(package):
            first_resource = package.get('resources', [None])[0]
            return first_resource.get('url') if first_resource else None

        def has_all_data(package):
            return 'latitude' in package and 'longitude' in package and get_img_url(package)

        for i in filter(has_all_data, packages):
            coords = (i['latitude'], i['longitude'])
            img_url = i['resources'][0]['url']

            lookup_table[coords].append(img_url)

        _set_cached_item(LOOKUP_TABLE_KEY, dict(lookup_table))

        return dict(lookup_table)

    return _get_cached_item(LOOKUP_TABLE_KEY)


def fetch_image(lat, lng, index):
    lookup_table = _get_lookup_table()

    img_url = lookup_table[(lat, lng)][int(index)]
    img_name, img_ext = img_url.rsplit('/', 1)[-1].rsplit(".", 1)
    img_filename = img_name + "." + img_ext

    key = img_filename

    img_data = _get_cached_item(key)

    if img_data is None:
        r = requests.get(img_url, headers={'Authorization': settings.CKAN_API_KEY})

        with Image.open(BytesIO(r.content)) as img_obj:
            # img_obj.save(img_filename)  # Saves image to a file on disk

            # Resizing an image while maintaining aspect ratio:
            # https://stackoverflow.com/questions/24745857/python-pillow-how-to-scale-an-image/24745969
            maxsize = (MAX_WIDTH, MAX_HEIGHT)
            img_obj.thumbnail(maxsize, Image.ANTIALIAS)

            # Needed fix for some cases with Alpha channel (See test case 5).
            img_obj = img_obj.convert('RGB')

            with BytesIO() as img_buf:
                # 1. Save image to BytesIO stream
                img_obj.save(img_buf, format=IMG_EXTENSION_TABLE[img_ext][0])
                img_data = img_buf.getvalue()

                # 2. Cache the BytesIO stream
                _set_cached_item(key, img_data)

    content_type = IMG_EXTENSION_TABLE[img_ext][1]

    return (BytesIO(img_data), content_type)
