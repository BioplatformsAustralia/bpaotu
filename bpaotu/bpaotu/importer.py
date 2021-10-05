import csv
import datetime
import gzip
import logging
import os
import re
import tempfile
import traceback
import uuid
from collections import OrderedDict, defaultdict
from glob import glob
from hashlib import md5
from itertools import zip_longest
from ._version import __version__

import subprocess
import sqlalchemy
from bpaingest.metadata import DownloadMetadata
from bpaingest.projects.amdb.sqlite_contextual import \
    AustralianMicrobiomeSampleContextualSQLite
from bpaingest.projects.amdb.ingest import AccessAMDContextualMetadata
from sqlalchemy.orm import sessionmaker
from sqlalchemy.schema import CreateSchema, DropSchema
from sqlalchemy.sql.expression import text

from .otu import (OTU, SCHEMA, Base, Environment, ExcludedSamples,
                  ImportedFile, ImportMetadata, OntologyErrors, OTUAmplicon,
                  OTUClass, OTUFamily, OTUGenus, OTUKingdom, OTUOrder,
                  OTUPhylum, OTUSpecies, SampleAustralianSoilClassification,
                  SampleColor, SampleContext, SampleEcologicalZone,
                  SampleFAOSoilClassification, SampleHorizonClassification,
                  SampleLandUse, SampleOTU, SampleOTU20K, OTUSampleOTU, OTUSampleOTU20K, 
                  SampleProfilePosition,
                  SampleStorageMethod, SampleTillage, SampleType,
                  SampleVegetationType,
                  SampleIntegrityWarnings, SampleVolumeNotes, SampleBioticRelationship,
                  SampleEnvironmentMedium,
                  SampleHostAssociatedMicrobiomeZone, SampleHostType,
                  make_engine, refresh_otu_sample_otu_mv)

logger = logging.getLogger("rainbow")


class ImportException(Exception):
    pass


def try_int(s):
    try:
        return int(s)
    except ValueError:
        return None


def grouper(iterable, n, fillvalue=None):
    "Collect data into fixed-length chunks or blocks"
    # grouper('ABCDEFG', 3, 'x') --> ABC DEF Gxx"
    args = [iter(iterable)] * n
    return zip_longest(*args, fillvalue=fillvalue)


def otu_hash(code, amplicon_id):
    return md5('{},{}'.format(code, amplicon_id).encode('ascii')).digest()


class DataImporter:
    # note: some files have species, some don't
    amd_ontologies = OrderedDict([
        ('am_environment', Environment),
        ('sample_type', SampleType),
        ('host_type', SampleHostType),
        ('host_associated_microbiome_zone', SampleHostAssociatedMicrobiomeZone),
        ('env_medium', SampleEnvironmentMedium),
        ('horizon', SampleHorizonClassification),
        ('env_broad_scale', SampleLandUse),
        ('env_local_scale', SampleLandUse),
        ('immediate_previous_land_use', SampleLandUse),
        ('general_env_feature', SampleEcologicalZone),
        ('vegetation_type', SampleVegetationType),
        ('profile_position', SampleProfilePosition),
        ('local_class', SampleAustralianSoilClassification),
        ('tillage', SampleTillage),
        ('color', SampleColor),
        ('sample_volume_notes', SampleVolumeNotes),
        ('sample_integrity_warnings', SampleIntegrityWarnings),
        ('biotic_relationship', SampleBioticRelationship),
        ('store_cond', SampleStorageMethod),
    ])

    def __init__(self, import_base, revision_date, has_sql_context=False, force_fetch=True):
        self.amplicon_code_names = {}  # mapping from dirname to amplicon ontology
        self._engine = make_engine()
        self._create_extensions()
        self._session = sessionmaker(bind=self._engine)()
        self._import_base = import_base
        self._methodology = 'v1'
        self._analysis_url = ''
        self._revision_date = revision_date
        self._has_sql_context = has_sql_context
        self._force_fetch = force_fetch

        # these are used exclusively for reporting back to CSIRO on the state of the ingest
        self.sample_metadata_incomplete = set()
        self.sample_non_integer = set()
        self.sample_not_in_metadata = set()

        self.otu_invalid = set()

        try:
            self._session.execute(DropSchema(SCHEMA, cascade=True))
        except sqlalchemy.exc.ProgrammingError:
            self._session.invalidate()
        self._session.execute(CreateSchema(SCHEMA))
        self._session.commit()
        Base.metadata.create_all(self._engine)
        self.ontology_init()

    def run(self):
        self.load_contextual_metadata()
        otu_lookup = self.load_taxonomies()
        self.load_otu_abundance_20k(otu_lookup)
        self.load_otu_abundance(otu_lookup)
        refresh_otu_sample_otu_mv(self._session, OTUSampleOTU.__table__)
        refresh_otu_sample_otu_mv(self._session, OTUSampleOTU20K.__table__)
        self.complete()

    def ontology_init(self):
        # set blank as an option for all ontologies, bar Environment
        all_cls = set(
            c for c
            in list(self.amd_ontologies.values())
            if c is not Environment)
        # Species is the only potentially blank taxonomy
        all_cls.add(OTUSpecies)
        for db_class in all_cls:
            instance = db_class(id=0, value='')
            self._session.add(instance)
        self._session.commit()

    def complete(self):
        def write_missing(attr):
            instance = ExcludedSamples(
                reason=attr,
                samples=list(getattr(self, attr)))
            self._session.add(instance)
            self._session.commit()

        write_missing("sample_metadata_incomplete")
        write_missing("sample_non_integer")
        write_missing("sample_not_in_metadata")
        self._write_metadata()
        self._session.close()
        self._analyze()

    def _write_metadata(self):
        self._session.add(ImportMetadata(
            methodology=self._methodology,
            analysis_url=self._analysis_url,
            revision_date=datetime.datetime.strptime(self._revision_date, "%Y-%m-%d").date(),
            imported_at=datetime.date.today(),
            uuid=str(uuid.uuid4()),
            sampleotu_count=self._session.query(SampleOTU).count(),
            samplecontext_count=self._session.query(SampleContext).count(),
            otu_count=self._session.query(OTU).count()))
        self._session.commit()

    def _create_extensions(self):
        extensions = ('citext', 'btree_gin')
        for extension in extensions:
            try:
                logger.info("creating extension: {}".format(extension))
                self._engine.execute('CREATE EXTENSION {};'.format(extension))
            except sqlalchemy.exc.ProgrammingError as e:
                if 'already exists' not in str(e):
                    logger.critical("couldn't create extension: {} ({})".format(extension, e))

    def _analyze(self):
        logger.info("Completing ingest: vacuum analyze")
        earlier_isolation_level = self._session.connection().connection.isolation_level
        self._session.connection().connection.set_isolation_level(0)
        self._session.execute("VACUUM (VERBOSE, ANALYZE);")
        self._session.connection().connection.set_isolation_level(earlier_isolation_level)
        logger.info("Completed ingest: vacuum analyze")

    def _build_ontology(self, db_class, vals):
        for val in sorted(vals):
            # this option is defined at import init
            if val == '':
                continue
            instance = db_class(value=val)
            self._session.add(instance)
        self._session.commit()
        return dict((t.value, t.id) for t in self._session.query(db_class).all())

    def _load_ontology(self, ontology_defn, row_iter, key_set=set()):
        # import the ontologies, and build a mapping from
        # permitted values into IDs in those ontologies
        by_class = defaultdict(list)
        for field, db_class in ontology_defn.items():
            by_class[db_class].append(field)

        vals = defaultdict(set)
        for row in row_iter:
            key_set.update(row.keys())
            for db_class, fields in by_class.items():
                for field in fields:
                    if field in row:
                        vals[db_class].add(row[field])

        # blow up if any of the ontologies hasn't worked
        for db_class, val_set in vals.items():
            if len(val_set) == 0:
                raise ImportException("empty ontology: {}".format(db_class))

        mappings = {}
        for db_class, fields in by_class.items():
            map_dict = self._build_ontology(db_class, vals[db_class])
            for field in fields:
                mappings[field] = map_dict
        return mappings

    def amplicon_files(self, pattern):
        for fname in glob(self._import_base + '/*/' + pattern):
            amplicon = fname.split('/')[-2]
            yield amplicon, fname

    def make_file_log(self, filename, **attrs):
        attrs['file_size'] = os.stat(filename).st_size
        attrs['filename'] = os.path.basename(filename)
        instance = ImportedFile(
            **attrs)
        self._session.add(instance)
        self._session.commit()

    def load_taxonomies(self):
        # md5(otu code) -> otu ID, returned

        otu_lookup = {}
        taxonomy_fields = [
            'id', 'code',
            # order here must match `ontologies' below
            'kingdom_id', 'phylum_id', 'class_id', 'order_id', 'family_id', 'genus_id', 'species_id', 'amplicon_id', 'traits']
        ontologies = OrderedDict([
            ('kingdom', OTUKingdom),
            ('phylum', OTUPhylum),
            ('class', OTUClass),
            ('order', OTUOrder),
            ('family', OTUFamily),
            ('genus', OTUGenus),
            ('species', OTUSpecies),
            ('amplicon', OTUAmplicon),
        ])
        taxonomy_file_info = {}

        def _taxon_rows_iter():
            code_re = re.compile(r'^[GATC]+')
            otu_header = '#OTU ID'
            amplicon_header = 'amplicon'
            traits_header = 'traits'
            for amplicon_code, fname in self.amplicon_files('*.taxonomy.gz'):
                logger.warning('reading taxonomy file: {}'.format(fname))
                amplicon = None
                with gzip.open(fname, 'rt') as fd:
                    reader = csv.reader(fd, dialect='excel-tab')
                    header = next(reader)
                    amplicon_header_index = header.index(amplicon_header) if amplicon_header in header else -1 
                    traits_header_index = header.index(traits_header) if traits_header in header else -1
                    hasTraits = traits_header_index != -1
                    if hasTraits:
                        assert(header[traits_header_index] == traits_header)
                    assert(header[0] == otu_header)
                    assert(header[amplicon_header_index] == amplicon_header)
                    taxo_header = header[1:amplicon_header_index]
                    for idx, row in enumerate(csv.reader(fd, dialect='excel-tab')):
                        code = row[0]
                        if not code_re.match(code) and not code.startswith('mxa_'):
                            raise Exception("invalid OTU code: {}".format(code))
                        # Convert String value to PSQL Array Value Input format '{ val1 delim val2 delim ... }'
                        traits = row[traits_header_index] if hasTraits else ""
                        if traits:
                            traits = traits.replace(";", ",")
                            traits = "{"+",".join('"{}"'.format(i) for i in traits.split(','))+"}"
                        obj = {
                            'amplicon': row[amplicon_header_index],
                            'traits': traits,
                            'otu': code,
                        }
                        if amplicon is None:
                            amplicon = obj['amplicon']
                        if amplicon != obj['amplicon']:
                            raise Exception(
                                'more than one amplicon in folder: {} vs {}'.format(amplicon, obj['amplicon']))
                        obj.update(zip(taxo_header, row[1:amplicon_header_index]))
                        yield obj
                self.amplicon_code_names[amplicon_code.lower()] = amplicon
                taxonomy_file_info[fname] = {
                    'file_type': 'Taxonomy',
                    'rows_imported': idx + 1,
                    'rows_skipped': 0
                }

        logger.warning("loading taxonomies - pass 1, defining ontologies")
        mappings = self._load_ontology(ontologies, _taxon_rows_iter())

        logger.warning("loading taxonomies - pass 2, defining OTUs")
        try:
            with tempfile.NamedTemporaryFile(mode='w', dir='/data', prefix='bpaotu-', delete=False) as temp_fd:
                fname = temp_fd.name
                os.chmod(fname, 0o644)
                logger.warning("writing out taxonomy data to CSV tempfile: {}".format(fname))
                w = csv.writer(temp_fd)
                w.writerow(taxonomy_fields)
                for _id, row in enumerate(_taxon_rows_iter(), 1):
                    otu_key = otu_hash(row['otu'], row['amplicon'])
                    assert(otu_key not in otu_lookup)
                    otu_lookup[otu_key] = _id

                    otu_row = [_id, row['otu']]
                    for field in ontologies:
                        val = row.get(field, '')
                        otu_row.append(mappings.get(field).get(val, ""))
                    otu_row.append(row['traits'])
                    w.writerow(otu_row)
            logger.warning("loading taxonomy data from temporary CSV file")
            try:
                with open(fname, 'r') as fd:
                    raw_conn = self._engine.raw_connection()
                    cur = raw_conn.cursor()
                    cur.copy_expert("COPY otu.otu from stdin CSV HEADER", fd)
                    raw_conn.commit()
                    cur.close()
            except:
                logger.error("Problem loading taxonomy data using raw connection.")
                traceback.print_exc()
            finally:
                raw_conn.commit()
                cur.close()
        finally:
            os.unlink(fname)
        for fname, info in taxonomy_file_info.items():
            self.make_file_log(fname, **info)
        return otu_lookup

    def save_ontology_errors(self, environment_ontology_errors):
        if environment_ontology_errors is None:
            return
        for (environment, ontology_name), invalid_values in environment_ontology_errors.items():
            log = OntologyErrors(
                environment=environment,
                ontology_name=ontology_name,
                invalid_values=sorted(invalid_values))
            self._session.add(log)
        self._session.commit()

    def contextual_rows(self, ingest_cls, name):
        # flatten contextual metadata into dicts
        metadata = defaultdict(dict)
        with DownloadMetadata(logger, ingest_cls, path='/data/{}/'.format(name), has_sql_context=self._has_sql_context, force_fetch=self._force_fetch) as dlmeta:
        # with DownloadMetadata(logger, ingest_cls, path='/data/{}/'.format(name), has_sql_context=True, force_fetch=False) as dlmeta:
            for contextual_source in dlmeta.meta.contextual_metadata:
                self.save_ontology_errors(
                    getattr(contextual_source, "environment_ontology_errors", None))
                for sample_id in contextual_source.sample_ids():
                    metadata[sample_id]['sample_id'] = sample_id
                    metadata[sample_id].update(contextual_source.get(sample_id))

        def has_minimum_metadata(row):
            return 'latitude' in row and 'longitude' in row \
                and isinstance(row['latitude'], float) and isinstance(row['longitude'], float)

        rows = []
        for entry in metadata.values():
            if not has_minimum_metadata(entry):
                self.sample_metadata_incomplete.add(
                    entry['sample_id'].split('/')[-1])
                continue
            rows.append(entry)
        return rows

    def contextual_row_context(self, metadata, ontologies, mappings, fields_used):
        for row in metadata:
            sample_id = row['sample_id']
            if sample_id is None:
                continue
            attrs = {
                'id': sample_id.split('/')[-1]
            }
            for field in ontologies:
                if field not in row or field == '' or row[field] == '':
                    continue
                attrs[field + '_id'] = mappings[field][row[field]]
            for field, value in row.items():
                # Skipping fields already added to attrs dict and those not exists in sample_context table of otu DB
                if field in attrs or (field + '_id') in attrs or field == 'sample_id' or field not in set(t.name for t in SampleContext.__table__.columns):
                    continue

                # Replacing empty value with None
                if value == '':
                    value = None

                attrs[field] = value
            fields_used.update(set(attrs.keys()))
            yield SampleContext(**attrs)

    def load_contextual_metadata(self):
        # we have a bit of a broken window in the SampleContext class, so we
        # check whether or not we are using all the fields to assist us when
        # updating the code for new versions of the source spreadsheet
        utilised_fields = set()
        logger.warning("loading contextual metadata")
        metadata = self.contextual_rows(AccessAMDContextualMetadata, name='amd-metadata')
        mappings = self._load_ontology(DataImporter.amd_ontologies, metadata)
        for obj in self.contextual_row_context(metadata, DataImporter.amd_ontologies, mappings, utilised_fields):
            self._session.add(obj)
            self._session.commit()
        self._session.commit()
        unused = set(t.name for t in SampleContext.__table__.columns) - utilised_fields
        if unused:
            logger.info("Unutilised fields:")
            for field in sorted(unused):
                logger.info(field)
        # set methodology to store version of code and contextual DB in this format (<packagename>_<version>_<SQLite DB>)
        db_file = ""
        analysis_version = ""
        source_tar = ""
        if len(metadata) > 0:
            db_file = metadata[0]["sample_database_file"]
        # Read analysis_url and analysis_version from version.txt file
        try:
            with open(self._import_base +'version.txt', 'r') as f:
                d = dict(re.findall(r'^(.+)=(.*)$', f.read(), flags=re.M))
                source_tar = d.get("source_tar")
                analysis_version = d.get("analysis_version")
                self._analysis_url = d.get("analysis_url")
        except FileNotFoundError:
            logger.error('Missing version.txt file. Analysis Version and URL will not be added.')       
        self._methodology = f"{__package__}_{__version__}__analysis_{analysis_version}__{db_file}__{source_tar}"

    def _otu_abundance_rows(self, fd, amplicon_code, otu_lookup):
        reader = csv.reader(fd, dialect='excel-tab')
        header = next(reader)

        assert(header == ["#OTU ID", "Sample_only", "Abundance"])
        integer_re = re.compile(r'^[0-9]+$')
        samn_id_re = re.compile(r"^SAMN(\d+)$")

        for otu_code, sample_id, count in reader:
            float_count = float(count)
            int_count = int(float_count)
            # make sure that fractional values don't creep in on a future ingest
            assert(int_count - float_count == 0)
            if not integer_re.match(sample_id):
                if not samn_id_re.match(sample_id):
                    if sample_id not in self.sample_non_integer:
                        logger.warning('[{}] skipped non-integer sample ID: {}'.format(amplicon_code, sample_id))
                        self.sample_non_integer.add(sample_id)
                    continue
            hash = otu_hash(otu_code, self.amplicon_code_names[amplicon_code.lower()])
            otu_id = otu_lookup.get(hash)
            if not otu_id:
                continue
            yield otu_id, sample_id, int_count

    def load_otu_abundance(self, otu_lookup):
        def _make_sample_otus(fname, amplicon_code, present_sample_ids):
            with gzip.open(fname, 'rt') as fd:
                tuple_rows = self._otu_abundance_rows(fd, amplicon_code, otu_lookup)
                rows_skipped = 0
                for entry, (otu_id, sample_id, count) in enumerate(tuple_rows):
                    if sample_id not in present_sample_ids:
                        if sample_id not in self.sample_metadata_incomplete \
                                and sample_id not in self.sample_non_integer:
                            self.sample_not_in_metadata.add(sample_id)
                        rows_skipped += 1
                        continue
                    yield (sample_id, otu_id, count)
                self.make_file_log(
                    fname, file_type='Abundance', rows_imported=(entry + 1), rows_skipped=rows_skipped)

        logger.warning('Loading OTU abundance tables')

        present_sample_ids = set([t[0] for t in self._session.query(SampleContext.id)])

        for amplicon_code, sampleotu_fname in self.amplicon_files('*[0-9].txt.gz'):
            def log_amplicon(msg):
                logger.warning('[{}] {}'.format(amplicon_code, msg))
            try:
                log_amplicon("reading from: {}".format(sampleotu_fname))
                with tempfile.NamedTemporaryFile(mode='w', dir='/data', prefix='bpaotu-', delete=False) as temp_fd:
                    fname = temp_fd.name
                    os.chmod(fname, 0o644)
                    log_amplicon("writing out OTU abundance data to CSV tempfile: {}".format(fname))
                    w = csv.writer(temp_fd)
                    w.writerow(['sample_id', 'otu_id', 'count'])
                    w.writerows(_make_sample_otus(sampleotu_fname, amplicon_code, present_sample_ids))
                log_amplicon("loading OTU abundance data into database")
                try:
                    with open(fname, 'r') as fd:
                        raw_conn = self._engine.raw_connection()
                        cur = raw_conn.cursor()
                        cur.copy_expert("COPY otu.sample_otu from stdin CSV HEADER", fd)
                except:  # noqa
                    log_amplicon("unable to import {}".format(sampleotu_fname))
                    traceback.print_exc()
                finally:
                    raw_conn.commit()
                    cur.close()
            finally:
                os.unlink(fname)

    def load_otu_abundance_20k(self, otu_lookup):
        def _make_sample_otus(fname, amplicon_code, present_sample_ids):
            with gzip.open(fname, 'rt') as fd:
                tuple_rows = self._otu_abundance_rows(fd, amplicon_code, otu_lookup)
                rows_skipped = 0
                for entry, (otu_id, sample_id, count) in enumerate(tuple_rows):
                    if sample_id not in present_sample_ids:
                        if sample_id not in self.sample_metadata_incomplete \
                                and sample_id not in self.sample_non_integer:
                            self.sample_not_in_metadata.add(sample_id)
                        rows_skipped += 1
                        continue
                    yield (sample_id, otu_id, count)
                self.make_file_log(
                    fname, file_type='Abundance', rows_imported=(entry + 1), rows_skipped=rows_skipped)

        logger.warning('Loading OTU abundance 20k tables')

        present_sample_ids = set([t[0] for t in self._session.query(SampleContext.id)])

        for amplicon_code, sampleotu_fname in self.amplicon_files('*_20K.txt.gz'):
            def log_amplicon(msg):
                logger.warning('[{}] {}'.format(amplicon_code, msg))
            try:
                log_amplicon("reading from: {}".format(sampleotu_fname))
                with tempfile.NamedTemporaryFile(mode='w', dir='/data', prefix='bpaotu-', delete=False) as temp_fd:
                    fname = temp_fd.name
                    os.chmod(fname, 0o644)
                    log_amplicon("writing out OTU abundance 20k data to CSV tempfile: {}".format(fname))
                    w = csv.writer(temp_fd)
                    w.writerow(['sample_id', 'otu_id', 'count'])
                    w.writerows(_make_sample_otus(sampleotu_fname, amplicon_code, present_sample_ids))
                log_amplicon("loading OTU abundance 20k data into database")
                try:
                    with open(fname, 'r') as fd:
                        raw_conn = self._engine.raw_connection()
                        cur = raw_conn.cursor()
                        cur.copy_expert("COPY otu.sample_otu_20k from stdin CSV HEADER", fd)
                except:  # noqa
                    log_amplicon("unable to import {}".format(sampleotu_fname))
                    traceback.print_exc()
                finally:
                    raw_conn.commit()
                    cur.close()
            finally:
                os.unlink(fname)
