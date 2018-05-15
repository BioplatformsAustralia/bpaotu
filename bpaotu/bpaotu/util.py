def strip_to_ascii(s):
    return ''.join([t for t in s if ord(t) < 128])

def val_or_empty(obj):
    if obj is None:
        return ''
    return obj.value
