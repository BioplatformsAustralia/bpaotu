from django.conf.urls import url
from . import views

app_name = 'auth'

urlpatterns = [
    url(r'^login/$', views.login_view, name='login'),
    url(r'^callback/$', views.callback_view, name='callback'),
    url(r'^logout/$', views.logout_view, name='logout'),
    url(r'^user-info/$', views.user_info_view, name='user_info'),
    url(r'^check-auth/$', views.check_auth_view, name='check_auth'),
]
