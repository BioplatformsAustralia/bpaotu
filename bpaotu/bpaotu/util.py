from contextlib import contextmanager, suppress
from .models import ImportMetadata
from hashlib import sha256
import os
import datetime
import tempfile
import logging


logger = logging.getLogger("rainbow")


def strip_to_ascii(s):
    return ''.join([t for t in s if ord(t) < 128])


def val_or_empty(obj):
    if obj is None:
        return ''
    return obj.value


def empty_to_none(v):
    # FIXME: push this back in the core metadata handling
    if v == '':
        return None
    return v


def str_none_blank(v):
    if v is None:
        return ''
    return str(v)


def make_cache_key(*args):
    """
    make a cache key, which will be tied to the UUID of the current import,
    so we don't need to worry about old data being cached if we re-import

    for this to work, repr() on each object passed in *args must return
    something that is stable, and completely represents the state of the
    object for the cache
    """
    meta = ImportMetadata.objects.get()
    key = meta.uuid + ':' + ':'.join(repr(t) for t in args)
    return sha256(key.encode('utf8')).hexdigest()


@contextmanager
def temporary_file(contents):
    fd, path = tempfile.mkstemp(prefix='bpaotu', suffix='.txt', text=True)
    with os.fdopen(fd, 'w') as f:
        f.write(contents)
    yield path
    with suppress(OSError):
        os.remove(path)


def format_sample_id(int_id):
    return '102.100.100/%d' % int_id


def make_timestamp():
    """
    returns a timestamp, suitable for use in a filename
    """
    return datetime.datetime.now().replace(microsecond=0).isoformat().replace(':', '')


def parse_date(s):
    try:
        return datetime.datetime.strptime(s, '%Y-%m-%d').date()
    except ValueError:
        return datetime.datetime.strptime(s, '%d/%m/%Y').date()


def parse_float(s):
    try:
        return float(s)
    except ValueError:
        return None
