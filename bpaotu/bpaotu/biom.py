from collections import OrderedDict
from io import StringIO
import datetime
import itertools

from .util import val_or_empty

import logging
logger = logging.getLogger("rainbow")


def _write_biom_header():
    '''
    Write out the JSON file header first
    '''
    biom_file = OrderedDict()
    biom_file['id'] = None
    biom_file['format'] = "1.0.0"
    biom_file['format_url'] = "http://biom-format.org"
    biom_file['type'] = "OTU table"
    biom_file['generated_by'] = "Bioplatforms Australia"
    biom_file['date'] = datetime.datetime.now().replace(microsecond=0).isoformat()
    biom_file['matrix_type'] = "sparse"
    biom_file['matrix_element_type'] = "int"

    biom_header = "{"

    for key, val in biom_file.items():
        biom_header += '"{}": "{}",\n'.format(key, val)

    yield biom_header.encode('utf8')


def _write_otus(query, rows):
    '''
    Write out the OTU list (which form the rows)
    '''
    q = query.matching_otus()
    result_length = q.distinct('code').count()

    otu_header = '"rows": ['

    yield otu_header.encode('utf8')

    cnt = 1
    for otu in q.yield_per(50):
        if otu.id not in rows:
            rows.append(otu.id)

            otu_details = OrderedDict()

            # otu_details['id'] = otu.code  # Write out the otu code separately as it is the id of the entry
            otu_details['amplicon'] = val_or_empty(otu.amplicon)
            otu_details['kingdom'] = val_or_empty(otu.kingdom)
            otu_details['phylum'] = val_or_empty(otu.phylum)
            otu_details['class'] = val_or_empty(otu.klass)
            otu_details['order'] = val_or_empty(otu.order)
            otu_details['family'] = val_or_empty(otu.family)
            otu_details['genus'] = val_or_empty(otu.genus)
            otu_details['species'] = val_or_empty(otu.species)

            otu_data = '{'
            otu_data += '"id": "{}",'.format(otu.code)
            otu_data += '"metadata": {'
            for key, val in otu_details.items():
                if val is "":
                    continue

                otu_data += '"{}": "{}",'.format(key, val)
            otu_data = otu_data[:-1]  # Remove the comma from the last element before closing the brace.
            otu_data += '}},'  # Close off the entry brace and the metadata brace. But need to remove trailing "," for the last entry

            if cnt == result_length:
                otu_data = otu_data[:-1]

            yield otu_data.encode('utf8')

            cnt = cnt + 1
    otu_footer = '],'

    yield otu_footer.encode('utf8')


def _write_samples(query, rows, columns):
    '''
    Write out the Sample list (which form the columns)
    '''
    q = query.matching_samples()
    result_length = len(q)

    sample_header = '"columns": ['

    yield sample_header.encode('utf8')

    cnt = 1
    for sample in q:  # This is a cached query so all results are returned. Just iterate through without chunking.
        if sample.id not in columns:
            columns.append(sample.id)

            sample_data = '{'
            sample_data += '"id": "102.100.100/{}",'.format(sample.id)
            sample_data += '"metadata": {'

            for key in sample.__table__.columns._data:
                if key == "id":
                    continue
                if getattr(sample, key) is None or getattr(sample, key) == "":
                    continue
                sample_data += '"{}": "{}",'.format(key, getattr(sample, key))

            sample_data = sample_data[:-1]
            sample_data += '}},'

            if cnt == result_length:
                sample_data = sample_data[:-1]

            yield sample_data.encode('utf8')

            cnt = cnt + 1

    sample_footer = '],'

    yield sample_footer.encode('utf8')

    shape = "[{}, {}]".format(len(rows), len(columns))
    otu_data = '"{}": {}, '.format("shape", shape)

    yield otu_data.encode('utf8')


def _write_abundance_table(query, rows, columns):
    '''
    Write out the abundance table
    '''
    q = query.matching_sample_otus()
    result_length = q.count()

    data_header = '"data": ['

    yield data_header.encode('utf8')

    cnt = 1
    for otu, sampleotu, samplecontext in q.yield_per(50):
        try:
            row_idx = rows.index(sampleotu.otu_id)
            col_idx = columns.index(sampleotu.sample_id)
            count = sampleotu.count

            data_entry = '[{},{},{}],'.format(row_idx, col_idx, count)

            if cnt == result_length:
                data_entry = data_entry[:-1]

            yield data_entry.encode('utf8')

        except:
            data_entry = '[{},{},{}],'.format(-1, -1, -1)  # If this appears there has been an error finding the corresponding otu_id and/or sample_id

            if cnt == result_length:
                data_entry = data_entry[:-1]

            yield data_entry.encode('utf8')

            logger.critical("No corresponding entry found for: {} {} {}".format(sampleotu.otu_id, sampleotu.sample_id, sampleotu.count))

        cnt = cnt + 1

    data_footer = ']}'

    yield data_footer.encode('utf8')



def generate_biom_file(query):
    rows = []
    columns = []

    output = list(itertools.chain(_write_biom_header(), _write_otus(query, rows), _write_samples(query, rows, columns), _write_abundance_table(query, rows, columns)))

    for elem in output:
        yield elem
