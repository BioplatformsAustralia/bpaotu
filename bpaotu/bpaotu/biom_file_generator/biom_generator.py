import csv
import json
import datetime
from collections import OrderedDict

from biom.util import biom_open
from biom import load_table
from biom import parse_table


OTU_FILE = "./Bacteria.csv"
METADATA_FILE = "./contextual.csv"
OUTPUT_FILE = "./FINAL.HDF5.biom"


def generate_biom_file(otu_file, metadata_file, output_file):
    otu_file_header = None

    bpa_sample_ids = []  # Rows
    bpa_sample_metadata = {}

    otu_codes = []  # Columns

    data_matrix = []

    with open(otu_file) as fp:
        otu_fp = csv.reader(fp)
        otu_file_header = next(otu_fp)

        header_index = {h.lower().replace(' ', '_'): otu_file_header.index(h) for h in otu_file_header}
        header_non_metadata = ['bpa_id', 'otu', 'otu_count']
        header_metadata = [k for k, v in header_index.items() if k not in header_non_metadata]

        for idx, row in enumerate(otu_fp):
            bpa_sample_id = row[header_index['bpa_id']]

            if bpa_sample_id not in bpa_sample_ids:
                bpa_sample_ids.append(bpa_sample_id)
                bpa_sample_metadata[bpa_sample_id] = {x: row[header_index[x]] for x in header_metadata}

            otu_code = row[header_index['otu']]
            if otu_code not in otu_codes:
                otu_codes.append(otu_code)

            # Build the data matrix
            row_val = bpa_sample_ids.index(bpa_sample_id)
            col_val = otu_codes.index(otu_code)
            count = row[header_index['otu_count']]

            data_matrix.append([row_val, col_val, count])

    formatted_bpa_sample_ids = [{'id': x, 'metadata': bpa_sample_metadata[x]} for x in bpa_sample_ids]

    # Process metadata file headers - need clarification so skipping for now

    # metadata_data = None
    #
    # with open(METADATA_FILE) as fp:
    #     csv_fp = csv.reader(fp)
    #     metadata_data = list(csv_fp)
    #     fp.close()
    #
    # metadata_header = metadata_data[0]

    formatted_otu_codes = [{'id': x, 'metadata': None} for x in otu_codes]

    # Create biom file (in JSON)
    biom_file = OrderedDict()

    biom_file['id'] = None
    biom_file['format'] = "1.0.0"
    biom_file['format_url'] = "http://biom-format.org"
    biom_file['type'] = "OTU table"
    biom_file['generated_by'] = "Bioplatforms Australia"
    biom_file['date'] = datetime.datetime.now().replace(microsecond=0).isoformat()
    biom_file['rows'] = formatted_bpa_sample_ids
    biom_file['columns'] = formatted_otu_codes
    biom_file['matrix_type'] = "sparse"
    biom_file['matrix_element_type'] = "int"
    biom_file['shape'] = [len(formatted_bpa_sample_ids), len(formatted_otu_codes)]
    biom_file['data'] = data_matrix

    output_json_biom_file = json.dumps(biom_file, indent=4)
    # print(output_json_biom_file)

    # Convert file into hdf5 format
    table = parse_table(output_json_biom_file)

    with biom_open(output_file, "w") as fp:
        output_hdf5_biom_file = table.to_hdf5(fp, "table")

    # Check that hdf5 biom file works
    table = load_table(output_file)
    print(table)


generate_biom_file(OTU_FILE, METADATA_FILE, OUTPUT_FILE)
