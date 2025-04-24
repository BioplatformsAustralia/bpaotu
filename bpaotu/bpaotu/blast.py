import csv
import io
import logging
import os.path
import shutil
import subprocess
import json
from contextlib import suppress

import zipstream
from django.conf import settings

# maps
import sys
import matplotlib.pyplot as plt
from mpl_toolkits.basemap import Basemap
import pandas as pd
import numpy as np
import matplotlib.colors as mcolors

from . import views
from .otu import OTU, SampleContext, SampleOTU
from .query import SampleQuery
from .util import format_sample_id

logger = logging.getLogger('bpaotu')


class BlastWrapper:
    BLAST_COLUMNS = ['qlen', 'slen', 'length', 'pident', 'evalue', 'bitscore']

    def __init__(self, cwd, submission_id, search_string, blast_params_string, query):
        self._cwd = cwd
        self._submission_id = submission_id
        self._search_string = search_string
        blast_params = json.loads(blast_params_string)
        self._param_qcov_hsp_perc = blast_params['qcov_hsp_perc']
        self._param_perc_identity = blast_params['perc_identity']
        self._params, _ = views.param_to_filters(query)

    def setup(self):
        self._make_database()
        self._write_query()

    def run(self):
        self._execute_blast()
        return self._write_output()

    def cleanup(self):
        try:
            shutil.rmtree(self._cwd)
        except Exception:
            logger.exception('Error when cleaning up BLAST cwd: ({})'.format(self._cwd))

    def _in(self, filename):
        "return path to filename within cwd"
        return os.path.join(self._cwd, filename)

    def _run(self, args):
        subprocess.run(args, check=True, cwd=self._cwd)

    def _make_database(self):
        """
        First we find all otu ids needed in the fasta file
        Then we get the sequences for those otu_ids
        This is done in separate steps because we must use the distinct clause
        for the otu_ids, and if we join to Sequence table and use the distinct
        clause it takes ages because the DB has to check all sequences

        Note: this should be improved to use a temporary table
        instead of a huge array of otu_ids
        """

        logger.info('Finding all needed otu ids')
        otu_ids = []
        with SampleQuery(self._params) as query:
            for row in query.matching_otu_ids().yield_per(1000):
                otu_ids.append(row[0])
        logger.info(f'Found all needed otu ids: {len(otu_ids)}')

        logger.info('Making db.fasta file')
        with open(self._in('db.fasta'), 'w') as fd:
            # write out the OTU database in FASTA format,
            # retain the otu id in the fasta id to use to get sample info later
            with SampleQuery(self._params) as query:
                for otu_id, otu_code, seq in query.matching_otus(otu_ids).yield_per(1000):
                    fd.write('>id_{}\n{}\n'.format(otu_id, seq))

        ## debugging
        # shutil.copy(os.path.join(settings.BLAST_RESULTS_PATH, 'db.fasta'), self._in('db.fasta'))

        logger.info('Completed making db.fasta file')

        logger.info('Making blastdb')
        self._run([
            'makeblastdb',
            '-in', 'db.fasta',
            '-dbtype', 'nucl',
            '-parse_seqids'
        ])
        logger.info('Completed making blastdb')

    def _max_target_seqs(self):
        command = ['grep', '-c', '>', self._in('db.fasta')]
        result = subprocess.run(command, stdout=subprocess.PIPE, text=True)
        return result.stdout.strip() # use strip() to remove trailing \n

    def _write_query(self):
        logger.info('Making query.fasta query file')
        with open(self._in('query.fasta'), 'w') as fd:
            fd.write('>user_provided_search_string\n{}\n'.format(self._search_string))
        logger.info('Completed making query.fasta query file')

    def _blast_command(self):
        return [
            'blastn',
            '-num_threads', '32',
            '-db', 'db.fasta',
            '-query', 'query.fasta',
            '-out', 'results.out',
            '-outfmt', '6 sseqid {}'.format(' '.join(self.BLAST_COLUMNS)),
            '-perc_identity', self._param_perc_identity,
            '-strand', 'plus',
            '-qcov_hsp_perc', self._param_qcov_hsp_perc,
            '-max_target_seqs', self._max_target_seqs()
        ]

    def _execute_blast(self):
        logger.info('Executing blast command')
        # logger.info(self._blast_command())
        self._run(self._blast_command())
        logger.info('Finished executing blast command')

    def _blast_results(self):
        logger.info('Retrieving blast results')
        results = {}
        with open(self._in('results.out')) as results_fd:
            reader = csv.reader(results_fd, dialect='excel-tab')
            for row in reader:
                # some versions of blastn put sseqid to `ref|<<fasta-id>>|`
                # other versions put it to `<<fasta-id>>`
                # this tries to account for both
                otu_id = int(row[0].replace('ref|', '').replace('id_', '').strip('|'))
                results[otu_id] = row[1:]
        logger.info('Finished retrieving blast results')
        return results

    def _rewritten_blast_result_rows_raw(self):
        logger.info('Adding raw blast results')
        fd = io.StringIO()
        blast_rows = self._blast_results()

        ## No sample info 
        ##
        writer = csv.writer(fd)
        writer.writerow(['OTU'] + self.BLAST_COLUMNS)
        yield fd.getvalue().encode('utf8')
        fd.seek(0)
        fd.truncate(0)
        for otu_id in blast_rows:
            blast_row = blast_rows[otu_id]
            writer.writerow([otu_id] + blast_row)
            yield fd.getvalue().encode('utf8')
            fd.seek(0)
            fd.truncate(0)

        logger.info('Finished adding raw blast results')

    def _rewritten_blast_result_rows_sample(self, blast_sample_results_file):
        logger.info('Adding sample data to blast results')

        blast_rows = self._blast_results()
        otu_ids = blast_rows.keys()

        with open(blast_sample_results_file, 'w', newline='', encoding='utf-8') as file:
            writer = csv.writer(file)
            writer.writerow(['OTU Code', 'OTU', 'sample_id', 'abundance', 'latitude', 'longitude'] + self.BLAST_COLUMNS)
            
            with SampleQuery(self._params) as query:
                q = query.matching_sample_otus_blast(otu_ids)

                for OTU_id, OTU_code, OTU_seq, SampleOTU_count, SampleContext_id, SampleContext_latitude, SampleContext_longitude in q.yield_per(50):
                    blast_row = blast_rows[OTU_id]
                    writer.writerow(
                        [OTU_code, OTU_seq, format_sample_id(SampleContext_id), SampleOTU_count,
                         SampleContext_latitude, SampleContext_longitude] + blast_row)

        logger.info('Finished adding sample data to blast results')

    def _write_output(self):
        zf = zipstream.ZipFile(mode='w', compression=zipstream.ZIP_DEFLATED)
        zf.writestr('info.txt', self._info_text(self._params))
        zf.write_iter('blast_results_raw.csv', self._rewritten_blast_result_rows_raw())

        # add sample data to raw results
        blast_sample_results_file = self._in('blast_results_sample.csv')
        self._rewritten_blast_result_rows_sample(blast_sample_results_file)
        zf.write_iter('blast_results_sample.csv', self._file_chunk_generator(blast_sample_results_file))

        # add map if there are results
        row_count = self._file_count_rows(blast_sample_results_file)
        image_contents = None
        if row_count > 0:
            blast_results_map_file = self._produce_map(blast_sample_results_file)
            zf.write_iter('blast_results_sample_map.png', self._file_chunk_generator(blast_results_map_file))

            # read the image file contents and return in response
            with open(blast_results_map_file, 'rb') as image_file:
                image_contents = image_file.read()

        with suppress(FileExistsError, PermissionError):
            os.mkdir(settings.BLAST_RESULTS_PATH)

        fname = 'BlastResults-' + self._submission_id + '.zip'
        result_path = os.path.join(settings.BLAST_RESULTS_PATH, fname)
        with open(result_path, 'wb') as fd:
            for chunk in zf:
                fd.write(chunk)

        return fname, image_contents

    def _produce_map(self, blast_sample_results_file):
        # based on github.com/AusMicrobiome/Maps

        logger.info('Creating map of blast results')
        df = pd.read_csv(blast_sample_results_file, usecols=['latitude', 'longitude', 'pident'])

        df_unique = df.drop_duplicates()
        df_unique = df.sort_values('pident') # sorting values so high pindent values are plotted last, and not obscured by low values (not they obscure the high values)

        # Convert longitude from -180 to 180 range to 0 to 360 range
        df_unique['longitude'] = df_unique['longitude'].apply(lambda x: x + 360 if x < 0 else x)

        # Get the min and max values for lat and lon, to set the map size
        min_lat, max_lat = df_unique['latitude'].min(), df_unique['latitude'].max()
        min_lon, max_lon = df_unique['longitude'].min(), df_unique['longitude'].max()

        # Normalize the pident values for coloring
        norm = mcolors.Normalize(vmin=df_unique['pident'].min(), vmax=df_unique['pident'].max())
        cmap = plt.cm.viridis

        # Create the fig, axes
        fig, ax = plt.subplots(figsize=(12, 8))

        # Create a Basemap instance, iith bluemarble background
        m = Basemap(projection='mill', llcrnrlat=min_lat-5, urcrnrlat=max_lat+5,
                    llcrnrlon=min_lon-5, urcrnrlon=max_lon+5, resolution='c')

        m.bluemarble()

        # Plot each point point with color based on pident value
        x, y = m(df_unique['longitude'].values, df_unique['latitude'].values)

        # Set dot size based on longitudinal range
        range_lon = max_lon - min_lon
        dot_size = self._calculate_dot_size(range_lon)
        sc = m.scatter(x, y, s=dot_size, c=df_unique['pident'].values, cmap=cmap, norm=norm, marker='o', zorder=5)

        # colorbar and titles
        cbar = m.colorbar(sc, location='right', pad='5%')
        cbar.set_label('pident')
        plt.title('Locations of related sequences')

        # Save it and add to zipstream
        filename = self._in('blast_results_sample_map.png')
        plt.savefig(filename, format='png', dpi=300, bbox_inches='tight')

        logger.info('Finished creating map of blast results')

        return filename

    def _file_chunk_generator(self, file_path, chunk_size=1024):
        with open(file_path, 'rb') as file:
            while chunk := file.read(chunk_size):
                yield chunk

    def _file_count_rows(self, file_path):
        with open(file_path, 'r', encoding='utf-8') as file:
            return sum(1 for _ in file) - 1

    def _calculate_dot_size(self, range_lon):
        MIN_SIZE = 35
        MAX_SIZE = 85
        MIN_RANGE = 20
        MAX_RANGE = 100

        if range_lon <= MIN_RANGE:
            return MAX_SIZE
        elif range_lon >= MAX_RANGE:
            return MIN_SIZE
        else:
            # linear interpolation
            return MAX_SIZE - (MIN_RANGE * (range_lon - MIN_RANGE) / (MAX_RANGE - MIN_RANGE))


    def _info_text(self, params):
        return """\
Australian Microbiome OTU Database - BLAST query results
--------------------------------------------------------

BLAST search executed for:
{}

Query command line:
{}

{}

---------------------------------------------------
How to cite Australian Microbiome data:
https://www.australianmicrobiome.com/protocols/acknowledgements/

Australian Microbiome data use policy:
https://www.australianmicrobiome.com/protocols/data-policy/

Code to make figure:
https://github.com/AusMicrobiome/Maps
""".format(self._search_string, ' '.join(self._blast_command()), params.describe()).encode('utf8')
