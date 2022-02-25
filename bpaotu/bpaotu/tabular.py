import zipstream
import re
from sqlalchemy.orm import joinedload
from .otu import (
    taxonomy_keys,
    taxonomy_key_id_names,
    taxonomy_ontology_classes,
    SampleOTU,
    Taxonomy,
    OTU,
    SampleContext)
from .util import (
    format_sample_id,
    str_none_blank,
    val_or_empty,
    array_or_empty)
from .query import (
    OntologyInfo,
    SampleQuery)
import io
import csv
import logging
from bpaingest.projects.amdb.contextual import AustralianMicrobiomeSampleContextual


logger = logging.getLogger('rainbow')


def _csv_write_function(column):
    def make_ontology_export(ontology_cls):
        with OntologyInfo() as info:
            values = dict(info.get_values(ontology_cls))

            def _ontology_lookup(x):
                if x is None:
                    return ''
                return values[x]
            return _ontology_lookup

    if column.name == 'id':
        return format_sample_id
    elif hasattr(column, "ontology_class"):
        return make_ontology_export(column.ontology_class)
    else:
        return str_none_blank


def _csv_heading(column, field_units):
    units = field_units.get(column.name)
    if column.name == 'id':
        return 'Sample ID'
    title = SampleContext.display_name(column.name)
    if units:
        title += ' [%s]' % units
    return title


def contextual_csv(samples):
    headings = {}
    write_fns = {}
    field_units = AustralianMicrobiomeSampleContextual.units_for_fields()
    for column in SampleContext.__table__.columns:
        headings[column.name] = _csv_heading(column, field_units)
        write_fns[column.name] = _csv_write_function(column)

    def get_context_value(sample, field):
        return write_fns[field](getattr(sample, field))

    all_fields = [k.name for k in SampleContext.__table__.columns if k.name != 'id']
    non_empty = set(
        field
        for sample in samples
        for field in all_fields
        if get_context_value(sample, field) != '')
    fields = ['id'] + sorted(list(non_empty))

    csv_fd = io.StringIO()
    w = csv.writer(csv_fd)
    w.writerow(headings[t] for t in fields)

    for sample in samples:
        w.writerow(get_context_value(sample, field) for field in fields)
    return csv_fd.getvalue()

def sample_otu_csv_rows(taxonomy_labels, q):
    fd = io.StringIO()
    w = csv.writer(fd)
    w.writerow((
        'Sample ID',
        'OTU',
        'OTU Count',
        'Amplicon') +
        taxonomy_labels + (
        'Traits',))
    yield fd.getvalue().encode('utf8')
    fd.seek(0)
    fd.truncate(0)

    for taxonomy, otu, sample_otu in q.yield_per(50):
        w.writerow([
            format_sample_id(sample_otu.sample_id),
            otu.code,
            sample_otu.count,
            val_or_empty(otu.amplicon)] +
            [val_or_empty(getattr(taxonomy, attr))
             for attr in taxonomy_keys[1:len(taxonomy_labels)+1]] +
            [array_or_empty(taxonomy.traits).replace(",", ";")])
        yield fd.getvalue().encode('utf8')
        fd.seek(0)
        fd.truncate(0)

def sanitise(filename):
    return re.sub(r'[\W]+', '-', filename)

def tabular_zip_file_generator(params, onlyContextual):
    taxonomy_source_id = params.taxonomy_filter.get_rank_equality_value(0)
    assert taxonomy_source_id != None
    zf = zipstream.ZipFile(mode='w', compression=zipstream.ZIP_DEFLATED)
    # Rank 1 is top level below taxonomy source, e.g. kingdom
    taxonomy_rank1_id_attr = getattr(Taxonomy, taxonomy_key_id_names[1])
    rank1_ontology_class = taxonomy_ontology_classes[1]
    with SampleQuery(params) as query, OntologyInfo() as info:
        taxonomy_labels_by_source = info.get_taxonomy_labels()
        zf.writestr('contextual.csv', contextual_csv(query.matching_samples()).encode('utf8'))
        zf.writestr('info.txt', info_text(params))
        if onlyContextual=='f':
            q = query.matching_sample_otus(Taxonomy, OTU, SampleOTU)
            taxonomy_lookups = [joinedload(getattr(Taxonomy, rel)) for rel in taxonomy_keys]
            rank1_id_is_value = params.taxonomy_filter.get_rank_equality_value(1)
            taxonomy_labels = taxonomy_labels_by_source[taxonomy_source_id]
            if rank1_id_is_value is None: # not selecting a specific kingdom
                for rank1_id, rank1_name in info.get_values(rank1_ontology_class):
                    # We have to do this as separate queries because
                    # zf.write_iter() just stores the query iterator and evaluates
                    # it later
                    rank1_query = q.filter(taxonomy_rank1_id_attr == rank1_id)
                    if rank1_query.first() is None:
                        continue
                    zf.write_iter("{}.csv".format(sanitise(rank1_name)),
                                  sample_otu_csv_rows(taxonomy_labels,
                                                      rank1_query.options(taxonomy_lookups)))
            elif q.first():
                zf.write_iter(
                    "{}.csv".format(sanitise(info.id_to_value(rank1_ontology_class,
                                                              rank1_id_is_value))),
                    sample_otu_csv_rows(taxonomy_labels,
                                        q.options(taxonomy_lookups)))
        return zf


def info_text(params):
    return """\
Australian Microbiome OTU Database - tabular export
---------------------------------------------------

{}

---------------------------------------------------
How to cite Australian Microbiome data:
https://www.australianmicrobiome.com/protocols/acknowledgements/

Australian Microbiome data use policy:
https://www.australianmicrobiome.com/protocols/data-policy/
""".format(params.describe()).encode('utf8')
