import zipstream
import re
from .otu import (
    taxonomy_key_id_names,
    taxonomy_ontology_classes,
    taxonomy_otu_export,
    SampleOTU,
    Taxonomy,
    OTU,
    Sequence,
    SampleContext)
from .util import (
    format_sample_id,
    str_none_blank,
    array_or_empty)
from .query import (
    log_query,
    OntologyInfo,
    SampleQuery,
    TaxonomyOptions)
import io
import os
import csv
import logging
import time
from bpaingest.projects.amdb.contextual import AustralianMicrobiomeSampleContextual

from Bio.SeqRecord import SeqRecord
from Bio.Seq import Seq

logger = logging.getLogger('bpaotu')


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

def _csv_units_heading(column, field_units):
    return field_units.get(column.name)

def _csv_field_heading(column):
    if column.name == 'id':
        return 'sample_id'
    return SampleContext.csv_header_name(column.name)


def contextual_csv(samples):
    units_headings = {}
    field_headings = {}
    write_fns = {}
    field_units = AustralianMicrobiomeSampleContextual.units_for_fields()
    for column in SampleContext.__table__.columns:
        units_headings[column.name] = _csv_units_heading(column, field_units)
        field_headings[column.name] = _csv_field_heading(column)
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
    w.writerow(units_headings[t] for t in fields)
    w.writerow(field_headings[t] for t in fields)

    # use utf_8_sig to encode the header rows so the BOM is saved at the start of the file
    # (don't use utf_8_sig for other yield statments since we only want the BOM once at the start of the file)
    yield csv_fd.getvalue().encode('utf_8_sig')

    for sample in samples:
        csv_fd.truncate(0)
        csv_fd.seek(0)
        w.writerow(get_context_value(sample, field) for field in fields)
        yield csv_fd.getvalue().encode('utf_8')

def sample_otu_csv_rows(taxonomy_labels, ids_to_names, q):
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

    for row in q.yield_per(50):
        w.writerow([
            format_sample_id(row.SampleOTU.sample_id),
            row.OTU.code,
            row.SampleOTU.count] +
            ids_to_names(row.Taxonomy) +
            [array_or_empty(row.Taxonomy.traits).replace(",", ";")])
        yield fd.getvalue().encode('utf8')
        fd.seek(0)
        fd.truncate(0)

# different requirements to the otu csv export:
# - does not need the OTU code (so it is not included in the query)
# - does not need count and amplicon fields
# - tsv instead of csv
def sample_otu_tsv_rows_krona(taxonomy_labels, ids_to_names, q):
    fd = io.StringIO()
    w = csv.writer(fd, delimiter='\t')
    w.writerow(['OTU Count'] + list(taxonomy_labels))
    yield fd.getvalue().encode('utf8')
    fd.seek(0)
    fd.truncate(0)

    for row in q.yield_per(50):
        w.writerow([row.SampleOTU.count] + ids_to_names(row.Taxonomy))
        yield fd.getvalue().encode('utf8')
        fd.seek(0)
        fd.truncate(0)

def sanitise(filename):
    return re.sub(r'[\W]+', '-', filename)

def fasta_rows(query):
    logger.info('Finding all needed otu ids')

    otu_ids = []
    for row in query.matching_otu_ids().yield_per(1000):
        otu_ids.append(row[0])

    logger.info(f'Found all needed otu ids: {len(otu_ids)}')

    for otu_id, otu_code, seq in query.matching_otus(otu_ids).yield_per(1000):
        yield SeqRecord(
                Seq(seq),
                id=otu_code,
                description='').format('fasta').encode('utf8')

def tabular_zip_file_generator(params, onlyContextual):
    taxonomy_source_id = params.taxonomy_filter.get_rank_equality_value(0)
    assert taxonomy_source_id != None
    zf = zipstream.ZipFile(mode='w', compression=zipstream.ZIP_DEFLATED)
    rank1_ontology_class = taxonomy_ontology_classes[1]
    with SampleQuery(params) as query, OntologyInfo() as info, TaxonomyOptions() as options:
        taxonomy_labels_by_source = info.get_taxonomy_labels()
        zf.write_iter('contextual.csv', contextual_csv(query.matching_samples()))
        zf.writestr('info.txt', info_text(params))
        if onlyContextual=='f':
            zf.write_iter(
                "OTU.fasta",
                fasta_rows(query)
            )

            # Rank 1 is top level below taxonomy source, e.g. kingdom
            rank1_id_is_value = params.taxonomy_filter.get_rank_equality_value(1)
            taxonomy_labels = taxonomy_labels_by_source[taxonomy_source_id]

            ontology_attrs = ['amplicon_id'] + taxonomy_key_id_names[1:len(taxonomy_labels) +1]
            ontology_lookup_fns = {name: _csv_write_function(getattr(Taxonomy, name)) for name in ontology_attrs}

            q = query.matching_sample_otus(Taxonomy, OTU, SampleOTU)

            def ids_to_names(taxonomy):
                return [ontology_lookup_fns[name](getattr(taxonomy, name)) for name in ontology_attrs]

            if rank1_id_is_value is None: # not selecting a specific kingdom
                # get the rank1 possibilities (domain/kingdom) for the amplicon in this query
                possibilities = options.possibilities(params.taxonomy_filter)
                rank1_pairs = possibilities['new_options']['possibilities']

                for rank1_id, rank1_name in rank1_pairs:
                    # We have to do this as separate queries because
                    # zf.write_iter() just stores the query iterator and evaluates it later
                    taxonomy_rank1_id_attr = getattr(Taxonomy, taxonomy_key_id_names[1])
                    rank1_query = q.filter(taxonomy_rank1_id_attr == rank1_id)

                    filename = "{}.csv".format(sanitise(rank1_name))
                    zf.write_iter(
                        filename,
                        sample_otu_csv_rows(taxonomy_labels, ids_to_names, rank1_query)
                    )
            else:
                filename = "{}.csv".format(sanitise(info.id_to_value(rank1_ontology_class, rank1_id_is_value)))
                zf.write_iter(
                    filename,
                    sample_otu_csv_rows(taxonomy_labels, ids_to_names, q)
                )
        return zf

def krona_source_file_generator(tmpdir, params, krona_params_hash):
    krona_source_data_filename = os.path.join(tmpdir, "krona.tsv")

    time_start = time.time()

    sample_id = krona_params_hash['sample_id']
    amplicon_id = krona_params_hash['amplicon_id']
    taxonomy_source_id = krona_params_hash['taxonomy_source_id']

    with SampleQuery(params) as query, OntologyInfo() as info, TaxonomyOptions() as options:
        taxonomy_labels_by_source = info.get_taxonomy_labels()
        taxonomy_labels = taxonomy_labels_by_source[taxonomy_source_id]

        ontology_attrs = taxonomy_key_id_names[1:len(taxonomy_labels) +1]
        ontology_lookup_fns = {name: _csv_write_function(getattr(Taxonomy, name)) for name in ontology_attrs}

        q = query.matching_sample_otus_krona(sample_id, amplicon_id, taxonomy_source_id)

        def ids_to_names(taxonomy):
            return [ontology_lookup_fns[name](getattr(taxonomy, name)) for name in ontology_attrs]

        with open(krona_source_data_filename, 'wb') as file:
            for chunk in sample_otu_tsv_rows_krona(taxonomy_labels, ids_to_names, q):
                file.write(chunk)

        time_end = time.time()
        time_taken = round(time_end - time_start, 1)

    return krona_source_data_filename, time_taken

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
