from contextlib import contextmanager, suppress
import os
import tempfile


def strip_to_ascii(s):
    return ''.join([t for t in s if ord(t) < 128])


def val_or_empty(obj):
    if obj is None:
        return ''
    return obj.value


@contextmanager
def temporary_file(contents):
    fd, path = tempfile.mkstemp(prefix='bpaotu', suffix='.txt', text=True)
    with os.fdopen(fd, 'w') as f:
        f.write(contents)
    yield path
    with suppress(OSError):
        os.remove(path)


def format_bpa_id(int_id):
    return '102.100.100/%d' % int_id


def display_name(field_name):
    """
    a bit of a bodge, just replace '_' with ' ' and upper-case
    drop _id if it's there
    """
    if field_name.endswith('_id'):
        field_name = field_name[:-3]
    return ' '.join(((t[0].upper() + t[1:]) for t in field_name.split('_')))
