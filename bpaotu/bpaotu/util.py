from contextlib import contextmanager, suppress
import os
import tempfile


def strip_to_ascii(s):
    return ''.join([t for t in s if ord(t) < 128])


@contextmanager
def temporary_file(contents):
    fd, path = tempfile.mkstemp(prefix='bpaotu', suffix='.txt', text=True)
    with os.fdopen(fd, 'w') as f:
        f.write(contents)
    yield path
    with suppress(OSError):
        os.remove(path)
