# -*- coding: utf-8 -*-
"""
OAuth/OIDC views for Auth0 authentication
"""

from django.conf import settings
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.http import JsonResponse, HttpResponse
from django.shortcuts import redirect
from django.urls import reverse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from authlib.integrations.requests_client import OAuth2Session
from urllib.parse import urlencode
import json
import requests


def get_oauth_session():
    """Create a new OAuth2Session instance"""
    return OAuth2Session(
        client_id=settings.OAUTH_CLIENT_ID,
        client_secret=settings.OAUTH_CLIENT_SECRET,
        redirect_uri=settings.OAUTH_REDIRECT_URI,
    )


@require_http_methods(["GET"])
def login_view(request):
    """
    Initiate OAuth login flow with Auth0
    """
    session = get_oauth_session()
    
    authorization_url, state = session.create_authorization_url(
        f"https://{settings.OAUTH_DOMAIN}/authorize",
        scope='openid profile email',
    )
    
    # Store state in session for CSRF protection
    request.session['oauth_state'] = state
    request.session.save()
    
    return redirect(authorization_url)


@require_http_methods(["GET"])
def callback_view(request):
    """
    Handle OAuth callback from Auth0
    Validates the authorization code and creates/updates user
    """
    # Validate state parameter for CSRF protection
    state = request.GET.get('state')
    session_state = request.session.get('oauth_state')
    
    if not state or state != session_state:
        return JsonResponse(
            {"error": "Invalid state parameter"},
            status=403
        )
    
    code = request.GET.get('code')
    error = request.GET.get('error')
    
    if error:
        error_description = request.GET.get('error_description', 'Unknown error')
        return JsonResponse(
            {"error": error, "description": error_description},
            status=400
        )
    
    if not code:
        return JsonResponse(
            {"error": "No authorization code received"},
            status=400
        )
    
    try:
        # Exchange authorization code for tokens
        session = get_oauth_session()
        token = session.fetch_token(
            f"https://{settings.OAUTH_DOMAIN}/oauth/token",
            code=code,
        )
        
        # Get user info from Auth0
        user_info = session.get(
            f"https://{settings.OAUTH_DOMAIN}/userinfo",
            headers={"Authorization": f"Bearer {token['access_token']}"}
        ).json()
        
        # Create or update Django user
        email = user_info.get('email', user_info.get('sub'))
        name = user_info.get('name', email)
        
        user, created = User.objects.get_or_create(
            username=email,
            defaults={
                'email': email,
                'first_name': name.split()[0] if ' ' in name else name,
                'last_name': ' '.join(name.split()[1:]) if ' ' in name else '',
            }
        )
        
        # Update user info if they already existed
        if not created:
            user.email = email
            user.first_name = name.split()[0] if ' ' in name else name
            user.last_name = ' '.join(name.split()[1:]) if ' ' in name else ''
            user.save()
        
        # Store tokens in session
        request.session['oauth_token'] = token
        request.session['oauth_user_info'] = user_info
        request.session.save()
        
        # Authenticate and login user
        user.backend = 'django.contrib.auth.backends.ModelBackend'
        login(request, user)
        
        # Redirect to frontend (you'll need to configure this)
        return redirect(f"{settings.OAUTH_FRONTEND_URL or '/'}")
        
    except Exception as e:
        return JsonResponse(
            {
                "error": "Authentication failed",
                "detail": str(e)
            },
            status=400
        )


@require_http_methods(["GET", "POST"])
def logout_view(request):
    """
    Logout the user and redirect to Auth0 logout endpoint
    """
    # Clear Django session
    logout(request)
    
    # Redirect to Auth0 logout
    logout_url = f"https://{settings.OAUTH_DOMAIN}/v2/logout?"
    params = {
        'client_id': settings.OAUTH_CLIENT_ID,
        'returnTo': settings.OAUTH_LOGOUT_REDIRECT_URI,
    }
    logout_url += urlencode(params)
    
    return redirect(logout_url)


@require_http_methods(["GET"])
def user_info_view(request):
    """
    Get current user info (calls userinfo endpoint for fresh data)
    Requires authentication
    """
    if not request.user.is_authenticated:
        return JsonResponse(
            {"error": "Unauthorized"},
            status=401
        )
    
    token = request.session.get('oauth_token')
    if not token:
        # User is logged in but no token - return basic info
        return JsonResponse({
            'id': request.user.id,
            'username': request.user.username,
            'email': request.user.email,
            'name': request.user.get_full_name() or request.user.username,
        })
    
    try:
        # Get fresh user info from Auth0
        headers = {'Authorization': f"Bearer {token['access_token']}"}
        response = requests.get(
            f"https://{settings.OAUTH_DOMAIN}/userinfo",
            headers=headers
        )
        response.raise_for_status()
        user_info = response.json()
        
        return JsonResponse({
            'id': request.user.id,
            'username': request.user.username,
            'email': user_info.get('email'),
            'name': user_info.get('name'),
            'picture': user_info.get('picture'),
            'sub': user_info.get('sub'),  # Auth0 unique ID
        })
    except Exception as e:
        return JsonResponse(
            {"error": "Failed to retrieve user info", "detail": str(e)},
            status=500
        )


@require_http_methods(["GET"])
def check_auth_view(request):
    """
    Check if user is authenticated and return their email and organisations
    Used for frontend Redux auth state initialization via OAuth
    """
    if not request.user.is_authenticated:
        return JsonResponse({
            'authenticated': False,
        }, status=401)
    
    try:
        user_info = request.session.get('oauth_user_info', {})
        print('check_auth_view user_info:', user_info)  # Debugging log
        email = user_info.get('email') or request.user.email
        
        # For now, hardcode this since we don't have orgs in oauth
        # organisations = user_info.get('organisations', [])
        organisations = [settings.OAUTH_AM_ORGANISATION]
        
        return JsonResponse({
            'authenticated': True,
            'email': email,
            'organisations': organisations,
        })
    except Exception as e:
        return JsonResponse(
            {'error': 'Failed to retrieve auth info', 'detail': str(e)},
            status=500
        )
