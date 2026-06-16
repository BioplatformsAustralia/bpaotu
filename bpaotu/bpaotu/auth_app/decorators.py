import logging
from functools import wraps

from django.conf import settings
from django.http import HttpResponseForbidden

logger = logging.getLogger("bpaotu")

FORBIDDEN_RESPONSE_MSG = (
    "Please log into BioCommons Access and ensure you are authorised "
    "to access the Australian Microbiome data."
)


def require_oauth(view_func):
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        if not settings.ENABLE_AUTH:
            return view_func(request, *args, **kwargs)

        # 1. Must be logged into Django
        # Check if user is authenticated via OAuth
        if not request.user.is_authenticated:
            return HttpResponseForbidden(FORBIDDEN_RESPONSE_MSG)

        try:
            # 2. Must have OAuth session data
            # Get user info from session (set during OAuth callback)
            user_info = request.session.get("oauth_user_info")
            if not user_info:
                logger.warning(
                    "User %s authenticated but oauth_user_info not found in session",
                    request.user.username,
                )
                return HttpResponseForbidden(FORBIDDEN_RESPONSE_MSG)

            # 3. Organisation / entitlement check
            # Check if user has access to AM data
            # organisations = user_info.get('organisations', [])

            # For now: use hard‑coded orgs until Auth0 sends them
            organisations = [settings.OAUTH_AM_ORGANISATION]

            if settings.OAUTH_AM_ORGANISATION not in organisations:
                logger.warning(
                    "User %s attempted access without '%s' organisation",
                    request.user.username,
                    settings.OAUTH_AM_ORGANISATION,
                )
                return HttpResponseForbidden(FORBIDDEN_RESPONSE_MSG)

            # 4. Attach OAuth context for downstream code
            # Store user data in request for downstream use
            request.ckan_data = user_info

        except Exception:
            logger.exception("OAuth authentication verification failed")
            return HttpResponseForbidden(FORBIDDEN_RESPONSE_MSG)

        return view_func(request, *args, **kwargs)

    return _wrapped_view
