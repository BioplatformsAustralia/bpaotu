from django.urls import re_path
from . import views

app_name = 'auth'

urlpatterns = [
    re_path(r'^login/$', views.login_view, name='login'),
    re_path(r'^callback/$', views.callback_view, name='callback'),
    re_path(r'^logout/$', views.logout_view, name='logout'),
    re_path(r'^user-info/$', views.user_info_view, name='user_info'),
    re_path(r'^check-auth/$', views.check_auth_view, name='check_auth'),
]
