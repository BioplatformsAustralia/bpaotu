import csv
import json
import datetime
from collections import OrderedDict

from biom.util import biom_open
from biom import load_table
from biom import parse_table


OTU_FILE = "./Bacteria.csv"
METADATA_FILE = "./contextual.csv"
OUTPUT_FILE = "./FINAL.HDF5.BIOM"


# Process CSV file headers

csv_data = None

with open(OTU_FILE) as fp:
    csv_fp = csv.reader(fp)
    csv_data = list(csv_fp)
    fp.close()

header = csv_data[0]
header_index = {}  # Stores the index (column) value of each header element

def _generate_header_index():
    for h in header:
        processed_header = h.lower()
        processed_header = processed_header.replace(" ", "_")
        header_index[processed_header] = header.index(h)


_generate_header_index()

header_non_metadata = ['bpa_id', 'otu', 'otu_count']  # Non metadata
header_metadata = [k for k, v in header_index.items() if k not in header_non_metadata]  # Metadata


# Build the data matrix

bpa_sample_ids = []  # Rows - y axis
bpa_sample_metadata = {}  # Built from the metadata supplied in the Bacteria.csv file

otu_codes = []  # Columns - x axis

data_matrix = []

for idx, row in enumerate(csv_data[1:]):  # Start from the second row (first row is the header)
    bpa_sample_id = row[header_index['bpa_id']]

    if bpa_sample_id not in bpa_sample_ids:
        bpa_sample_ids.append(bpa_sample_id)
        bpa_sample_metadata[bpa_sample_id] = {x: row[header_index[x]] for x in header_metadata}

    otu_code = row[header_index['otu']]
    if otu_code not in otu_codes:
        otu_codes.append(otu_code)

    row_val = bpa_sample_ids.index(bpa_sample_id)  # Get the row number of the BPA ID (which is the y value)
    col_val = otu_codes.index(otu_code)  # Get the column number of the OTU code (which is the x value)
    count = row[header_index['otu_count']]  # Get the count from the CSV file

    data_matrix.append([row_val, col_val, count])


def _format_row_data(list):

    formatted_data = []

    for elem in list:
        row = {
            "id": elem,
            "metadata": bpa_sample_metadata[elem]
        }

        formatted_data.append(row)

    return formatted_data


formatted_bpa_sample_ids = _format_row_data(bpa_sample_ids)


# Process metadata file headers

# metadata_data = None
#
# with open(METADATA_FILE) as fp:
#     csv_fp = csv.reader(fp)
#     metadata_data = list(csv_fp)
#     fp.close()
#
# metadata_header = metadata_data[0]


def _format_col_data(list):

    formatted_data = []

    for elem in list:
        row = {
            "id": elem,
            "metadata": None
        }

        # if metadata_data:
        #     print("processing metadata...")
        #     pass # Not processing metadata for now

        formatted_data.append(row)

    return formatted_data


formatted_otu_codes = _format_col_data(otu_codes)


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
# quit()

# Convert file into hdf5 format

table = parse_table(output_json_biom_file)

with biom_open(OUTPUT_FILE, "w") as fp:
    output_hdf5_biom_file = table.to_hdf5(fp, "table")
    fp.close()


# Check that hdf5 biom file works

table = load_table(OUTPUT_FILE)
# print(table)
