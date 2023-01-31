import logging
import os

from citext import CIText
from django.conf import settings
from sqlalchemy import (MetaData, ARRAY, Table, Column, Date, Time, Float, ForeignKey, Integer,
                        String, create_engine, select, Index, Boolean, DDL)
from sqlalchemy.sql import func
from sqlalchemy.dialects import postgresql
from sqlalchemy.ext.declarative import declarative_base, declared_attr
from sqlalchemy.orm import relationship
from sqlalchemy_utils import create_materialized_view

logger = logging.getLogger("rainbow")
# Base = declarative_base()
SCHEMA = 'otu'
Base = declarative_base(metadata=MetaData(schema=SCHEMA))


class SchemaMixin():
    """
    we use a specific schema (rather than the public schema) so that the import
    can be easily re-run, simply by deleting the schema. this also keeps
    SQLAlchemy tables out of the way of Django tables, and vice-versa
    """
    __table_args__ = {
        "schema": SCHEMA
    }


class OntologyMixin(SchemaMixin):
    id = Column(Integer, primary_key=True)
    value = Column(String, unique=True, nullable=False)

    @classmethod
    def make_tablename(cls, name):
        return 'ontology_' + name.lower()

    @declared_attr
    def __tablename__(self):
        return self.make_tablename(self.__name__)

    def __repr__(self):
        return "<%s(%s)>" % (type(self).__name__, self.value)


def ontology_fkey(ontology_class, index=False, default=None, nullable=False):
    nm = ontology_class.__name__
    column = Column(
        Integer,
        ForeignKey(SCHEMA + '.' + OntologyMixin.make_tablename(nm) + '.id'),
        index=index,
        nullable=nullable,
        default=default)
    # stash this here for introspection later: saves a lot of manual
    # work with sqlalchemy's relationship() stuff
    column.ontology_class = ontology_class
    return column


def with_attrs(attrs, *args, **kwargs):
    column = Column(*args, **kwargs)
    for k, v in attrs.items():
        setattr(column, k, v)
    return column


class SampleType(OntologyMixin, Base):
    pass


class Environment(OntologyMixin, Base):
    pass


class OTUAmplicon(OntologyMixin, Base):
    pass


taxonomy_keys = [
    'taxonomy_source',
    # r1, r2, ...  generally correspond to kingdom, phylum, ... , species, but vary
    # depending on TaxonomySource(). See rank_labels_lookup
    'r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7', 'r8']

taxonomy_key_id_names = [(r + '_id') for r in taxonomy_keys]
taxonomy_ontology_classes = [type(name, (OntologyMixin, Base), {}) for name in (
    # Must correspond to taxonomy_keys
    'TaxonomySource',
    'OTUr1', 'OTUr2', 'OTUr3', 'OTUr4', 'OTUr5', 'OTUr6', 'OTUr7', 'OTUr8')]

def format_taxonomy_name(taxonomy_db, taxonomy_method):
    return "{} {}".format(taxonomy_db, taxonomy_method)

# Different taxonomies have different rank names. See importer.DataImporter()
TaxonomySource = taxonomy_ontology_classes[0]
TaxonomySource.hierarchy_type = Column(Integer) # Index into rank_labels_lookup

rank_labels_lookup = (
    # Sequence of acceptable taxonomy column headers for taxonomy files, indexed
    # by TaxonomySource.hierarchy_type.  First match wins, so put longer ones
    # first. The field order of each entry is important and must correspond to
    # taxonomy_keys[1:]. Entries can be shorter than r1...r8.
    ('Kingdom', 'Supergroup', 'Division', 'Class', 'Order', 'Family', 'Genus', 'Species'),
    ('Kingdom', 'Phylum', 'Class', 'Order', 'Family', 'Genus', 'Species'),
    ('Kingdom', 'Phylum', 'Class', 'Order', 'Family', 'Genus')
)

taxonomy_otu = Table(
    'taxonomy_otu', Base.metadata,
    Column('otu_id', ForeignKey(SCHEMA + '.otu.id'), primary_key=True),
    Column('taxonomy_id', ForeignKey(SCHEMA + '.taxonomy.id'), primary_key=True)
)

class Taxonomy(SchemaMixin, Base):
    """
    Describes a taxonomy for an OTU (see below). There is a many-to-many
    relationship betweens OTUs and taxonomies: one taxonomy can have many OTUS
    and one OTU can be classified as several taxonomies, each with a different
    taxonomy_source. See taxonomy_otu.
    Note that each OTU should only have one taxonomy per taxonomy source, but
    this is difficult to enforce using database design and constraints without
    allowing other inconsistencies.
    """
    __tablename__ = 'taxonomy'

    id = Column(Integer, primary_key=True)
    amplicon_id = ontology_fkey(OTUAmplicon, index=True)
    amplicon = relationship(OTUAmplicon)
    taxonomy_source_id = ontology_fkey(TaxonomySource, index=True)
    # The taxonomy rank columns are added at runtime - see _setup_taxonomy() below
    traits = Column(ARRAY(String))

    otus = relationship("OTU",
                        secondary=taxonomy_otu,
                        backref="taxonomies")
    taxonomy_source = relationship(TaxonomySource)

    def __repr__(self):
        return "<Taxonomy(%d: amp. %d %s,%s)>" % (
            self.id,
            self.amplicon_id,
            ','.join(getattr(self, a) for a in taxonomy_key_id_names),
            self.traits)

    @classmethod
    def _add_taxonomy_attrs(cls):
        """
        Add taxonomy columns and relationship()s dynamically
        xxx_id = ontology_fkey(OTUxxx)
        xxx = relationship(OTUxxx)
        See https://docs.sqlalchemy.org/en/13/orm/extensions/declarative/basic_use.html#defining-attributes
        """
        for (rank_id, rank, OntologyClass) in zip(taxonomy_key_id_names[1:],
                                                  taxonomy_keys[1:],
                                                  taxonomy_ontology_classes[1:]):
            setattr(cls, rank_id, ontology_fkey(OntologyClass, index=True))
            setattr(cls, rank, relationship(OntologyClass))

Taxonomy._add_taxonomy_attrs()

taxonomy_otu_export = Table(
    # Denormalised and partitioned join of Taxonomy and taxonomy_otu for
    # performance. Ideally this would be a materialized view but they can't be
    # partitioned. Also in psql 10, we can't have primary keys or foreign key
    # references.
    'taxonomy_otu_export',
    Base.metadata,

    Column('amplicon_id', Integer),
    Column('traits', ARRAY(String)),
    Column('otu_id', Integer),
    *[Column(rank_id, Integer) for rank_id in taxonomy_key_id_names],
    postgresql_partition_by='LIST(taxonomy_source_id)'
)

def create_partitions(connection, tablename, ids):
    """
    All taxonomy-based queries are done with a specific taxonomy_source_id. In
    order to get decent performance for data downloads, we want to partition on
    taxonomy_source_id.

    Call this before adding data to the table.

    See https://www.postgresql.org/docs/10/ddl-partitioning.html
    """
    for i in ids:
        connection.execute(DDL(
            "CREATE TABLE otu.{1}_{0} PARTITION OF otu.{1} FOR VALUES IN ({0});".format(
                i, tablename)))
        for col in ['amplicon_id', 'otu_id'] + taxonomy_key_id_names:
            connection.execute(DDL(
                "CREATE INDEX ON otu.{1}_{0} ({2});".format(
                    i, tablename, col)))

class OTU(SchemaMixin, Base):
    """
    Operational Taxonomic Unit. Identifies an organism.
    """
    __tablename__ = 'otu'
    id = Column(Integer, primary_key=True)
    # Think of code as the fingerprint and amplicon as the finger it came from.
    code = Column(String(length=1024), nullable=False)  # long GATTACAt-ype string or hash

    def __repr__(self):
        return "<OTU(%d: %s)>" % (
            self.id,
            self.code)


class SampleHorizonClassification(OntologyMixin, Base):
    pass


class SampleStorageMethod(OntologyMixin, Base):
    pass


class SampleLandUse(OntologyMixin, Base):
    pass


class SampleEcologicalZone(OntologyMixin, Base):
    pass


class SampleVegetationType(OntologyMixin, Base):
    pass


class SampleProfilePosition(OntologyMixin, Base):
    pass


class SampleAustralianSoilClassification(OntologyMixin, Base):
    pass


class SampleFAOSoilClassification(OntologyMixin, Base):
    pass


class SampleTillage(OntologyMixin, Base):
    pass


class SampleColor(OntologyMixin, Base):
    pass

class SampleIntegrityWarnings(OntologyMixin, Base):
    pass

class SampleVolumeNotes(OntologyMixin, Base):
    pass

class SampleBioticRelationship(OntologyMixin, Base):
    pass

class SampleEnvironmentMedium(OntologyMixin, Base):
    pass

class SampleHostAssociatedMicrobiomeZone(OntologyMixin, Base):
    pass

class SampleHostType(OntologyMixin, Base):
    pass

class SampleContext(SchemaMixin, Base):
    __tablename__ = 'sample_context'
    # NB: we use the final component of the ID here
    id = with_attrs({'display_name': 'Sample ID'}, String, primary_key=True)

    # There are a large number of contextual fields, we are merging together all fields from BASE and MM
    # so that they can be queried universally.
    #
    # Note that some columns are CIText when they would be better as either a Float or an ontology:
    # as required we can work with the project managers to resolve data quality issues which force
    # use to use a CIText column
    source_mat_id = Column(CIText)
    utc_date_sampled = Column(Date)
    utc_time_sampled = Column(Time)
    collection_date = Column(CIText)
    longitude = Column(Float)
    latitude = Column(Float)
    lat_lon = Column(CIText)
    geo_loc_name = Column(CIText)
    sample_site_location_description = Column(CIText)
    sample_submitter = Column(CIText)
    sample_attribution = Column(CIText)
    funding_agency = Column(CIText)
    samp_collect_device = Column(CIText)
    samp_mat_process = Column(CIText)
    notes = Column(CIText)
    depth_lower = Column(Float)
    depth_upper = Column(Float)
    depth = Column(Float)
    nucl_acid_ext = Column(CIText)
    dna_concentration_submitter = Column(Float)
    dna_concentration_submitter_meth = Column(CIText)
    absorbance_260_280_ratio_submitter = Column(Float)
    absorbance_260_280_ratio_submitter_meth = Column(CIText)
    acid_volatile_sulphides = Column(Float)
    acid_volatile_sulphides_meth = Column(CIText)
    agrochem_addition = Column(CIText)
    alkalinity = Column(Float)
    alkalinity_meth = Column(CIText)
    allo = Column(Float)
    allo_meth = Column(CIText)
    alpha_beta_car = Column(Float)
    alpha_beta_car_meth = Column(CIText)
    ammonium = Column(Float)
    ammonium_meth = Column(CIText)
    ammonium_nitrogen_wt = Column(Float)
    ammonium_nitrogen_wt_meth = Column(CIText)
    anth = Column(Float)
    anth_meth = Column(CIText)
    antimony = Column(Float)
    antimony_meth = Column(CIText)
    arsenic = Column(Float)
    arsenic_meth = Column(CIText)
    asta = Column(Float)
    asta_meth = Column(CIText)
    average_host_abundance = Column(Float)
    average_host_abundance_meth = Column(CIText)
    barium = Column(Float)
    barium_meth = Column(CIText)
    beta_beta_car = Column(Float)
    beta_beta_car_meth = Column(CIText)
    beta_epi_car = Column(Float)
    beta_epi_car_meth = Column(CIText)
    bicarbonate = Column(Float)
    bicarbonate_meth = Column(CIText)
    bleaching = Column(Float)
    bleaching_meth = Column(CIText)
    boron_hot_cacl2 = Column(Float)
    boron_hot_cacl2_meth = Column(CIText)
    but_fuco = Column(Float)
    but_fuco_meth = Column(CIText)
    cadmium = Column(CIText)
    cadmium_meth = Column(CIText)
    cantha = Column(Float)
    cantha_meth = Column(CIText)
    carbonate = Column(Float)
    carbonate_meth = Column(CIText)
    cast_id = Column(CIText)
    cation_exchange_capacity = Column(CIText)
    cation_exchange_capacity_meth = Column(CIText)
    cerium = Column(Float)
    cerium_meth = Column(CIText)
    cesium = Column(Float)
    cesium_meth = Column(CIText)
    chloride = Column(Float)
    chloride_meth = Column(CIText)
    chromium = Column(Float)
    chromium_meth = Column(CIText)
    citation = Column(CIText)
    clay = Column(Float)
    clay_meth = Column(CIText)
    coastal_id = Column(CIText)
    cobalt = Column(Float)
    cobalt_meth = Column(CIText)
    color_meth = Column(CIText)
    conductivity = Column(Float)
    conductivity_meth = Column(CIText)
    conductivity_aqueous = Column(CIText)
    conductivity_aqueous_meth = Column(CIText)
    coarse_sand = Column(Float)
    collection_permit = Column(CIText)
    coarse_sand_meth = Column(CIText)
    chlorophyll_a = Column(Float)
    chlorophyll_a_meth = Column(CIText)
    chlorophyll_b = Column(Float)
    chlorophyll_b_meth = Column(CIText)
    chlorophyll_c1c2 = Column(Float)
    chlorophyll_c1c2_meth = Column(CIText)
    chlorophyll_c1 = Column(Float)
    chlorophyll_c1_meth = Column(CIText)
    chlorophyll_c2 = Column(Float)
    chlorophyll_c2_meth = Column(CIText)
    chlorophyll_c3 = Column(Float)
    chlorophyll_c3_meth = Column(CIText)
    cphlide_a = Column(Float)
    cphlide_a_meth = Column(CIText)
    crop_rotation_1yr_since_present = Column(CIText)
    crop_rotation_2yrs_since_present = Column(CIText)
    crop_rotation_3yrs_since_present = Column(CIText)
    crop_rotation_4yrs_since_present = Column(CIText)
    crop_rotation_5yrs_since_present = Column(CIText)
    chlorophyll_ctd = Column(Float)
    chlorophyll_ctd_meth = Column(CIText)
    date_since_change_in_land_use = Column(CIText)
    days_since_planting = Column(Float)
    density = Column(Float)
    density_meth = Column(CIText)
    diadchr = Column(Float)
    diadchr_meth = Column(CIText)
    diadino = Column(Float)
    diadino_meth = Column(CIText)
    diato = Column(Float)
    diato_meth = Column(CIText)
    dino = Column(Float)
    dino_meth = Column(CIText)
    dtpa_copper = Column(Float)
    dtpa_copper_meth = Column(CIText)
    dtpa_iron = Column(Float)
    dtpa_iron_meth = Column(CIText)
    dtpa_manganese = Column(Float)
    dtpa_manganese_meth = Column(CIText)
    dtpa_zinc = Column(Float)
    dtpa_zinc_meth = Column(CIText)
    dv_cphl_a_and_cphl_a = Column(Float)
    dv_cphl_a_and_cphl_a_meth = Column(CIText)
    dv_cphl_a = Column(Float)
    dv_cphl_a_meth = Column(CIText)
    dv_cphl_b_and_cphl_b = Column(Float)
    dv_cphl_b_and_cphl_b_meth = Column(CIText)
    dv_cphl_b = Column(Float)
    dv_cphl_b_meth = Column(CIText)
    dysprosium = Column(Float)
    dysprosium_meth = Column(CIText)
    echin = Column(Float)
    echin_meth = Column(CIText)
    elev = Column(Float)
    erbium = Column(Float)
    erbium_meth = Column(CIText)
    europium = Column(Float)
    europium_meth = Column(CIText)
    exc_aluminium = Column(Float)
    exc_aluminium_meth = Column(CIText)
    exc_calcium = Column(Float)
    exc_calcium_meth = Column(CIText)
    exc_magnesium = Column(Float)
    exc_magnesium_meth = Column(CIText)
    exc_potassium = Column(Float)
    exc_potassium_meth = Column(CIText)
    exc_sodium = Column(Float)
    exc_sodium_meth = Column(CIText)
    extreme_event = Column(CIText)
    fine_sand = Column(Float)
    fine_sand_meth = Column(CIText)
    fine_sediment = Column(Float)
    fine_sediment_meth = Column(CIText)
    fire = Column(CIText)
    fire_intensity_if_known = Column(CIText)
    flooding = Column(CIText)
    fluor = Column(Float)
    fluor_meth = Column(CIText)
    fouling = Column(Float)
    fouling_meth = Column(CIText)
    fouling_organisms = Column(CIText)
    fresh_weight = Column(Float)
    fresh_weight_meth = Column(CIText)
    fuco = Column(Float)
    fuco_meth = Column(CIText)
    gadolinium = Column(Float)
    gadolinium_meth = Column(CIText)
    gallium = Column(Float)
    gallium_meth = Column(CIText)
    germanium = Column(Float)
    germanium_meth = Column(CIText)
    gold = Column(Float)
    gold_meth = Column(CIText)
    gravel = Column(CIText)
    gravel_meth = Column(CIText)
    grazing_number = Column(CIText)
    grazing_number_meth = Column(CIText)
    grazing = Column(Float)
    grazing_meth = Column(CIText)
    gyro = Column(Float)
    gyro_meth = Column(CIText)
    hafnium = Column(Float)
    hafnium_meth = Column(CIText)
    hex_fuco = Column(Float)
    hex_fuco_meth = Column(CIText)
    holmium = Column(Float)
    holmium_meth = Column(CIText)
    host_abundance_mean = Column(Float)
    host_abundance_mean_meth = Column(CIText)
    host_abundance = Column(Float)
    host_abundance_meth = Column(CIText)
    host_abundance_seaweed_mean = Column(Float)
    host_abundance_seaweed_mean_meth = Column(CIText)
    host_length = Column(Float)
    host_length_meth = Column(CIText)
    host_species_variety = Column(CIText)
    host_state = Column(CIText)
    hyperspectral_analysis = Column(CIText)
    hyperspectral_analysis_meth = Column(CIText)
    icp_te_boron = Column(Float)
    icp_te_boron_meth = Column(CIText)
    icp_te_calcium = Column(Float)
    icp_te_calcium_meth = Column(CIText)
    icp_te_copper = Column(Float)
    icp_te_copper_meth = Column(CIText)
    icp_te_iron = Column(Float)
    icp_te_iron_meth = Column(CIText)
    icp_te_manganese = Column(Float)
    icp_te_manganese_meth = Column(CIText)
    icp_te_phosphorus = Column(Float)
    icp_te_phosphorus_meth = Column(CIText)
    icp_te_sulfur = Column(Float)
    icp_te_sulfur_meth = Column(CIText)
    icp_te_zinc = Column(Float)
    icp_te_zinc_meth = Column(CIText)
    imos_site_code = Column(CIText)
    information = Column(CIText)
    inorganic_fraction = Column(Float)
    inorganic_fraction_meth = Column(CIText)
    iridium = Column(Float)
    iridium_meth = Column(CIText)
    keto_hex_fuco = Column(Float)
    keto_hex_fuco_meth = Column(CIText)
    lanthanum = Column(Float)
    lanthanum_meth = Column(CIText)
    lead = Column(Float)
    lead_meth = Column(CIText)
    light_intensity = Column(Float)
    light_intensity_meth = Column(CIText)
    light_intensity_meadow = Column(Float)
    light_intensity_meadow_meth = Column(CIText)
    light_intensity_bottom = Column(Float)
    light_intensity_bottom_meth = Column(CIText)
    light_intensity_surface = Column(Float)
    light_intensity_surface_meth = Column(CIText)
    local_class_meth = Column(CIText)
    lutetium = Column(Float)
    lutetium_meth = Column(CIText)
    lut = Column(Float)
    lut_meth = Column(CIText)
    lyco = Column(Float)
    lyco_meth = Column(CIText)
    magnesium = Column(Float)
    magnesium_meth = Column(CIText)
    mg_dvp = Column(Float)
    mg_dvp_meth = Column(CIText)
    microbial_abundance = Column(Float)
    microbial_abundance_meth = Column(CIText)
    microbial_biomass = Column(Float)
    microbial_biomass_meth = Column(CIText)
    molybdenum = Column(Float)
    molybdenum_meth = Column(CIText)
    mud = Column(Float)
    mud_meth = Column(CIText)
    myxo = Column(Float)
    myxo_meth = Column(CIText)
    neodymium = Column(Float)
    neodymium_meth = Column(CIText)
    neo = Column(Float)
    neo_meth = Column(CIText)
    nickel = Column(Float)
    nickel_meth = Column(CIText)
    niobium_columbium = Column(Float)
    niobium_columbium_meth = Column(CIText)
    nitrate = Column(Float)
    nitrate_meth = Column(CIText)
    nitrate_nitrite = Column(Float)
    nitrate_nitrite_meth = Column(CIText)
    nitrate_nitrogen = Column(Float)
    nitrate_nitrogen_meth = Column(CIText)
    nitrite = Column(Float)
    nitrite_meth = Column(CIText)
    npic = Column(Float)
    npic_meth = Column(CIText)
    npoc = Column(Float)
    npoc_meth = Column(CIText)
    nrs_sample_code = Column(CIText)
    nrs_trip_code = Column(CIText)
    org_matter = Column(Float)
    org_matter_meth = Column(CIText)
    organic_carbon = Column(Float)
    organic_carbon_meth = Column(CIText)
    organic_fraction = Column(Float)
    organic_fraction_meth = Column(CIText)
    osmium = Column(Float)
    osmium_meth = Column(CIText)
    oxygen = Column(Float)
    oxygen_meth = Column(CIText)
    oxygen_ctd_vol = Column(Float)
    oxygen_ctd_vol_meth = Column(CIText)
    oxygen_ctd_wt = Column(Float)
    oxygen_ctd_wt_meth = Column(CIText)
    palladium = Column(Float)
    palladium_meth = Column(CIText)
    pam_fluorometer = Column(Float)
    pam_fluorometer_meth = Column(CIText)
    par = Column(Float)
    par_meth = Column(CIText)
    part_org_carb = Column(Float)
    part_org_carb_meth = Column(CIText)
    perid = Column(Float)
    perid_meth = Column(CIText)
    ph = Column(Float)
    ph_meth = Column(CIText)
    ph_solid_h2o = Column(Float)
    ph_solid_h2o_meth = Column(CIText)
    phide_a = Column(Float)
    phide_a_meth = Column(CIText)
    phosphate = Column(Float)
    phosphate_meth = Column(CIText)
    phosphorus_colwell = Column(Float)
    phosphorus_colwell_meth = Column(CIText)
    phytin_a = Column(Float)
    phytin_a_meth = Column(CIText)
    phytin_b = Column(Float)
    phytin_b_meth = Column(CIText)
    picoeukaryotes = Column(Float)
    picoeukaryotes_meth = Column(CIText)
    plant_id = Column(CIText)
    plant_stage = Column(CIText)
    plant_stage_meth = Column(CIText)
    platinum = Column(Float)
    platinum_meth = Column(CIText)
    pn = Column(Float)
    pn_meth = Column(CIText)
    potassium = Column(Float)
    potassium_meth = Column(CIText)
    potassium_colwell = Column(Float)
    potassium_colwell_meth = Column(CIText)
    pras = Column(Float)
    pras_meth = Column(CIText)
    praseodymium = Column(Float)
    praseodymium_meth = Column(CIText)
    pres_rel = Column(CIText)
    pres_rel_meth = Column(CIText)
    prochlorococcus = Column(Float)
    prochlorococcus_meth = Column(CIText)
    pyrophide_a = Column(Float)
    pyrophide_a_meth = Column(CIText)
    pyrophytin_a = Column(Float)
    pyrophytin_a_meth = Column(CIText)
    rhodium = Column(Float)
    rhodium_meth = Column(CIText)
    root_length = Column(Float)
    root_length_meth = Column(CIText)
    rosette_position = Column(CIText)
    rubidium = Column(Float)
    rubidium_meth = Column(CIText)
    ruthenium = Column(Float)
    ruthenium_meth = Column(CIText)
    salinity = Column(Float)
    salinity_meth = Column(CIText)
    salinity_lab = Column(Float)
    salinity_lab_meth = Column(CIText)
    samarium = Column(Float)
    samarium_meth = Column(CIText)
    samp_size = Column(Float)
    samp_vol_we_dna_ext = Column(Float)
    sand = Column(Float)
    sand_meth = Column(CIText)
    scandium = Column(Float)
    scandium_meth = Column(CIText)
    secchi_depth = Column(Float)
    secchi_depth_meth = Column(CIText)
    sediment_grain_size = Column(Float)
    sediment_grain_size_meth = Column(CIText)
    sediment_grain_size_fract = Column(Float)
    sediment_grain_size_fract_meth = Column(CIText)
    sedimentation_rate = Column(Float)
    sedimentation_rate_meth = Column(CIText)
    sediment_porewater_h4sio4 = Column(Float)
    sediment_porewater_h4sio4_meth = Column(CIText)
    sediment_porewater_nh4 = Column(Float)
    sediment_porewater_nh4_meth = Column(CIText)
    sediment_porewater_no2 = Column(Float)
    sediment_porewater_no2_meth = Column(CIText)
    sediment_porewater_no3 = Column(Float)
    sediment_porewater_no3_meth = Column(CIText)
    sediment_porewater_po43 = Column(Float)
    sediment_porewater_po43_meth = Column(CIText)
    selenium = Column(Float)
    selenium_meth = Column(CIText)
    shoot_length = Column(Float)
    shoot_length_meth = Column(CIText)
    silicate = Column(Float)
    silicate_meth = Column(CIText)
    silt = Column(Float)
    silt_meth = Column(CIText)
    silver = Column(Float)
    silver_meth = Column(CIText)
    sio2 = Column(Float)
    sio2_meth = Column(CIText)
    slope_aspect = Column(CIText)
    slope_aspect_meth = Column(CIText)
    slope_gradient = Column(Float)
    slope_gradient_meth = Column(Float)
    sodium = Column(Float)
    sodium_meth = Column(CIText)
    specific_host = Column(CIText)
    strontium = Column(Float)
    strontium_meth = Column(CIText)
    sulphur = Column(Float)
    sulphur_meth = Column(CIText)
    synechococcus = Column(Float)
    synechococcus_meth = Column(CIText)
    synonyms = Column(CIText)
    tantalum = Column(Float)
    tantalum_meth = Column(CIText)
    temp = Column(Float)
    temp_meth = Column(CIText)
    terbium = Column(Float)
    terbium_meth = Column(CIText)
    texture = Column(CIText)
    texture_meth = Column(CIText)
    thorium = Column(Float)
    thorium_meth = Column(CIText)
    thulium = Column(Float)
    thulium_meth = Column(CIText)
    tin = Column(Float)
    tin_meth = Column(CIText)
    tot_carb = Column(Float)
    tot_carb_meth = Column(CIText)
    tot_depth_water_col = Column(Float)
    tot_depth_water_col_meth = Column(CIText)
    tot_nitro = Column(Float)
    tot_nitro_meth = Column(CIText)
    tot_org_carb = Column(CIText)
    tot_org_c_meth = Column(CIText)
    tot_phosp = Column(Float)
    tot_phosp_meth = Column(CIText)
    total_co2 = Column(Float)
    total_co2_meth = Column(CIText)
    total_inorganic_carbon = Column(Float)
    total_inorganic_carbon_meth = Column(CIText)
    total_nitrogen = Column(Float)
    total_nitrogen_meth = Column(CIText)
    total_phosphorous = Column(Float)
    total_phosphorous_meth = Column(CIText)
    touching_organisms = Column(CIText)
    transmittance = Column(Float)
    transmittance_meth = Column(CIText)
    tss = Column(Float)
    tss_meth = Column(CIText)
    tungsten = Column(Float)
    tungsten_meth = Column(CIText)
    turbidity = Column(Float)
    turbidity_meth = Column(CIText)
    uranium = Column(Float)
    uranium_meth = Column(CIText)
    url = Column(CIText)
    vanadium = Column(Float)
    vanadium_meth = Column(CIText)
    vegetation_dom_grasses = Column(CIText)
    vegetation_dom_grasses_meth = Column(CIText)
    vegetation_dom_shrubs = Column(CIText)
    vegetation_dom_shrubs_meth = Column(CIText)
    vegetation_dom_trees = Column(CIText)
    vegetation_dom_trees_meth = Column(CIText)
    vegetation_total_cover = Column(CIText)
    vegetation_total_cover_meth = Column(CIText)
    viola = Column(Float)
    viola_meth = Column(CIText)
    voyage_code = Column(CIText)
    voyage_survey_link = Column(CIText)
    water_content = Column(Float)
    water_content_soil_meth = Column(CIText)
    water_holding_capacity = Column(CIText)
    water_holding_capacity_meth = Column(CIText)
    ytterbium = Column(Float)
    ytterbium_meth = Column(CIText)
    yttrium = Column(Float)
    yttrium_meth = Column(CIText)
    zea = Column(Float)
    zea_meth = Column(CIText)
    zirconium = Column(Float)
    zirconium_meth = Column(CIText)
    zooplankton_biomass = Column(Float)
    zooplankton_biomass_meth = Column(CIText)
    sample_metadata_ingest_date = Column(Date)
    sample_metadata_ingest_file = Column(CIText)
    sample_metadata_update_history = Column(CIText)
    sample_database_file = Column(CIText)
    database_schema_definitions_url = Column(CIText)
    #
    # ontologies: note the default, which is by definition the empty string (''), we don't permit NULLs
    # in ontology columns
    #
    local_class_id = ontology_fkey(SampleAustralianSoilClassification, default=0)
    env_broad_scale_id = ontology_fkey(SampleLandUse, default=0)
    color_id = ontology_fkey(SampleColor, default=0)
    env_local_scale_id = ontology_fkey(SampleLandUse, default=0)
    general_env_feature_id = ontology_fkey(SampleEcologicalZone, default=0)
    am_environment_id = ontology_fkey(Environment, default=0)
    sample_type_id = ontology_fkey(SampleType, default=0)
    vegetation_type_id = ontology_fkey(SampleVegetationType, default=0)
    profile_position_id = ontology_fkey(SampleProfilePosition, default=0)
    tillage_id = ontology_fkey(SampleTillage, default=0)
    immediate_previous_land_use_id = ontology_fkey(SampleLandUse, default=0)
    horizon_id = ontology_fkey(SampleHorizonClassification, default=0)
    store_cond_id = ontology_fkey(SampleStorageMethod, default=0)
    sample_integrity_warnings_id = ontology_fkey(SampleIntegrityWarnings, default=0)
    sample_volume_notes_id = ontology_fkey(SampleVolumeNotes, default=0)
    biotic_relationship_id = ontology_fkey(SampleBioticRelationship, default=0)
    env_medium_id = ontology_fkey(SampleEnvironmentMedium, default=0)
    host_associated_microbiome_zone_id = ontology_fkey(SampleHostAssociatedMicrobiomeZone, default=0)
    host_type_id = ontology_fkey(SampleHostType, default=0)

    def __repr__(self):
        return "<SampleContext(%d)>" % (self.id)

    @classmethod
    def display_name(cls, field_name):
        """
        return the display name for a field

        if not explicitly set, we just replace '_' with ' ' and upper-case
        drop _id if it's there
        """
        column = getattr(cls, field_name)
        display_name = getattr(column, 'display_name', None)
        if display_name is None:
            if field_name.endswith('_id'):
                field_name = field_name[:-3]
            display_name = ' '.join(((t[0].upper() + t[1:]) for t in field_name.split('_')))
        return display_name


class SampleMeta(SchemaMixin, Base):
    __tablename__ = 'sample_meta'
    sample_id = Column(String, ForeignKey(SCHEMA + '.sample_context.id'), nullable=False, primary_key=True, index=True)
    has_metagenome = Column(Boolean, default=False)

class SampleOTU(SchemaMixin, Base):
    __tablename__ = 'sample_otu'
    sample_id = Column(String, ForeignKey(SCHEMA + '.sample_context.id'), nullable=False, primary_key=True, index=True)
    otu_id = Column(Integer, ForeignKey(SCHEMA + '.otu.id'), nullable=False, primary_key=True, index=True)
    count = Column(Integer, nullable=False)
    count_20k = Column(Integer, nullable=True)

    def __repr__(self):
        return "<SampleOTU(%s,%d,%d)>" % (self.sample_id, self.otu_id, self.count)


taxonomy_rank_id_attrs = [getattr(Taxonomy, name) for name in taxonomy_key_id_names]

def _sample_otu_indexes(prefix):
    return [Index(prefix + name + '_idx', name) for name in taxonomy_key_id_names]

class OTUSampleOTU(SchemaMixin, Base):
    __table__ = create_materialized_view(
        name='otu_sample_otu',
        selectable=select(
            [
                SampleOTU.sample_id,
                func.count(SampleOTU.otu_id).label("richness"),
                func.sum(SampleOTU.count).label("count"),
                func.count(SampleOTU.count_20k).label("richness_20k"), # Will be 0 if all null
                func.sum(SampleOTU.count_20k).label("sum_count_20k"), # Will be null if all null
            ] + taxonomy_rank_id_attrs + [
                Taxonomy.amplicon_id,
                Taxonomy.traits
            ],
            from_obj=(
                SampleOTU.__table__.join(OTU).join(taxonomy_otu).join(Taxonomy)))
        .group_by(SampleOTU.sample_id)
        .group_by(*taxonomy_rank_id_attrs)
        .group_by(Taxonomy.amplicon_id)
        .group_by(Taxonomy.traits),
        metadata=Base.metadata,
        indexes=  _sample_otu_indexes('otu_sample_otu_index_') +   [
            Index('otu_sample_otu_index_sample_id_idx', 'sample_id'),
            Index('otu_sample_otu_index_amplicon_id_idx', 'amplicon_id'),
            Index('otu_sample_otu_index_traits_idx', 'traits', postgresql_using='gin'),
        ]
    )


class OntologyErrors(SchemaMixin, Base):
    __tablename__ = 'ontology_errors'
    id = Column(Integer, primary_key=True)
    environment = Column(String)
    ontology_name = Column(String)
    invalid_values = Column(ARRAY(String))

    def __str__(self):
        return self.ontology_name


class ExcludedSamples(SchemaMixin, Base):
    __tablename__ = 'excluded_samples'
    id = Column(Integer, primary_key=True)
    reason = Column(String)
    samples = Column(ARRAY(String))


class ImportMetadata(SchemaMixin, Base):
    __tablename__ = 'import_metadata'
    id = Column(Integer, primary_key=True)
    methodology = Column(String)
    analysis_url = Column(String)
    revision_date = Column(Date)
    imported_at = Column(Date)
    otu_count = Column(postgresql.BIGINT)
    sampleotu_count = Column(postgresql.BIGINT)
    samplecontext_count = Column(postgresql.BIGINT)
    uuid = Column(String)


class ImportedFile(SchemaMixin, Base):
    __tablename__ = 'imported_file'
    id = Column(Integer, primary_key=True)
    filename = Column(String, unique=True)
    file_type = Column(String)
    file_size = Column(postgresql.BIGINT)
    rows_imported = Column(postgresql.BIGINT)
    rows_skipped = Column(postgresql.BIGINT)


def make_engine():
    dbschema = 'otu,public'
    conf = settings.DATABASES['default']
    engine_string = 'postgres://%(USER)s:%(PASSWORD)s@%(HOST)s:%(PORT)s/%(NAME)s' % (conf)
    echo = os.environ.get('BPAOTU_ECHO') == '1'
    return create_engine(engine_string, echo=echo, connect_args={'options': '-csearch_path={}'.format(dbschema)})
