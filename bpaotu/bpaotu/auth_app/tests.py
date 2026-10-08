import json

from django.http import JsonResponse
from django.test import RequestFactory, SimpleTestCase, override_settings

from .decorators import require_oauth


class RequireOAuthTests(SimpleTestCase):
    @override_settings(ENABLE_AUTH=False, OAUTH_DEVELOPMENT_USER_EMAIL="dev@example.org")
    def test_disabled_auth_provides_development_user_context(self):
        @require_oauth
        def view(request):
            return JsonResponse({"email": request.ckan_data["email"]})

        response = view(RequestFactory().get("/"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(json.loads(response.content), {"email": "dev@example.org"})