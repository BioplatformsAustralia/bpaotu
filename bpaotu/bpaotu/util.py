def strip_to_ascii(s):
    return ''.join([t for t in s if ord(t) < 128])
