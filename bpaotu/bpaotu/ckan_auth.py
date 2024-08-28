from functools import wraps
import hmac
import json
import logging
import os
import time

from django.http import HttpResponseForbidden
from django.conf import settings


logger = logging.getLogger("rainbow")


FORBIDDEN_RESPONSE_MSG = 'Please log into CKAN and ensure you are authorised to access the Australian Microbiome data.'
SECS_IN_DAY = 60 * 60 * 24


class OTUVerificationError(Exception):
    pass


def require_CKAN_auth(func):  # noqa N802
    @wraps(func)
    def inner(request, *args, **kwargs):
        if settings.CKAN_ENABLE_AUTH:
            token = request.META.get(settings.CKAN_AUTH_TOKEN_HEADER_NAME)
            if token is None:
                token = request.POST.get('token') if request.method == 'POST' else request.GET.get('token')
            if token is None:
                return HttpResponseForbidden(FORBIDDEN_RESPONSE_MSG)
            try:
                ckan_data = _otu_endpoint_verification(token)
            except OTUVerificationError:
                logger.exception('OTU Verification Failed')
                return HttpResponseForbidden(FORBIDDEN_RESPONSE_MSG)
            
            request.ckan_data = ckan_data

        return func(request, *args, **kwargs)

    return inner


def _otu_endpoint_verification(data):
    hash_portion, data_portion = data.split('||', 1)

    secret_key = bytes(os.environ.get('BPAOTU_AUTH_SECRET_KEY'), encoding='utf-8')

    digest_maker = hmac.new(secret_key, digestmod='md5')
    digest_maker.update(data_portion.encode('utf8'))
    digest = digest_maker.hexdigest()

    if digest != hash_portion:
        raise OTUVerificationError('Secret key does not match.')

    json_data = json.loads(data_portion)

    timestamp = json_data['timestamp']
    organisations = json_data['organisations']

    if time.time() - timestamp >= SECS_IN_DAY:
        raise OTUVerificationError('The timestamp is too old.')

    if 'australian-microbiome' not in organisations:
        raise OTUVerificationError('You do not have access to the Ausmicro data.')

    return json_data
