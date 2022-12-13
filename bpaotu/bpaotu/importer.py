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

from django.conf import settings

import sqlalchemy
from bpaingest.metadata import DownloadMetadata
from bpaingest.projects.amdb.sqlite_contextual import \
    AustralianMicrobiomeSampleContextualSQLite
from bpaingest.projects.amdb.ingest import AccessAMDContextualMetadata
from sqlalchemy import (MetaData, ARRAY, Table, Column, ForeignKey, Integer,
                        String, select, func, insert, and_)
from sqlalchemy.orm import sessionmaker
from sqlalchemy.schema import CreateSchema, DropSchema
from sqlalchemy.sql.expression import text

from .otu import (OTU, SCHEMA, Base, Environment, ExcludedSamples,
                  ImportedFile, ImportMetadata, OntologyErrors, OTUAmplicon,
                  taxonomy_keys, taxonomy_key_id_names, rank_labels_lookup,
                  TaxonomySource, taxonomy_ontology_classes, format_taxonomy_name,
                  SampleAustralianSoilClassification,
                  SampleColor, SampleContext, SampleEcologicalZone,
                  SampleHorizonClassification,
                  SampleLandUse, SampleOTU, OTUSampleOTU,
                  SampleProfilePosition,
                  SampleStorageMethod, SampleTillage, SampleType,
                  SampleVegetationType,
                  SampleIntegrityWarnings, SampleVolumeNotes, SampleBioticRelationship,
                  SampleEnvironmentMedium,
                  SampleHostAssociatedMicrobiomeZone, SampleHostType, Taxonomy, taxonomy_otu,
                  make_engine, refresh_otu_sample_otu_mv)

logger = logging.getLogger("rainbow")


class DataImportError(Exception):
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


from contextlib import contextmanager
@contextmanager
def tmp_csv_file():
    with tempfile.NamedTemporaryFile(mode='w+',
                                     dir=settings.BPAOTU_TMP_DIR,
                                     prefix='bpaotu-') as temp_fd:
        fname = temp_fd.name
        os.chmod(fname, 0o644)
        w = csv.writer(temp_fd)
        yield w, temp_fd
        temp_fd.close() # delete now, rather than waiting for garbage collection


class TaxonomyRowsIterator:
    hierarchy_type_by_source = {}
    taxonomy_file_info = {}
    code_re = re.compile(r'^([GATC]+)|([a-z0-9]{32}$)') # GATC string or md5sum
    otu_header = '#otu id'
    amplicon_header = 'amplicon'
    traits_header = 'traits'

    def __init__(self, taxonomy_files):
        self.taxonomy_files = tuple(taxonomy_files)

    def __iter__(self):
        self.hierarchy_type_by_source = {}
        self.taxonomy_file_info = {}
        amplicons_by_code = {}
        for amplicon_code, fname in self.taxonomy_files:
            logger.info('reading taxonomy file: {}'.format(fname))
            taxonomy_db, taxonomy_method = fname.split('.')[-4:-2]
            taxonomy_source = format_taxonomy_name(taxonomy_db, taxonomy_method)
            with gzip.open(fname, 'rt') as fd:
                reader = csv.reader(fd, dialect='excel-tab')
                header = [name.lower() for name in next(reader)]
                try:
                    amplicon_header_index = header.index(self.amplicon_header)
                except ValueError:
                    raise DataImportError("No amplicon column header in {}".format(fname))
                traits_header_index = header.index(self.traits_header) if self.traits_header in header else -1
                if header[0] != self.otu_header:
                    raise DataImportError("First column must be OTU in {}".formate(fname))
                # Assume all the taxonomy fields are before the amplicon field
                taxo_header_lower = header[1:amplicon_header_index]
                h = set(taxo_header_lower)
                for hierarchy_type, headings in enumerate(rank_labels_lookup):
                    selected_header = [label.lower() for label in headings]
                    if h.issuperset(set(selected_header)):
                        break
                else:
                    raise DataImportError("Unrecognisable header in {}".format(fname))
                if self.hierarchy_type_by_source.get(taxonomy_source) not in (None, hierarchy_type):
                    raise DataImportError("Header for {} must be \"{}\" in {}".format(
                        taxonomy_source, self.hierarchy_type_by_source[taxonomy_source], fname))
                self.hierarchy_type_by_source[taxonomy_source] = hierarchy_type

                # Need to map column header names to corresponding rank
                # names. selected_header can be shorter than taxonomy_keys,
                # in which case some ranks are not used for the corresponding
                # taxonomy_source
                taxo_header_map = dict(zip(selected_header, taxonomy_keys[1:]))
                ranks_for_header = [taxo_header_map.get(k) for k in taxo_header_lower]

                amplicon = None
                for idx, row in enumerate(reader):
                    code = row[0]
                    if not self.code_re.match(code) and not code.startswith('mxa_'):
                        raise DataImportError('Invalid OTU code "{}" in {}'.format(code, fname))
                    traits = (row[traits_header_index].replace(";", ",").strip()
                                if traits_header_index > -1 else "")
                    if traits:
                        if re.search(r'["{}\\]', traits):
                            raise DataImportError('Invalid character in traits "{}" in {}'.format(traits, fname))
                        # Convert String value to PSQL Array Value Input format '{ val1 delim val2 delim ... }'
                        traits = "{"+",".join('"{}"'.format(i.strip()) for i in traits.split(','))+"}"
                    obj = dict((k, v) for (k, v) in
                                zip(ranks_for_header, row[1:amplicon_header_index])
                                if k is not None)
                    obj.update({
                        'taxonomy_source': taxonomy_source,
                        'amplicon': row[amplicon_header_index],
                        'amplicon_code': amplicon_code,
                        'traits': traits,
                        'otu': code,
                    })
                    if amplicon is None:
                        amplicon = obj['amplicon']
                        v = amplicons_by_code.get(amplicon_code)
                        if v not in (None, amplicon):
                            raise DataImportError(
                                'More than one amplicon in directory: {} vs {}'.format(amplicon, v))
                        amplicons_by_code[amplicon_code] = amplicon
                    elif amplicon != obj['amplicon']:
                        raise DataImportError(
                            'More than one amplicon in {}: {} vs {}'.format(
                                fname, amplicon, obj['amplicon']))
                    yield obj
            self.taxonomy_file_info[fname] = {
                'file_type': 'Taxonomy',
                'rows_imported': idx + 1,
                'rows_skipped': 0
            }

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
        self.load_otu_abundance(otu_lookup)
        refresh_otu_sample_otu_mv(self._session, OTUSampleOTU.__table__)
        self.complete()

    def ontology_init(self):
        # set blank as an option for all ontologies, bar Environment
        all_cls = set(
            c for c
            in list(self.amd_ontologies.values())
            if c is not Environment)
        # Unused taxonomy ranks can also be blank
        min_required = min(len(labels) for labels in rank_labels_lookup)
        all_cls |= set(taxonomy_ontology_classes[min_required:])
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

    def _load_ontology(self, ontology_defn, row_iter):
        # import the ontologies, and build a mapping from
        # permitted values into IDs in those ontologies
        by_class = defaultdict(list)
        for field, db_class in ontology_defn.items():
            by_class[db_class].append(field)

        vals = defaultdict(set)
        for row in row_iter:
            for db_class, fields in by_class.items():
                for field in fields:
                    if field in row:
                        vals[db_class].add(row[field])

        # blow up if any of the ontologies hasn't worked
        for db_class, val_set in vals.items():
            if len(val_set) == 0:
                raise DataImportError("empty ontology: {}".format(db_class))

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

    def load_from_csv(self, sql_copy_stmt, fd, conn=None):
        try:
            fd.flush()
            fd.seek(0)
            raw_conn = conn.connection if conn else self._engine.raw_connection()
            cur = raw_conn.cursor()
            cur.copy_expert(sql_copy_stmt, fd)
        except:
            logger.error("Problem loading data from {} with \"{}\".".format(
                fd.name, sql_copy_stmt),
                exc_info=True)
        finally:
            raw_conn.commit()
            cur.close()

    def load_taxonomies(self):
        # md5(otu code) -> otu ID, returned
        otu_lookup = {}
        taxonomy_fields = ( # field names must match field names in tmp_taxonomy_load below
            ['id', 'amplicon_id', 'otu_id', 'traits'] +
            taxonomy_key_id_names)
        ontologies = OrderedDict(
            tuple(zip(taxonomy_keys, taxonomy_ontology_classes)) +
            (('amplicon', OTUAmplicon),))

        taxonomy_rows_iter = TaxonomyRowsIterator(
            self.amplicon_files('*.*.*.taxonomy.gz'))

        logger.info("loading taxonomies - pass 1, defining ontologies")
        mappings = self._load_ontology(
            ontologies,
            taxonomy_rows_iter)
        taxonomy_source_id_by_name = mappings['taxonomy_source']
        for obj in self._session.query(TaxonomySource).all():
            obj.hierarchy_type = taxonomy_rows_iter.hierarchy_type_by_source[obj.value]
        self._session.commit()

        # TODO need nicer taxonomy source names via some kind of lookup (maybe a yaml file)?
        logger.info("loading taxonomies - pass 2, defining OTUs")
        with tmp_csv_file() as (w, otu_fd), tmp_csv_file() as (w2, tax_fd):
            logger.info("Writing OTUs to temporary CSV file {}".format(otu_fd.name))
            logger.info("Writing taxonomies to temporary CSV file {}".format(tax_fd.name))
            for (_id, row) in enumerate(taxonomy_rows_iter, 1):
                ts_id = taxonomy_source_id_by_name[row['taxonomy_source']]
                otu_key = otu_hash(row['otu'], row['amplicon_code'])
                otu_lookup_val = otu_lookup.get(otu_key)

                # Since we can have multiple taxonomies, the same organism can
                # be repeated. Just add the first occurrence to otu.otu.
                # otu,otu.id will not be contiguous, but that's OK.
                if otu_lookup_val:
                    taxonomy_source_ids = otu_lookup_val[1]
                    if ts_id in taxonomy_source_ids:
                        raise DataImportError("Duplicate OTU: {} {} {}".format(
                            row['otu'], row['amplicon'], row['taxonomy_source']))
                    taxonomy_source_ids.add(ts_id)
                else:
                    otu_lookup[otu_key] = otu_lookup_val = (_id, {ts_id})
                    otu_row = [_id, row['otu']]
                    w.writerow(otu_row)

                taxonomy_row = [_id,
                                mappings.get('amplicon').get(row.get('amplicon', ''), ""),
                                otu_lookup_val[0],
                                row['traits']] + [
                    mappings.get(field).get(row.get(field, ''), "")
                    for field in taxonomy_keys]
                w2.writerow(taxonomy_row) # Column order must match taxonomy_fields

            logger.info("Loading OTU data from {}".format(otu_fd.name))
            self.load_from_csv("COPY otu.otu (id, code) FROM STDIN CSV", otu_fd)

            # Build the OTU-Taxonomy many-to-many relationships by loading the
            # taxonomy file data into a temporary table, then deriving
            # Taxonomy() and OTU() from that.

            with self._engine.begin() as conn:
                # New session to contain temporary table lifetime
                tmp_metadata = MetaData()
                rank_columns = [
                    Column(rank_id, Integer, nullable=False)
                    for rank_id in taxonomy_key_id_names]
                temp_table = Table(
                    "tmp_taxonomy_load", tmp_metadata,
                    Column("id", Integer, nullable=False, primary_key=True),
                    Column("amplicon_id", Integer, nullable=False),
                    Column("otu_id", Integer, nullable=False),
                    Column('traits', ARRAY(String)),
                    *rank_columns,
                    prefixes=['TEMPORARY']
                )
                temp_table.create(conn)
                logger.info("Reading taxonomy data from {}".format(tax_fd.name))
                self.load_from_csv("COPY tmp_taxonomy_load (" +
                                ",".join(taxonomy_fields) +
                                ") FROM STDIN CSV", tax_fd, conn)
                # Build Taxonomy() from unique taxonomies + amplicon + traits in
                # tmp_taxonomy_load
                sel = select(
                    [func.min(temp_table.c.id), temp_table.c.amplicon_id, temp_table.c.traits] +
                    [getattr(temp_table.c, name) for name in taxonomy_key_id_names]
                ).group_by('amplicon_id', 'traits', *taxonomy_key_id_names)
                logger.info("Creating taxonomies")
                conn.execute(
                    insert(Taxonomy).from_select(
                        ['id', 'amplicon_id','traits'] + taxonomy_key_id_names,
                        sel)
                )
                # Build the association table that links Taxonomy() to OTU()
                join_clauses = [getattr(temp_table.c, name) == getattr(Taxonomy.__table__.c, name)
                                for name in (taxonomy_key_id_names + ['amplicon_id'])]
                traits_clause = ((Taxonomy.__table__.c.traits == temp_table.c.traits) |
                                 ((Taxonomy.__table__.c.traits == None) &
                                  (temp_table.c.traits == None)))
                logger.info("Connecting OTUs to taxonomies")
                conn.execute(
                    insert(taxonomy_otu).from_select(
                        ['taxonomy_id', 'otu_id'],
                        select([Taxonomy.id, temp_table.c.otu_id]).select_from(
                            temp_table.join(Taxonomy, and_(traits_clause, *join_clauses)))
                    ))

        for fname, info in taxonomy_rows_iter.taxonomy_file_info.items():
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
        with DownloadMetadata(logger, ingest_cls, path='/data/{}/'.format(name),
                              has_sql_context=self._has_sql_context, force_fetch=self._force_fetch) as dlmeta:
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
        column_names = set(t.name for t in SampleContext.__table__.columns)
        for row in metadata:
            sample_id = row['sample_id']
            if sample_id is None:
                continue
            attrs = {
                'id': sample_id.split('/')[-1]
            }
            for field in ontologies:
                if field not in row or field == '':
                    continue
                v = row[field]
                attrs[field + '_id'] = mappings[field][v] if v else 0 # 0 is ontology_fkey() default
            for field, value in row.items():
                if field in attrs or (field + '_id') in attrs or field == 'sample_id' or field not in column_names:
                    continue

                # Replacing empty value with None
                if value == '':
                    value = None

                attrs[field] = value
            fields_used.update(set(attrs.keys()))
            yield attrs

    def load_contextual_metadata(self):
        # we have a bit of a broken window in the SampleContext class, so we
        # check whether or not we are using all the fields to assist us when
        # updating the code for new versions of the source spreadsheet
        utilised_fields = set()
        logger.info("loading contextual metadata")
        metadata = self.contextual_rows(AccessAMDContextualMetadata, name='amd-metadata')
        logger.info("loading sample context ontologies")
        mappings = self._load_ontology(DataImporter.amd_ontologies, metadata)

        column_names = [t.name for t in SampleContext.__table__.columns]
        with tmp_csv_file() as (w, fd):
            logger.info("writing sample context metadata to {}".format(fd.name))
            for row in self.contextual_row_context(metadata, DataImporter.amd_ontologies, mappings, utilised_fields):
                # Note: column order here must match table field order for COPY table FROM STDIN to work
                w.writerow(row.get(k) for k in column_names)
            logger.info("loading sample context metadata from {}".format(fd.name))
            self.load_from_csv("COPY otu.sample_context FROM STDIN CSV", fd)
            unused = set(column_names) - utilised_fields
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
            version_file = self._import_base +'/version.txt'
            with open(version_file, 'r') as f:
                d = dict(re.findall(r'^(.+)=(.*)$', f.read(), flags=re.M))
                source_tar = d.get("source_tar")
                analysis_version = d.get("analysis_version")
                self._analysis_url = d.get("analysis_url")
        except FileNotFoundError:
            logger.error(f'Missing "{version_file}" file. Analysis Version and URL will not be added.')
        self._methodology = f"{__package__}_{__version__}__analysis_{analysis_version}__{db_file}__{source_tar}"

    def _otu_abundance_rows(self, fd, amplicon_code, otu_lookup):
        reader = csv.reader(fd, dialect='excel-tab')
        header = [name.lower() for name in next(reader)]
        expected = ["#otu id", "sample_only", "abundance", "abundance_20k"]
        if header != expected:
            raise DataImportError(
                "Expected tab-separated \"{}\" header in {}".format(' '.join(expected), fd.name))

        integer_re = re.compile(r'^[0-9]+$')
        samn_id_re = re.compile(r"^SAMN(\d+)$")

        for row in reader:
            otu_code, sample_id, count, count_20k = ([f.strip() for f in row] + [""])[:4]
            count_20k = re.sub(r'[.]0*$', '', count_20k) # Should be integer but we can cope with .0
            float_count = float(count)
            int_count = int(float_count)
            # make sure that fractional values don't creep in on a future ingest
            assert(int_count - float_count == 0)
            assert(count_20k == "" or integer_re.match(count_20k))
            if not integer_re.match(sample_id):
                if not samn_id_re.match(sample_id):
                    if sample_id not in self.sample_non_integer:
                        logger.warning('[{}] skipped non-integer sample ID: {}'.format(amplicon_code, sample_id))
                        self.sample_non_integer.add(sample_id)
                    continue
            hash = otu_hash(otu_code, amplicon_code)
            otu_lookup_val = otu_lookup.get(hash)
            if not otu_lookup_val:
                continue
            # Note that an unquoted empty string means NULL to psql COPY. See below
            yield otu_lookup_val[0], sample_id, int_count, count_20k

    def load_otu_abundance(self, otu_lookup):
        def _make_sample_otus(fname, amplicon_code, present_sample_ids):
            with gzip.open(fname, 'rt') as fd:
                tuple_rows = self._otu_abundance_rows(fd, amplicon_code, otu_lookup)
                rows_skipped = 0
                for entry, (otu_id, sample_id, count, count_20k) in enumerate(tuple_rows):
                    if sample_id not in present_sample_ids:
                        if sample_id not in self.sample_metadata_incomplete \
                                and sample_id not in self.sample_non_integer:
                            self.sample_not_in_metadata.add(sample_id)
                        rows_skipped += 1
                        continue
                    yield (sample_id, otu_id, count, count_20k)
                self.make_file_log(
                    fname, file_type='Abundance', rows_imported=(entry + 1), rows_skipped=rows_skipped)

        logger.info('Loading OTU abundance tables')

        present_sample_ids = set([t[0] for t in self._session.query(SampleContext.id)])

        for amplicon_code, sampleotu_fname in self.amplicon_files('*.txt.gz'):
            def log_amplicon(msg):
                logger.info('[{}] {}'.format(amplicon_code, msg))

            log_amplicon("reading from: {}".format(sampleotu_fname))
            with tmp_csv_file() as (w, fd):
                log_amplicon("writing out OTU abundance data to CSV tempfile: {}".format(fd.name))
                w.writerows(_make_sample_otus(sampleotu_fname, amplicon_code, present_sample_ids))
                log_amplicon("loading OTU abundance data into database")
                # count_20k may be an unquoted empty string in the CSV file.
                # COPY will interpret that as NULL by default. See
                # https://www.postgresql.org/docs/current/sql-copy.html
                self.load_from_csv("COPY otu.sample_otu (sample_id, otu_id, count, count_20k) FROM STDIN CSV", fd)
