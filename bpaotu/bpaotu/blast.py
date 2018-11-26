import csv
import io
import logging
import os.path
import shutil
import subprocess
from contextlib import suppress

import zipstream
from django.conf import settings

from . import views
from .otu import OTU, SampleContext, SampleOTU
from .query import SampleQuery
from .util import format_sample_id

logger = logging.getLogger('rainbow')


class BlastWrapper:
    BLAST_COLUMNS = ['qlen', 'slen', 'length', 'pident', 'evalue', 'bitscore']
    PERC_IDENTITY = '95'

    def __init__(self, cwd, submission_id, search_string, query):
        self._cwd = cwd
        self._submission_id = submission_id
        self._search_string = search_string
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
        # write user-provided search string into FASTA file
        with open(self._in('search.fasta'), 'w') as fd:
            fd.write('> user provided search string\n{}\n'.format(self._search_string))
        # generate a blast database
        self._run(
            ['makeblastdb', '-in', 'search.fasta', '-dbtype', 'nucl', '-parse_seqids'])

    def _write_query(self):
        with open(self._in('everything.fasta'), 'w') as fasta_fd:
            # write out the OTU database in FASTA format, as well a
            # mapping table to get back to the OTU strings
            with SampleQuery(self._params) as query:
                q = query.matching_otus()
                for idx, otu in enumerate(q.yield_per(50)):
                    fasta_fd.write('> id_{}\n{}\n\n'.format(otu.id, otu.code))

    def _blast_command(self):
        return [
            'blastn', '-db', 'search.fasta', '-query', 'everything.fasta', '-out', 'results.out',
            '-outfmt', '6 qseqid {}'.format(' '.join(self.BLAST_COLUMNS)), '-perc_identity', self.PERC_IDENTITY]

    def _execute_blast(self):
        self._run(self._blast_command())

    def _blast_results(self):
        results = {}
        with open(self._in('results.out')) as results_fd:
            reader = csv.reader(results_fd, dialect='excel-tab')
            for row in reader:
                otu_id = int(row[0][3:])  # strip id_
                results[otu_id] = row[1:]
        return results

    def _rewritten_blast_result_rows(self):
        fd = io.StringIO()
        blast_rows = self._blast_results()
        with SampleQuery(self._params) as query:
            q = query.matching_sample_otus(OTU, SampleOTU, SampleContext)
            q = q.filter(OTU.id.in_(blast_rows.keys()))
            writer = csv.writer(fd)
            writer.writerow(['OTU', 'sample_id', 'abundance', 'latitude', 'longitude'] + self.BLAST_COLUMNS)
            yield fd.getvalue().encode('utf8')
            fd.seek(0)
            fd.truncate(0)
            for otu, sample_otu, sample_context in q.yield_per(50):
                blast_row = blast_rows[otu.id]
                writer.writerow(
                    [otu.code, format_sample_id(sample_context.id), sample_otu.count,
                     sample_context.latitude, sample_context.longitude] + blast_row)
                yield fd.getvalue().encode('utf8')
                fd.seek(0)
                fd.truncate(0)

    def _write_output(self):
        zf = zipstream.ZipFile(mode='w', compression=zipstream.ZIP_DEFLATED)
        zf.writestr('info.txt', self._info_text(self._params))
        zf.write_iter('blast_results.csv', self._rewritten_blast_result_rows())

        with suppress(FileExistsError, PermissionError):
            os.mkdir(settings.BLAST_RESULTS_PATH)

        fname = 'BlastResults-' + self._submission_id + '.zip'
        result_path = os.path.join(settings.BLAST_RESULTS_PATH, fname)
        with open(result_path, 'wb') as fd:
            for chunk in zf:
                fd.write(chunk)
        return fname

    def _info_text(self, params):
        return """\
Australian Microbiome OTU Database - BLAST query results
--------------------------------------------------------

BLAST search executed for:
{}

Query command line:
{}

{}
""".format(self._search_string, ' '.join(self._blast_command()), params.describe()).encode('utf8')
