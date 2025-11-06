import logging
import subprocess
import tempfile

from .tabular import krona_source_file_generator

logger = logging.getLogger('bpaotu')

class KronaPlot:
    def __init__(self, params, sample_id):
        self.params = params
        self.sample_id = sample_id

        if not self.params:
            raise Exception("KronaPlot needs search params")

        if not self.sample_id:
            raise Exception("KronaPlot needs a sample_id")

    def produce_krona_html(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            # because the only relevant fields are sample_id, amplicon_id, taxonomy_source_id
            # just extract them manually for the source data and track functions
            amplicon_id = self.params.taxonomy_filter.amplicon_filter.get("value")
            taxonomy_source_id = self.params.taxonomy_filter.get_rank_equality_value(0)
            krona_params_hash = {
                "sample_id": self.sample_id,
                "amplicon_id": amplicon_id,
                "taxonomy_source_id": taxonomy_source_id,
            }

            # saves krona.tsv to a tmpdir and returns the filename/path
            tsv_filename, time_taken = krona_source_file_generator(tmpdir, self.params, krona_params_hash)
            logger.debug(f"Saved KronaPlot source data to {tsv_filename} in {time_taken}s")

            # run KronaTools on tsv and save html output file to same tmpdir
            # we use this system call to the absolute path to avoid issue with installing KronaTools over a multi-stage docker build
            html_filename = f"{tsv_filename}.html"
            kt_result = subprocess.run(["perl", "/app/krona/KronaTools/scripts/ImportText.pl", "-o", html_filename, tsv_filename], capture_output = True, text = True)

            if kt_result.stdout:
                logger.debug(kt_result.stdout.rstrip("\n"))

            if kt_result.stderr:
                logger.error(kt_result.stderr)

            # read the contents of the generated HTML file and return directly in response
            with open(html_filename, "r") as file:
                html = file.read()

            return html, krona_params_hash
