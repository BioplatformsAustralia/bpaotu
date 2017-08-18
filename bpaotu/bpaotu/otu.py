import logging
from sqlalchemy.ext.declarative import declarative_base, declared_attr
from sqlalchemy import Column, Integer, String, ForeignKey, Date, Float
from django.conf import settings
from sqlalchemy import create_engine
from sqlalchemy.orm import relationship


logger = logging.getLogger("rainbow")
Base = declarative_base()
SCHEMA = 'otu'


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
    value = Column(String, unique=True)

    @classmethod
    def make_tablename(cls, name):
        return 'ontology_' + name.lower()

    @declared_attr
    def __tablename__(cls):
        return cls.make_tablename(cls.__name__)

    def __repr__(self):
        return "<%s(%s)>" % (type(self).__name__, self.value)


def ontology_fkey(ontology_class):
    nm = ontology_class.__name__
    column = Column(Integer, ForeignKey(SCHEMA + '.' + OntologyMixin.make_tablename(nm) + '.id'))
    # stash this here for introspection later: saves a lot of manual
    # work with sqlalchemy's relationship() stuff
    column.ontology_class = ontology_class
    return column


class SampleType(OntologyMixin, Base):
    pass


class BPAProject(OntologyMixin, Base):
    pass


class OTUKingdom(OntologyMixin, Base):
    pass


class OTUPhylum(OntologyMixin, Base):
    pass


class OTUClass(OntologyMixin, Base):
    pass


class OTUOrder(OntologyMixin, Base):
    pass


class OTUFamily(OntologyMixin, Base):
    pass


class OTUGenus(OntologyMixin, Base):
    pass


class OTUSpecies(OntologyMixin, Base):
    pass


class OTU(SchemaMixin, Base):
    __tablename__ = 'otu'
    id = Column(Integer, primary_key=True)
    code = Column(String(length=21))  # current max length of OTU code
    kingdom_id = ontology_fkey(OTUKingdom)
    phylum_id = ontology_fkey(OTUPhylum)
    class_id = ontology_fkey(OTUClass)
    order_id = ontology_fkey(OTUOrder)
    family_id = ontology_fkey(OTUFamily)
    genus_id = ontology_fkey(OTUGenus)
    species_id = ontology_fkey(OTUSpecies)

    kingdom = relationship(OTUKingdom)
    phylum = relationship(OTUPhylum)
    klass = relationship(OTUClass)
    order = relationship(OTUOrder)
    family = relationship(OTUFamily)
    genus = relationship(OTUGenus)
    species = relationship(OTUSpecies)

    def __repr__(self):
        return "<OTU(%d: %s,%s,%s,%s,%s,%s,%s)>" % (
            self.id,
            self.kingdom_id,
            self.phylum_id,
            self.class_id,
            self.order_id,
            self.family_id,
            self.genus_id,
            self.species_id)


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


class SampleContext(SchemaMixin, Base):
    __tablename__ = 'sample_context'
    id = Column(Integer, primary_key=True)  # NB: we use the final component of the BPA ID here

    # There are a large number of contextual fields, we are merging together all fields from BASE and MM
    # so that they can be queried universally.
    #
    # Note that some columns are String when they would be better as either a Float or an ontology:
    # as required we can work with the project managers to resolve data quality issues which force
    # use to use a String column
    a16s_comment = Column(String)
    agrochemical_additions = Column(String)
    allo = Column(Float)
    alpha_beta_car = Column(Float)
    ammonium = Column(Float)
    ammonium_nitrogen = Column(Float)
    anth = Column(Float)
    asta = Column(Float)
    b16s_comment = Column(String)
    beta_beta_car = Column(Float)
    beta_epi_car = Column(Float)
    biomass = Column(Float)
    boron_hot_cacl2 = Column(Float)
    bottom_depth = Column(Float)
    but_fuco = Column(Float)
    cantha = Column(Float)
    chl_a_allomer = Column(Float)
    chl_a_epi = Column(Float)
    chlorophyll_a = Column(Float)
    clay = Column(Float)
    coastal_id = Column(String)
    conductivity = Column(Float)
    course_sand = Column(Float)
    cphl_a = Column(Float)
    cphl_b = Column(Float)
    cphl_c1 = Column(Float)
    cphl_c1c2 = Column(Float)
    cphl_c2 = Column(Float)
    cphl_c3 = Column(Float)
    cphlide_a = Column(Float)
    crop_rotation_1yr_since_present = Column(String)
    crop_rotation_2yrs_since_present = Column(String)
    crop_rotation_3yrs_since_present = Column(String)
    crop_rotation_4yrs_since_present = Column(String)
    crop_rotation_5yrs_since_present = Column(String)
    ctd_salinity = Column(Float)
    date_sampled = Column(Date)
    date_since_change_in_land_use = Column(String)
    day = Column(String)
    density = Column(Float)
    deployment = Column(String)
    depth = Column(Float)
    depth_salt_water = Column(Float)
    diadchr = Column(Float)
    diadino = Column(Float)
    diato = Column(Float)
    dino = Column(Float)
    dna_extraction_date = Column(Date)
    dtpa_copper = Column(Float)
    dtpa_iron = Column(Float)
    dtpa_manganese = Column(Float)
    dtpa_zinc = Column(Float)
    dv_cphl_a = Column(Float)
    dv_cphl_a_and_cphl_a = Column(Float)
    dv_cphl_b = Column(Float)
    dv_cphl_b_and_cphl_b = Column(Float)
    e18s_comment = Column(String)
    echin = Column(Float)
    elevation = Column(Float)
    exc_aluminium = Column(Float)
    exc_calcium = Column(Float)
    exc_magnesium = Column(Float)
    exc_potassium = Column(Float)
    exc_sodium = Column(Float)
    extraction_number = Column(Float)
    extreme_events = Column(String)
    fine_sand = Column(Float)
    fire_history = Column(String)
    fire_intensity_if_known = Column(String)
    flooding = Column(String)
    fluorescence = Column(Float)
    fluorescence_wetlab = Column(Float)
    fuco = Column(Float)
    geo_loc = Column(String)
    gravel = Column(Float)
    gyro = Column(Float)
    hex_fuco = Column(Float)
    host_abundance = Column(Float)
    host_species = Column(String)
    host_state = Column(String)
    inorganic_fraction = Column(Float)
    keto_hex_fuco = Column(Float)
    latitude = Column(Float)
    light_intensity = Column(Float)
    location_code = Column(String)
    location_description = Column(String)
    longitude = Column(Float)
    lut = Column(Float)
    lyco = Column(Float)
    metagenome_comment = Column(String)
    mg_dvp = Column(Float)
    microbial_abundance = Column(Float)
    month = Column(String)
    neo = Column(Float)
    nitrate_nitrite = Column(Float)
    nitrate_nitrogen = Column(Float)
    nitrite = Column(Float)
    notes = Column(String)
    organic_carbon = Column(Float)
    organic_fraction = Column(Float)
    oxygen = Column(Float)
    oxygen_ctd = Column(Float)
    oxygen_lab = Column(Float)
    oxygen_ml_l_ctd = Column(Float)
    oxygen_umol_kg_ctd = Column(Float)
    oxygen_umol_l_lab = Column(Float)
    per_fine_sediment = Column(Float)
    per_total_carbon = Column(Float)
    per_total_inorganc_carbon = Column(Float)
    per_total_nitrogen = Column(Float)
    per_total_phosphorous = Column(Float)
    perid = Column(Float)
    ph_level = Column(Float)
    ph_level_cacl2 = Column(Float)
    ph_level_h2o = Column(Float)
    phide_a = Column(Float)
    phosphate = Column(Float)
    phosphorus_colwell = Column(Float)
    phytin_a = Column(Float)
    phytin_b = Column(Float)
    potassium_colwell = Column(Float)
    pras = Column(Float)
    pressure = Column(Float)
    pulse_amplitude_modulated_fluorometer_measurement = Column(Float)
    pulse_amplitude_modulated_pam_fluorometer_measurement = Column(Float)
    pyrophide_a = Column(Float)
    pyrophytin_a = Column(Float)
    rp = Column(Float)
    salinity = Column(Float)
    salinity_ctd = Column(Float)
    salinity_lab = Column(Float)
    sample_code = Column(String)
    sample_site = Column(String)
    sand = Column(Float)
    secchi_depth = Column(Float)
    sedimentation_rate = Column(Float)
    silicate = Column(Float)
    silt = Column(Float)
    slope = Column(String)
    slope_aspect = Column(String)
    soil_moisture = Column(Float)
    stratification = Column(Float)
    sulphur = Column(Float)
    temp_from_ctd_file = Column(Float)
    temperature = Column(Float)
    texture = Column(String)
    time = Column(String)
    time_sampled = Column(String)
    total_alkalinity = Column(Float)
    total_co2 = Column(Float)
    transmittance = Column(Float)
    tss = Column(Float)
    turbidity = Column(Float)
    vegetation_dom_grasses = Column(Float)
    vegetation_dom_shrubs = Column(Float)
    vegetation_dom_trees = Column(Float)
    vegetation_total_cover = Column(Float)
    viola = Column(Float)
    year = Column(String)
    zea = Column(Float)
    zm__sigmat = Column(Float)
    zm_delta_sigmat = Column(Float)
    #
    # ontologies
    #
    australian_soil_classification_id = ontology_fkey(SampleAustralianSoilClassification)
    broad_land_use_id = ontology_fkey(SampleLandUse)
    color_id = ontology_fkey(SampleColor)
    detailed_land_use_id = ontology_fkey(SampleLandUse)
    fao_soil_classification_id = ontology_fkey(SampleFAOSoilClassification)
    general_ecological_zone_id = ontology_fkey(SampleEcologicalZone)
    horizon_classification_id = ontology_fkey(SampleHorizonClassification)
    immediate_previous_land_use_id = ontology_fkey(SampleLandUse)
    profile_position_id = ontology_fkey(SampleProfilePosition)
    project_id = ontology_fkey(BPAProject)
    sample_type_id = ontology_fkey(SampleType)
    soil_sample_storage_method_id = ontology_fkey(SampleStorageMethod)
    tillage_id = ontology_fkey(SampleTillage)
    vegetation_type_id = ontology_fkey(SampleVegetationType)

    def __repr__(self):
        return "<SampleContext(%d)>" % (self.id)


class SampleOTU(SchemaMixin, Base):
    __tablename__ = 'sample_otu'
    sample_id = Column(Integer, ForeignKey(SCHEMA + '.sample_context.id'), primary_key=True)
    otu_id = Column(Integer, ForeignKey(SCHEMA + '.otu.id'), primary_key=True)
    count = Column(Integer, nullable=False)

    def __repr__(self):
        return "<SampleOTU(%d,%d,%d)>" % (self.sample_id, self.otu_id, self.count)


def make_engine():
    conf = settings.DATABASES['default']
    engine_string = 'postgres://%(USER)s:%(PASSWORD)s@%(HOST)s:%(PORT)s/%(NAME)s' % (conf)
    return create_engine(engine_string)
