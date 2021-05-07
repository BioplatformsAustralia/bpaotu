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
                  SampleLandUse, SampleOTU, SampleProfilePosition,
                  SampleStorageMethod, SampleTillage, SampleType,
                  SampleVegetationType,
                  SampleIntegrityWarnings, SampleVolumeNotes, SampleBioticRelationship,
                  SampleEnvironmentMedium,
                  SampleHostAssociatedMicrobiomeZone, SampleHostType,
                  make_engine)

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

    def __init__(self, import_base, revision_date):
        self.amplicon_code_names = {}  # mapping from dirname to amplicon ontology
        self._engine = make_engine()
        self._create_extensions()
        self._session = sessionmaker(bind=self._engine)()
        self._import_base = import_base
        self._methodology = 'v1'
        self._revision_date = revision_date

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
            revision_date=datetime.datetime.strptime(self._revision_date, "%Y-%m-%d").date(),
            imported_at=datetime.date.today(),
            uuid=str(uuid.uuid4()),
            sampleotu_count=self._session.query(SampleOTU).count(),
            samplecontext_count=self._session.query(SampleContext).count(),
            otu_count=self._session.query(OTU).count()))
        self._session.commit()

    def _create_extensions(self):
        extensions = ('citext',)
        for extension in extensions:
            try:
                logger.info("creating extension: {}".format(extension))
                self._engine.execute('CREATE EXTENSION {};'.format(extension))
            except sqlalchemy.exc.ProgrammingError as e:
                if 'already exists' not in str(e):
                    logger.critical("couldn't create extension: {} ({})".format(extension, e))

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

    @classmethod
    def classify_fields(cls, environment_lookup):
        # flip around to name -> id
        pl = dict((t[1], t[0]) for t in environment_lookup.items())
        # TODO: Remove hardcoded soil fields
        # Hardcoded Soil fields
        hardcoded_soil_fields = [
            'id',
            'source_mat_id',
            'utc_date_sampled',
            'utc_time_sampled',
            'collection_date',
            'longitude',
            'latitude',
            'lat_lon',
            'geo_loc_name',
            'sample_site_location_description',
            'sample_submitter',
            'sample_attribution',
            'funding_agency',
            'samp_collect_device',
            'samp_mat_process',
            'store_cond',
            'biotic_relationship',
            'env_medium',
            'env_material',
            'env_broad_scale',
            'env_local_scale',
            'general_env_feature',
            'vegetation_type',
            'notes',
            'depth_lower',
            'depth_upper',
            'depth',
            'sample_type',
            'sample_integrity_warnings',
            'nucl_acid_ext',
            'agrochem_addition',
            'ammonium_nitrogen_wt',
            'ammonium_nitrogen_wt_meth',
            'antimony',
            'antimony_meth',
            'arsenic',
            'arsenic_meth',
            'barium',
            'barium_meth',
            'boron_hot_cacl2',
            'boron_hot_cacl2_meth',
            'cadmium',
            'cadmium_meth',
            'cation_exchange_capacity',
            'cation_exchange_capacity_meth',
            'cerium',
            'cerium_meth',
            'cesium',
            'cesium_meth',
            'chromium',
            'chromium_meth',
            'citation',
            'clay',
            'clay_meth',
            'coastal_id',
            'cobalt',
            'cobalt_meth',
            'color',
            'conductivity',
            'conductivity_meth',
            'course_sand',
            'course_sand_meth',
            'crop_rotation_1yr_since_present',
            'crop_rotation_2yrs_since_present',
            'crop_rotation_3yrs_since_present',
            'crop_rotation_4yrs_since_present',
            'crop_rotation_5yrs_since_present',
            'cur_land_use',
            'date_since_change_in_land_use',
            'density',
            'density_meth',
            'description',
            'dtpa_copper',
            'dtpa_copper_meth',
            'dtpa_iron',
            'dtpa_iron_meth',
            'dtpa_manganese',
            'dtpa_manganese_meth',
            'dtpa_zinc',
            'dtpa_zinc_meth',
            'dysprosium',
            'dysprosium_meth',
            'elev',
            'erbium',
            'erbium_meth',
            'europium',
            'europium_meth',
            'exc_aluminium',
            'exc_aluminium_meth',
            'exc_calcium',
            'exc_calcium_meth',
            'exc_magnesium',
            'exc_magnesium_meth',
            'exc_potassium',
            'exc_potassium_meth',
            'exc_sodium',
            'exc_sodium_meth',
            'extreme_event',
            'fine_sand',
            'fine_sand_meth',
            'fire',
            'fire_intensity_if_known',
            'flooding',
            'gadolinium',
            'gadolinium_meth',
            'gallium',
            'gallium_meth',
            'germanium',
            'germanium_meth',
            'gold',
            'gold_meth',
            'gravel',
            'gravel_percent_meth',
            'hafnium',
            'hafnium_meth',
            'holmium',
            'holmium_meth',
            'horizon',
            'immediate_previous_land_use',
            'iridium',
            'iridium_meth',
            'lanthanum',
            'lanthanum_meth',
            'lead',
            'lead_meth',
            'local_class',
            'local_class_meth',
            'lutetium',
            'lutetium_meth',
            'microbial_biomass',
            'microbial_biomass_meth',
            'molybdenum',
            'molybdenum_meth',
            'neodymium',
            'neodymium_meth',
            'nickel',
            'nickel_meth',
            'niobium_columbium',
            'niobium_columbium_meth',
            'nitrate_nitrogen',
            'nitrate_nitrogen_meth',
            'nitrite',
            'nitrite_meth',
            'organic_carbon',
            'organic_carbon_meth',
            'osmium',
            'osmium_meth',
            'palladium',
            'palladium_meth',
            'ph',
            'ph_meth',
            'ph_solid_h2o',
            'ph_solid_h2o_meth',
            'phosphorus_colwell',
            'phosphorus_colwell_meth',
            'platinum',
            'platinum_meth',
            'potassium_colwell',
            'potassium_colwell_meth',
            'praseodymium',
            'praseodymium_meth',
            'profile_position',
            'rhodium',
            'rhodium_meth',
            'rubidium',
            'rubidium_meth',
            'ruthenium',
            'ruthenium_meth',
            'samarium',
            'samarium_meth',
            'sand',
            'sand_meth',
            'scandium',
            'scandium_meth',
            'selenium',
            'selenium_meth',
            'silt',
            'silt_meth',
            'silver',
            'silver_meth',
            'slope_aspect',
            'slope_aspect_meth',
            'slope_gradient',
            'slope_gradient_meth',
            'strontium',
            'strontium_meth',
            'sulphur',
            'sulphur_meth',
            'tantalum',
            'tantalum_meth',
            'temp',
            'temp_meth',
            'terbium',
            'terbium_meth',
            'texture',
            'texture_meth',
            'thorium',
            'thorium_meth',
            'thulium',
            'thulium_meth',
            'tillage',
            'tin',
            'tin_meth',
            'tungsten',
            'tungsten_meth',
            'uranium',
            'uranium_meth',
            'url',
            'vanadium',
            'vanadium_meth',
            'vegetation_dom_grasses',
            'vegetation_dom_shrubs',
            'vegetation_dom_trees',
            'vegetation_total_cover',
            'water_content',
            'water_content_soil_meth',
            'water_holding_capacity',
            'water_holding_capacity_meth',
            'ytterbium',
            'ytterbium_meth',
            'yttrium',
            'yttrium_meth',
            'zirconium',
            'zirconium_meth',
            'sample_metadata_ingest_date',
            'sample_metadata_ingest_file',
            'sample_metadata_update_history'
        ]

        soil_fields = set()
        marine_fields = set()
        for sheet_name, fields in AustralianMicrobiomeSampleContextualSQLite.field_specs.items():
            # environment = AustralianMicrobiomeSampleContextualSQLite.environment_for_sheet(sheet_name)
            for field_info in fields:
                field_name = field_info[0]
                if field_name in DataImporter.amd_ontologies:
                    field_name += '_id'
                elif field_name == 'sample_id':
                    field_name = 'id'
                # am_environment = field_info.am_environment
                am_environment = "Soil" if field_name in hardcoded_soil_fields else 'Marine'
                if 'Soil' in [am_environment]:
                    soil_fields.add(field_name)
                if 'Marine' in [am_environment]:
                    marine_fields.add(field_name)
        soil_only = soil_fields - marine_fields
        marine_only = marine_fields - soil_fields
        r = {}
        if pl.get('Soil'):
            r.update((t, pl['Soil']) for t in soil_only)
        if pl.get('Marine'):
            r.update((t, pl['Marine']) for t in marine_only)
        return r

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
            'kingdom_id', 'phylum_id', 'class_id', 'order_id', 'family_id', 'genus_id', 'species_id', 'amplicon_id']
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
            for amplicon_code, fname in self.amplicon_files('*.taxonomy.gz'):
                logger.warning('reading taxonomy file: {}'.format(fname))
                amplicon = None
                with gzip.open(fname, 'rt') as fd:
                    reader = csv.reader(fd, dialect='excel-tab')
                    header = next(reader)
                    assert(header[0] == otu_header)
                    assert(header[-1] == amplicon_header)
                    taxo_header = header[1:-1]
                    for idx, row in enumerate(csv.reader(fd, dialect='excel-tab')):
                        code = row[0]
                        if not code_re.match(code) and not code.startswith('mxa_'):
                            raise Exception("invalid OTU code: {}".format(code))
                        obj = {
                            'amplicon': row[-1],
                            'otu': code,
                        }
                        if amplicon is None:
                            amplicon = obj['amplicon']
                        if amplicon != obj['amplicon']:
                            raise Exception(
                                'more than one amplicon in folder: {} vs {}'.format(amplicon, obj['amplicon']))
                        obj.update(zip(taxo_header, row[1:-1]))
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
                        otu_row.append(mappings[field][val])
                    w.writerow(otu_row)
            logger.warning("loading taxonomy data from temporary CSV file")
            self._engine.execute(
                text('''COPY otu.otu from :csv CSV header''').execution_options(autocommit=True),
                csv=fname)
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
        with DownloadMetadata(logger, ingest_cls, path='/data/{}/'.format(name), has_sql_context=True) as dlmeta:
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
        # set methodology to store version of git_revision and contextual DB in format (bpaotu_<git_revision>_<SQLite DB>)
        if len(metadata) > 0:
            git_revision = subprocess.check_output(["git", "describe", "--always"], cwd=os.path.dirname(os.path.realpath(__file__))).strip().decode()
            db_file = metadata[0]["sample_database_file"]
            self._methodology = f"bpaotu_{git_revision}_{db_file}"

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
            otu_id = otu_lookup.get(otu_hash(otu_code, self.amplicon_code_names[amplicon_code.lower()]))
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
                    fname, file_type='Abundance', rows_imported=entry, rows_skipped=rows_skipped)

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
                    self._engine.execute(
                        text('''COPY otu.sample_otu from :csv CSV header''').execution_options(autocommit=True),
                        csv=fname)
                except:  # noqa
                    log_amplicon("unable to import {}".format(sampleotu_fname))
                    traceback.print_exc()
            finally:
                os.unlink(fname)
