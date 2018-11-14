import os
import csv
import tempfile
import traceback
import logging
import sqlalchemy
import gzip
from sqlalchemy.schema import CreateSchema, DropSchema
from sqlalchemy.sql.expression import text
from hashlib import md5
from sqlalchemy.orm import sessionmaker
from glob import glob
from bpaingest.projects.amdb.ingest import AccessBASEContextualMetadata, AccessMarineMicrobesContextualMetadata
from bpaingest.metadata import DownloadMetadata

from collections import (
    defaultdict,
    OrderedDict)
from itertools import zip_longest
from .models import (
    ImportSamplesMissingMetadataLog,
    ImportFileLog,
    ImportOntologyLog)
from .otu import (
    Base,
    Environment,
    OTUAmplicon,
    OTUKingdom,
    OTUPhylum,
    OTUClass,
    OTUOrder,
    OTUFamily,
    OTUGenus,
    OTUSpecies,
    SampleContext,
    SampleHorizonClassification,
    SampleStorageMethod,
    SampleLandUse,
    SampleEcologicalZone,
    SampleVegetationType,
    SampleProfilePosition,
    SampleAustralianSoilClassification,
    SampleFAOSoilClassification,
    SampleTillage,
    SampleType,
    SampleColor,
    SCHEMA,
    make_engine)


TAXONOMY_FIELDS = [
    'id', 'code',
    'kingdom_id', 'phylum_id', 'class_id', 'order_id', 'family_id', 'genus_id', 'species_id', 'amplicon_id']

logger = logging.getLogger("rainbow")


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


def otu_hash(code):
    return md5(code.encode('ascii')).digest()


class DataImporter:
    # note: some files have species, some don't
    taxonomy_header = ['#OTU ID', 'kingdom', 'phylum', 'class', 'order', 'family', 'genus']
    soil_ontologies = OrderedDict([
        ('environment', Environment),
        ('sample_type', SampleType),
        ('horizon_classification', SampleHorizonClassification),
        ('soil_sample_storage_method', SampleStorageMethod),
        ('broad_land_use', SampleLandUse),
        ('detailed_land_use', SampleLandUse),
        ('general_ecological_zone', SampleEcologicalZone),
        ('vegetation_type', SampleVegetationType),
        ('profile_position', SampleProfilePosition),
        ('australian_soil_classification', SampleAustralianSoilClassification),
        ('fao_soil_classification', SampleFAOSoilClassification),
        ('immediate_previous_land_use', SampleLandUse),
        ('tillage', SampleTillage),
        ('color', SampleColor),
    ])

    marine_ontologies = OrderedDict([
        ('environment', Environment),
        ('sample_type', SampleType),
    ])

    def __init__(self, import_base):
        self._clear_import_log()
        self._engine = make_engine()
        self._create_extensions()
        self._session = sessionmaker(bind=self._engine)()
        self._import_base = import_base
        try:
            self._session.execute(DropSchema(SCHEMA, cascade=True))
        except sqlalchemy.exc.ProgrammingError:
            self._session.invalidate()
        self._session.execute(CreateSchema(SCHEMA))
        self._session.commit()
        Base.metadata.create_all(self._engine)
        self.ontology_init()

    def ontology_init(self):
        # set blank as an option for all ontologies, bar Environment
        all_cls = set(
            c for c
            in list(self.marine_ontologies.values()) + list(self.soil_ontologies.values())
            if c is not Environment)
        for db_class in all_cls:
            instance = db_class(id=0, value='')
            self._session.add(instance)
        self._session.commit()

    def complete(self):
        self._session.close()
        self._analyze()

    def _clear_import_log(self):
        logger.info("Clearing import log")
        for log_cls in (ImportSamplesMissingMetadataLog, ImportFileLog, ImportOntologyLog):
            log_cls.objects.all().delete()

    def _create_extensions(self):
        extensions = ('citext',)
        for extension in extensions:
            try:
                logger.info("creating extension: %s" % extension)
                self._engine.execute('CREATE EXTENSION %s;' % extension)
            except sqlalchemy.exc.ProgrammingError as e:
                if 'already exists' not in str(e):
                    logger.critical("couldn't create extension: %s (%s)" % (extension, e))

    def _analyze(self):
        logger.info("Completing ingest: analyze")
        self._engine.execute('ANALYZE;')

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

        mappings = {}
        for db_class, fields in by_class.items():
            map_dict = self._build_ontology(db_class, vals[db_class])
            for field in fields:
                mappings[field] = map_dict
        return mappings

    @classmethod
    def classify_fields(cls, environment_lookup):
        # flip around to name -> id
        pl = dict((t[1], t[0]) for t in environment_lookup.items())

        soil_fields = set()
        marine_fields = set()
        for field_info in soil_field_spec:
            field_name = field_info[0]
            if field_name in DataImporter.soil_ontologies:
                field_name += '_id'
            soil_fields.add(field_name)
        for data_type, fields in marine_field_specs.items():
            for field_info in fields:
                field_name = field_info[0]
                if field_name in DataImporter.marine_ontologies:
                    field_name += '_id'
                marine_fields.add(field_name)
        soil_only = soil_fields - marine_fields
        marine_only = marine_fields - soil_fields
        r = {}
        r.update((t, pl['Soil']) for t in soil_only)
        r.update((t, pl['Marine']) for t in marine_only)
        return r

    def load_taxonomies(self):
        # md5(otu code) -> otu ID, returned

        otu_lookup = {}
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

        def _taxon_rows_iter():
            for fname in glob(self._import_base + '/*/*.taxonomy.gz'):
                logger.warning('reading taxonomy file: %s' % fname)
                imported = 0
                with gzip.open(fname, 'rt') as fd:
                    for idx, row in enumerate(csv.reader(fd, dialect='excel-tab')):
                        # latest version of the format has a counter running in the first column, which we don't need
                        row = row[1:]
                        if idx == 0:
                            assert(row[:len(self.taxonomy_header)] == self.taxonomy_header)
                            have_species = 'species' in row
                            continue
                        otu = row[0]
                        if have_species:
                            ontology_parts = row[1:]
                        else:
                            ontology_parts = row[1:-1] + ['undefined', row[-1]]
                        assert(len(ontology_parts) == len(ontologies))
                        obj = dict(zip(ontologies.keys(), ontology_parts))
                        obj['otu'] = otu
                        imported += 1
                        yield obj
                ImportFileLog.make_file_log(fname, file_type='Taxonomy', rows_imported=imported, rows_skipped=0)

        logger.warning("loading taxonomies - pass 1, defining ontologies")
        mappings = self._load_ontology(ontologies, _taxon_rows_iter())

        logger.warning("loading taxonomies - pass 2, defining OTUs")
        try:
            with tempfile.NamedTemporaryFile(mode='w', dir='/data', prefix='bpaotu-', delete=False) as temp_fd:
                fname = temp_fd.name
                os.chmod(fname, 0o644)
                logger.warning("writing out taxonomy data to CSV tempfile: %s" % fname)
                w = csv.writer(temp_fd)
                w.writerow(TAXONOMY_FIELDS)
                for _id, row in enumerate(_taxon_rows_iter(), 1):
                    otu_lookup[otu_hash(row['otu'])] = _id
                    out_row = [_id, row['otu']]
                    for field in ontologies:
                        val = row.get(field, '')
                        out_row.append(mappings[field][val])
                    w.writerow(out_row)
            logger.warning("loading taxonomy data from temporary CSV file")
            self._engine.execute(
                text('''COPY otu.otu from :csv CSV header''').execution_options(autocommit=True),
                csv=fname)
        finally:
            os.unlink(fname)
        return otu_lookup

    def contextual_rows(self, ingest_cls, name):
        # flatten contextual metadata into dicts
        metadata = defaultdict(dict)
        with DownloadMetadata(ingest_cls, path='/data/{}/'.format(name)) as dlmeta:
            for contextual_source in dlmeta.meta.contextual_metadata:
                for sample_id in contextual_source.sample_ids():
                    metadata[sample_id]['sample_id'] = sample_id
                    metadata[sample_id].update(contextual_source.get(sample_id))

        # convert into a row-like structure
        return list(metadata.values())

    def contextual_row_context(self, metadata, ontologies, mappings):
        for row in metadata:
            sample_id = row['sample_id']
            if sample_id is None:
                continue
            attrs = {
                'id': int(sample_id.split('.')[-1])
            }
            for field in ontologies:
                if field not in row:
                    continue
                attrs[field + '_id'] = mappings[field][row[field]]
            for field, value in row.items():
                if field in attrs or (field + '_id') in attrs or field == 'sample_id':
                    continue
                attrs[field] = value
            yield SampleContext(**attrs)

    def load_soil_contextual_metadata(self):
        logger.warning("loading Soil contextual metadata")
        metadata = self.contextual_rows(AccessBASEContextualMetadata, name='soil-contextual')
        mappings = self._load_ontology(DataImporter.soil_ontologies, metadata)
        self._session.bulk_save_objects(self.contextual_row_context(metadata, DataImporter.soil_ontologies, mappings))
        self._session.commit()

    def load_marine_contextual_metadata(self):
        logger.warning("loading Marine contextual metadata")
        metadata = self.contextual_rows(AccessMarineMicrobesContextualMetadata, name='marine-contextual')
        mappings = self._load_ontology(DataImporter.marine_ontologies, metadata)
        self._session.bulk_save_objects(self.contextual_row_context(metadata, DataImporter.marine_ontologies, mappings))
        self._session.commit()

    def _otu_rows(self, fd, otu_lookup):
        reader = csv.reader(fd, dialect='excel-tab')
        header = next(reader)

        assert(header[0] == '#OTU ID')

        # find the four or five-digit BPA IDs: there are integers in here which are not BPA IDs,
        # but they're not in the BPA ID range (currently 7031 -> 58020). FIXME, this is crude
        # and it would be better to more clearly identify BPA / non BPA data; discussing with CSIRO
        idx_bpa_id = [(i + 1, try_int(t)) for (i, t) in enumerate(header[1:]) if len(t) == 4 or len(t) == 5]
        idx_bpa_id = [(i, t) for (i, t) in idx_bpa_id if t is not None]

        def _tuplerows():
            for row in reader:
                otu_code = row[0]
                otu_id = otu_lookup.get(otu_hash(otu_code))
                if otu_id is None:
                    logger.critical(['OTU not defined', otu_code])
                    continue
                for idx, bpa_id in idx_bpa_id:
                    count = row[idx]
                    if count == '' or count == '0' or count == '0.0':
                        continue
                    count = int(float(count))
                    if count == 0:
                        continue
                    yield otu_id, bpa_id, count

        return [t[1] for t in idx_bpa_id], _tuplerows()

    def _find_missing_bpa_ids(self, otu_lookup):
        def _missing_bpa_ids(fname):
            have_bpaids = set([t[0] for t in self._session.query(SampleContext.id)])
            with gzip.open(fname, 'rt') as fd:
                bpa_ids, _ = self._otu_rows(fd, otu_lookup)
                for bpa_id in bpa_ids:
                    if bpa_id not in have_bpaids:
                        yield bpa_id

        missing_bpa_ids = set()
        for fname in glob(self._import_base + '/*/*.txt.gz'):
            logger.warning("first pass, reading from: %s" % (fname))
            missing_bpa_ids |= set(_missing_bpa_ids(fname))
        return missing_bpa_ids

    def load_otu_abundance(self, otu_lookup):
        def _make_sample_otus(fname, skip_missing):
            # note: (for now) we have to cope with duplicate columns in the input files.
            # we just make sure they don't clash, and this can be reported to CSIRO
            with gzip.open(fname, 'rt') as fd:
                bpa_ids, tuple_rows = self._otu_rows(fd, otu_lookup)
                for entry, (otu_id, bpa_id, count) in enumerate(tuple_rows):
                    if bpa_id in skip_missing:
                        continue
                    yield (bpa_id, otu_id, count)
                ImportFileLog.make_file_log(fname, file_type='Abundance', rows_imported=entry, rows_skipped=0)

        logger.warning('Loading OTU abundance tables')

        missing_bpa_ids = self._find_missing_bpa_ids(otu_lookup)
        if missing_bpa_ids:
            il = ImportSamplesMissingMetadataLog(samples_without_metadata=list(sorted(missing_bpa_ids)))
            il.save()

        for sampleotu_fname in glob(self._import_base + '/*/*.txt.gz'):
            try:
                logger.warning("second pass, reading from: %s" % (sampleotu_fname))
                with tempfile.NamedTemporaryFile(mode='w', dir='/data', prefix='bpaotu-', delete=False) as temp_fd:
                    fname = temp_fd.name
                    os.chmod(fname, 0o644)
                    logger.warning("writing out OTU abundance data to CSV tempfile: %s" % fname)
                    w = csv.writer(temp_fd)
                    w.writerow(['sample_id', 'otu_id', 'count'])
                    w.writerows(_make_sample_otus(sampleotu_fname, missing_bpa_ids))
                logger.warning("loading OTU abundance data from temporary CSV file")
                try:
                    self._engine.execute(
                        text('''COPY otu.sample_otu from :csv CSV header''').execution_options(autocommit=True),
                        csv=fname)
                except:  # noqa
                    logger.critical("unable to import %s" % (sampleotu_fname))
                    traceback.print_exc()
            finally:
                os.unlink(fname)
