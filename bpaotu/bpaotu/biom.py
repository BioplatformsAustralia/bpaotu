from collections import OrderedDict
import datetime
import itertools
import json
import logging
import os
import zipstream
from sqlalchemy.orm import joinedload

from .query import (
    SampleOTU,
    SampleQuery,
    OntologyInfo)
from .util import val_or_empty, make_timestamp, empty_to_none
from .otu import SampleContext, Taxonomy, taxonomy_keys

logger = logging.getLogger('rainbow')


def generate_biom_file(query, comment):
    otu_to_row = {}
    sample_to_column = {}

    otus = otu_rows(query, otu_to_row)
    samples = sample_columns(query, sample_to_column)
    abundance_table = abundance_tbl(query, otu_to_row, sample_to_column)
    shape = (str(len(x)) for x in (otu_to_row, sample_to_column))

    return itertools.chain(
        biom_header(comment),
        wrap('"rows": [', otus, '],\n'),
        wrap('"columns": [', samples, '],\n'),
        wrap('"shape": [', shape, '],\n'),
        wrap('"data": [', abundance_table, ']}\n'))


def biom_zip_file_generator(params, timestamp):
    zf = zipstream.ZipFile(mode='w', compression=zipstream.ZIP_DEFLATED)
    with SampleQuery(params) as query:
        zf.write_iter(
            params.filename(timestamp, '.biom'),
            (s.encode('utf8') for s in generate_biom_file(query, params.describe())))
    return zf


def save_biom_zip_file(params, dir='/data'):
    timestamp = make_timestamp()

    filename = os.path.join(dir, params.filename(timestamp, '.biom.zip'))
    zf = biom_zip_file_generator(params, timestamp)
    with open(filename, 'wb') as f:
        for data in zf:
            f.write(data)
    return filename


def biom_header(comment):
    '''
    Write out the JSON file header first
    '''
    biom_file = OrderedDict((
        ('id', None),
        ('format', 'Biological Observation Matrix 1.0.0'),
        ('format_url', 'http://biom-format.org'),
        ('type', 'OTU table'),
        ('comment', comment),
        ('generated_by', 'Bioplatforms Australia'),
        ('date', datetime.datetime.now().replace(microsecond=0).isoformat()),
        ('matrix_type', 'sparse'),
        ('matrix_element_type', 'int')))

    headers = ',\n'.join(k_v(k, v) for k, v in biom_file.items())

    biom_header = '{%s,\n' % headers

    yield biom_header


def otu_rows(query, otu_to_row):
    taxonomy_fields = taxonomy_keys[1:]
    taxonomy_lookups = [joinedload(getattr(Taxonomy, rel))
                        for rel in (taxonomy_fields + ['amplicon'])]
    q = query.matching_otus().add_entity(Taxonomy).options(taxonomy_lookups)

    for idx, row in enumerate(q.yield_per(50)):
        def get_value(obj, attr):
            return val_or_empty(getattr(obj, attr))

        otu_to_row[row.OTU.id] = idx
        taxonomy_array = [get_value(row.Taxonomy, f) for f in taxonomy_fields]
        yield '{"id": "%s","metadata": {%s,%s}}' % (
            row.OTU.code,
            k_v('amplicon', get_value(row.Taxonomy, 'amplicon')),
            k_v('taxonomy', taxonomy_array))


def sample_columns(query, sample_to_column):
    with OntologyInfo() as info:
        def make_ontology_export(ontology_cls):
            values = dict(info.get_values(ontology_cls))

            def _ontology_lookup(x):
                if x is None:
                    return None
                return values[x]
            return _ontology_lookup

        ontology_fns = {}
        titles = {}
        for column in SampleContext.__table__.columns:
            title = column.name
            if title.endswith('_id'):
                title = title[:-3]
            if hasattr(column, 'ontology_class'):
                fn = make_ontology_export(column.ontology_class)
            else:
                fn = empty_to_none
            ontology_fns[column.name] = fn
            titles[column.name] = title

    def get_context_value(sample, field):
        val = ontology_fns[field](getattr(sample, field))

        # Phinch (http://phinch.org/) and Krona don't handle the full
        # range of JS types in metadata.
        #
        # These workarounds draw upon the behaviour of this online BIOM
        # converter: https://biomcs.iimog.org

        # workaround: None values not handled by external tools
        if val is None:
            val = 'null'

        # workaround: non-string values not handled by external tools
        val = str(val)

        return val

    all_fields = [k.name for k in SampleContext.__table__.columns if k.name != 'id']

    non_empty = set(
        field
        for sample in query.matching_samples()
        for field in all_fields
        if get_context_value(sample, field) is not None)
    fields = sorted(list(non_empty))

    # This is a cached query so all results are returned. Just iterate through without chunking.
    for idx, sample in enumerate(s for s in query.matching_samples() if s.id not in sample_to_column):
        sample_to_column[sample.id] = idx
        metadata = ','.join(k_v(titles[f], get_context_value(sample, f)) for f in fields)
        sample_data = '{"id": "102.100.100/%s","metadata": {%s}}' % (sample.id, metadata)

        yield sample_data


def abundance_tbl(query, otu_to_row, sample_to_column):
    q = query.matching_sample_otus(SampleOTU.otu_id, SampleOTU.sample_id, SampleOTU.count)
    for otu_id, sample_id, count in q.yield_per(50):
        # a little messy, but this is our busiest bit of code in the
        # entire BIOM output process
        yield '[' + \
            str(otu_to_row[otu_id]) + \
            ',' + \
            str(sample_to_column[sample_id]) + \
            ',' + \
            str(count) + \
            ']'


def k_v(k, v):
    if isinstance(v, datetime.date):
        v = str(v)
    return json.dumps(k) + ':' + json.dumps(v)


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
