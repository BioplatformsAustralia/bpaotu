from collections import OrderedDict
import datetime
import itertools

from .util import val_or_empty

import logging
logger = logging.getLogger('rainbow')


def generate_biom_file(query):
    otu_to_row = {}
    sample_to_column = {}

    otus = otu_rows(query, otu_to_row)
    samples = sample_columns(query, sample_to_column)
    abundance_table = abundance_tbl(query, otu_to_row, sample_to_column)
    shape = (str(len(x)) for x in (otu_to_row, sample_to_column))

    return itertools.chain(
        biom_header(),
        wrap('"rows": [', otus, '],'),
        wrap('"columns": [', samples, '],'),
        wrap('"shape": [', shape, '],'),
        wrap('"data": [', abundance_table, ']}'))


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


def otu_rows(query, otu_to_row):
    q = query.matching_otus()
    fields = ('amplicon', 'kingdom', 'phylum', 'class', 'order', 'family', 'genus', 'species')
    for idx, otu in enumerate(q.yield_per(50)):
        otu_to_row[otu.id] = idx

        def get_value(attr):
            if attr == 'class':
                attr = 'klass'
            return val_or_empty(getattr(otu, attr))

        metadata = ','.join(k_v(f, get_value(f)) for f in fields if get_value(f) != '')
        yield '{"id": "%s","metadata": {%s}}' % (otu.code, metadata)


def sample_columns(query, sample_to_column):
    q = query.matching_samples()

    # This is a cached query so all results are returned. Just iterate through without chunking.
    for idx, sample in enumerate(s for s in q if s.id not in sample_to_column):
        sample_to_column[sample.id] = idx

        fields = (k for k in sample.__table__.columns._data if k != 'id')
        metadata = ','.join(k_v(f, getattr(sample, f)) for f in fields if getattr(sample, f))

        sample_data = '{"id": "102.100.100/%s","metadata": {%s}}' % (sample.id, metadata)

        yield sample_data


def abundance_tbl(query, otu_to_row, sample_to_column):
    q = query.matching_sample_otus()

    for otu, sampleotu, samplecontext in q.yield_per(50):
        # a little messy, but this is our busiest bit of code in the
        # entire BIOM output process
        yield '[' + \
            str(otu_to_row[sampleotu.otu_id]) + \
            ',' + \
            str(sample_to_column[sampleotu.sample_id]) + \
            ',' + \
            str(sampleotu.count) + \
            ']'


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
