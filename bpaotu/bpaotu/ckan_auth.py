import logging

from functools import wraps
from django.http import HttpResponseForbidden
from django.conf import settings

logger = logging.getLogger("bpaotu")

FORBIDDEN_RESPONSE_MSG = 'Please log into BioCommons Access and ensure you are authorised to access the Australian Microbiome data.'

def require_CKAN_auth(func):
    @wraps(func)
    def inner(request, *args, **kwargs):
        if settings.ENABLE_AUTH:
            # Check if user is authenticated via OAuth
            if not request.user.is_authenticated:
                return HttpResponseForbidden(FORBIDDEN_RESPONSE_MSG)
            
            try:
                # Get user info from session (set during OAuth callback)
                user_info = request.session.get('oauth_user_info')
                if not user_info:
                    logger.warning('User authenticated but oauth_user_info not found in session')
                    return HttpResponseForbidden(FORBIDDEN_RESPONSE_MSG)
                
                # Check if user has access to AM data
                # organisations = user_info.get('organisations', [])

                # For now, hardcode this since we don't have orgs in oauth 
                organisations = [settings.OAUTH_AM_ORGANISATION]

                if settings.OAUTH_AM_ORGANISATION not in organisations:
                    logger.warning(
                        "User %s attempted access but does not have '%s' organisation",
                        request.user.username,
                        settings.OAUTH_AM_ORGANISATION
                    )
                    return HttpResponseForbidden(FORBIDDEN_RESPONSE_MSG)
                
                # Store user data in request for downstream use
                request.ckan_data = user_info
            except Exception as e:
                logger.exception('OAuth Authentication verification failed: %s', str(e))
                return HttpResponseForbidden(FORBIDDEN_RESPONSE_MSG)

        return func(request, *args, **kwargs)

    return inner
