import json

from django.http import JsonResponse
from django.test import RequestFactory, SimpleTestCase, override_settings

from .ckan_auth import require_CKAN_auth


class RequireCKANAuthTests(SimpleTestCase):
    @override_settings(CKAN_ENABLE_AUTH=False, CKAN_DEVELOPMENT_USER_EMAIL='dev@example.org')
    def test_disabled_auth_provides_development_user_context(self):
        @require_CKAN_auth
        def view(request):
            return JsonResponse({'email': request.ckan_data['email']})

        response = view(RequestFactory().get('/'))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(json.loads(response.content), {'email': 'dev@example.org'})