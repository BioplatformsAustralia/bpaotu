import zipstream
from .otu import (
    OTUKingdom,
    SampleOTU,
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


def tabular_zip_file_generator(params, onlyContextual):
    zf = zipstream.ZipFile(mode='w', compression=zipstream.ZIP_DEFLATED)
    with SampleQuery(params) as query:
        def sample_otu_csv_rows(kingdom_id):
            fd = io.StringIO()
            w = csv.writer(fd)
            w.writerow([
                'Sample ID',
                'OTU',
                'OTU Count',
                'Amplicon',
                'Kingdom',
                'Phylum',
                'Class',
                'Order',
                'Family',
                'Genus',
                'Species',
                'Traits'])
            yield fd.getvalue().encode('utf8')
            fd.seek(0)
            fd.truncate(0)
            q = query.matching_sample_otus(OTU, SampleOTU, SampleContext, kingdom_id=kingdom_id)
            for otu, sample_otu, sample_context in q.yield_per(50):
                w.writerow([
                    format_sample_id(sample_otu.sample_id),
                    otu.code,
                    sample_otu.count,
                    val_or_empty(otu.amplicon),
                    val_or_empty(otu.kingdom),
                    val_or_empty(otu.phylum),
                    val_or_empty(otu.klass),
                    val_or_empty(otu.order),
                    val_or_empty(otu.family),
                    val_or_empty(otu.genus),
                    val_or_empty(otu.species),
                    array_or_empty(otu.traits).replace(",", ";")])
                yield fd.getvalue().encode('utf8')
                fd.seek(0)
                fd.truncate(0)

        zf.writestr('contextual.csv', contextual_csv(query.matching_samples()).encode('utf8'))
        zf.writestr('info.txt', info_text(params))
        if onlyContextual=='f':
            with OntologyInfo() as info:
                for kingdom_id, kingdom_label in info.get_values(OTUKingdom):
                    if not query.has_matching_sample_otus(kingdom_id):
                        continue
                    zf.write_iter('%s.csv' % (kingdom_label), sample_otu_csv_rows(kingdom_id))
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
