from django.conf.urls import url
from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static
from . import views

admin.autodiscover()


urlpatterns = [
    url(r'^$', views.OTUSearch.as_view())
] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
