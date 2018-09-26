import zipstream
from .otu import (
    OTUKingdom,
    SampleOTU,
    OTU,
    SampleContext)
from .util import (
    val_or_empty,
    display_name,
    format_bpa_id)
from .query import (
    OntologyInfo,
    SampleQuery)
import io
import csv


def contextual_csv(samples):
    with OntologyInfo() as info:
        def make_ontology_export(ontology_cls):
            values = dict(info.get_values(ontology_cls))

            def __ontology_lookup(x):
                if x is None:
                    return ''
                return values[x]
            return __ontology_lookup

        def str_none_blank(v):
            if v is None:
                return ''
            return str(v)

        headings = {}
        write_fns = {}
        for column in SampleContext.__table__.columns:
            units = getattr(column, 'units', None)
            if column.name == 'id':
                headings[column.name] = "BPA ID"
            else:
                title = display_name(column.name)
                if units:
                    title += ' [%s]' % units
                headings[column.name] = title

            if column.name == 'id':
                write_fns[column.name] = format_bpa_id
            elif hasattr(column, "ontology_class"):
                write_fns[column.name] = make_ontology_export(column.ontology_class)
            else:
                write_fns[column.name] = str_none_blank

    def get_context_value(sample, field):
        return write_fns[field](getattr(sample, field))

    # Issue: https://github.com/BioplatformsAustralia/bpaotu/issues/79
    # Find all non-empty fields(except 'BPA ID') 
    all_fields = [k.name for k in SampleContext.__table__.columns if k.name != 'id']
    non_empty_fields = set()
    for sample in samples:
        for field in all_fields:
            if get_context_value(sample, field):
                non_empty_fields.add(field)

    fields = list(non_empty_fields)
    fields.sort()
    
    # Prepare CSV writer
    csv_fd = io.StringIO()
    w = csv.writer(csv_fd)

    # Extract headings of non-empty fields
    non_empty_headings = ["BPA ID"]
    for field in fields:
        non_empty_headings.append(headings[field])
    w.writerow(non_empty_headings)

    # Determine relevant metadata for samples
    exported_sample = []
    for sample in samples:
        if sample.id not in exported_sample:
            exported_sample.append(sample.id)
            sample_data = list()
            sample_data.append('102.100.100/%s' % sample.id)
            for field in fields:
                sample_data.append(get_context_value(sample, field))
            print(sample_data)
            w.writerow(sample_data)

    return csv_fd.getvalue()


def tabular_zip_file_generator(params):
    zf = zipstream.ZipFile(mode='w', compression=zipstream.ZIP_DEFLATED)
    with SampleQuery(params) as query:
        def sample_otu_csv_rows(kingdom_id):
            fd = io.StringIO()
            w = csv.writer(fd)
            w.writerow([
                'BPA ID',
                'OTU',
                'OTU Count',
                'Amplicon',
                'Kingdom',
                'Phylum',
                'Class',
                'Order',
                'Family',
                'Genus',
                'Species'])
            yield fd.getvalue().encode('utf8')
            fd.seek(0)
            fd.truncate(0)
            q = query.matching_sample_otus(OTU, SampleOTU, SampleContext, kingdom_id=kingdom_id)
            for i, (otu, sample_otu, sample_context) in enumerate(q.yield_per(50)):
                w.writerow([
                    format_bpa_id(sample_otu.sample_id),
                    otu.code,
                    sample_otu.count,
                    val_or_empty(otu.amplicon),
                    val_or_empty(otu.kingdom),
                    val_or_empty(otu.phylum),
                    val_or_empty(otu.klass),
                    val_or_empty(otu.order),
                    val_or_empty(otu.family),
                    val_or_empty(otu.genus),
                    val_or_empty(otu.species)])
                yield fd.getvalue().encode('utf8')
                fd.seek(0)
                fd.truncate(0)

        zf.writestr('contextual.csv', contextual_csv(query.matching_samples()).encode('utf8'))
        with OntologyInfo() as info:
            for kingdom_id, kingdom_label in info.get_values(OTUKingdom):
                if not query.has_matching_sample_otus(kingdom_id):
                    continue
                zf.write_iter('%s.csv' % (kingdom_label), sample_otu_csv_rows(kingdom_id))
        return zf
