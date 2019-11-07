#!/usr/bin/env python3

import csv
import gzip
import os
from hashlib import sha256
from django.core.management.base import BaseCommand

# This script converts metaxa data into the equivalent of the other OTU data,
# issuing temporary (generated) OTU codes.
#
# kingdom phylum  class   order   family  genus   species Sample  Abundance       amplicon
# ->
# OTU ID Sample_only     Abundance
# OTU ID kingdom phylum  class   order   family  genus   amplicon


class Command(BaseCommand):
    METAXA_HEADER = [
        'kingdom',
        'phylum',
        'class',
        'order',
        'family',
        'genus',
        'species',
        'sample',
        'abundance',
        'amplicon']

    def add_arguments(self, parser):
        parser.add_argument('in_file', type=str)
        parser.add_argument('out_dir', type=str)

    def parts(self, row):
        return row[:-3], row[-3], row[-2], row[-1]

    def read_metaxa(self, in_file):
        with open(in_file) as fd:
            reader = csv.reader(fd, dialect='excel-tab')
            header = next(reader)
            assert([t.lower() for t in header] == self.METAXA_HEADER)
            yield from reader

    def generate_otu(self, taxonomy):
        return 'mxa_' + sha256(':'.join(taxonomy).encode('utf-8')).hexdigest()

    def write_abundance(self, in_file, out_dir):
        mapping = {}
        with gzip.open(os.path.join(out_dir, 'metaxa_samples.txt.gz'), 'wt') as out_fd:
            writer = csv.writer(out_fd, dialect='excel-tab')
            writer.writerow(['#OTU ID', 'Sample_only', 'Abundance'])
            for row in self.read_metaxa(in_file):
                taxonomy, sample, abundance, amplicon = self.parts(row)
                otu = self.generate_otu(taxonomy)
                tpl = (otu, sample)
                if tpl in mapping:
                    assert(mapping[tpl] == abundance)
                    continue
                mapping[tpl] = abundance
                writer.writerow([otu, sample, abundance])

    def write_taxonomy(self, in_file, out_dir):
        mapping = {}
        with gzip.open(os.path.join(out_dir, 'metaxa.taxonomy.gz'), 'wt') as out_fd:
            writer = csv.writer(out_fd, dialect='excel-tab')
            writer.writerow([
                '#OTU ID', 'kingdom', 'phylum', 'class', 'order', 'family', 'genus', 'species', 'amplicon'])
            for row in self.read_metaxa(in_file):
                taxonomy, sample, abundance, amplicon = self.parts(row)
                otu = self.generate_otu(taxonomy)
                if otu in mapping:
                    assert(mapping[otu] == taxonomy)
                    continue
                mapping[otu] = taxonomy
                writer.writerow([otu] + taxonomy + [amplicon])

    def handle(self, *args, **kwargs):
        in_file, out_dir = kwargs['in_file'], kwargs['out_dir']
        self.write_abundance(in_file, out_dir)
        self.write_taxonomy(in_file, out_dir)
