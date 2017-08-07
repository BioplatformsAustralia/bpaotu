from django.conf.urls import url
from django.contrib import admin
from django.conf import settings
from . import views

admin.autodiscover()


urlpatterns = [
    url(r'^$', views.landing)
]
