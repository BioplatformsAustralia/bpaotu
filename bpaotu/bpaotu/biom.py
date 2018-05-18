from collections import OrderedDict
import datetime
import itertools

from .util import val_or_empty

import logging
logger = logging.getLogger('rainbow')


def generate_biom_file(query):
    rows = []
    columns = []

    otus = otu_rows(query, rows)
    samples = sample_columns(query, columns)
    abundance_table = abundance_tbl(query, rows, columns)
    shape = (str(len(x)) for x in (rows, columns))

    return (s.encode('utf8')
            for s in itertools.chain(
                biom_header(),
                wrap('"rows": [', otus, '],'),
                wrap('"columns": [', samples, '],'),
                wrap('"shape": [', shape, '],'),
                wrap('"data": [', abundance_table, ']}')))


def biom_header():
    '''
    Write out the JSON file header first
    '''
    biom_file = OrderedDict((
        ('id', None),
        ('format', '1.0.0'),
        ('format_url', 'http://biom-format.org'),
        ('type', 'OTU table'),
        ('generated_by', 'Bioplatforms Australia'),
        ('date', datetime.datetime.now().replace(microsecond=0).isoformat()),
        ('matrix_type', 'sparse'),
        ('matrix_element_type', 'int')))

    headers = ',\n'.join(k_v(k, v) for k, v in biom_file.items())

    biom_header = '{%s,\n' % headers

    yield biom_header


def otu_rows(query, rows):
    q = query.matching_otus()

    for otu in (r for r in q.yield_per(50) if r.id not in rows):
        rows.append(otu.id)

        fields = ('amplicon', 'kingdom', 'phylum', 'class', 'order', 'family', 'genus', 'species')

        def get_value(attr):
            if attr == 'class':
                attr = 'klass'
            return val_or_empty(getattr(otu, attr))

        metadata = ','.join(k_v(f, get_value(f)) for f in fields if get_value(f) != '')

        otu_data = '{"id": "%s","metadata": {%s}}' % (otu.code, metadata)

        yield otu_data


def sample_columns(query, columns):
    q = query.matching_samples()

    # This is a cached query so all results are returned. Just iterate through without chunking.
    for sample in (s for s in q if s.id not in columns):
        columns.append(sample.id)

        fields = (k for k in sample.__table__.columns._data if k != 'id')
        metadata = ','.join(k_v(f, getattr(sample, f)) for f in fields if getattr(sample, f))

        sample_data = '{"id": "102.100.100/%s","metadata": {%s}}' % (sample.id, metadata)

        yield sample_data


def abundance_tbl(query, rows, columns):
    q = query.matching_sample_otus()

    for otu, sampleotu, samplecontext in q.yield_per(50):
        try:
            row_idx = rows.index(sampleotu.otu_id)
            col_idx = columns.index(sampleotu.sample_id)
            count = sampleotu.count
        except ValueError:
            logger.critical('No corresponding entry found for: {} {} {}'.format(sampleotu.otu_id, sampleotu.sample_id, sampleotu.count))
            row_idx, col_idx, count = -1, -1, -1

        yield '[{},{},{}]'.format(row_idx, col_idx, count)


def k_v(k, v):
    return '"{}": "{}"'.format(k, v)


def wrap(pre, it, post, sep=','):
    yield pre

    for x in interpose(it, sep):
        yield x

    yield post


def interpose(it, sep=','):
    try:
        yield next(it)
    except StopIteration:
        return
    for x in it:
        yield sep
        yield x
