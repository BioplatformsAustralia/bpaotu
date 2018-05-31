from django.conf import settings


def production(request):
    return {'production': settings.PRODUCTION}
