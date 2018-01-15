# Generic WSGI application
import os
import django.core.wsgi

def application(environ, start):

    # copy any vars into os.environ
    for key in environ:
        os.environ[key] = str(environ[key])

    return django.core.wsgi.get_wsgi_application()(environ,start)
