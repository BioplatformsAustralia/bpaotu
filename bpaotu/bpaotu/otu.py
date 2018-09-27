import os
import logging
from sqlalchemy.ext.declarative import declarative_base, declared_attr
from sqlalchemy import Column, Integer, ForeignKey, String, Date, Float
from django.conf import settings
from sqlalchemy import create_engine
from sqlalchemy.orm import relationship
from citext import CIText


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
    value = Column(String, unique=True, nullable=False)

    @classmethod
    def make_tablename(cls, name):
        return 'ontology_' + name.lower()

    @declared_attr
    def __tablename__(cls):  # noqa: N805
        return cls.make_tablename(cls.__name__)

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


def with_units(units, *args, **kwargs):
    return with_attrs({'units': units}, *args, **kwargs)


class SampleType(OntologyMixin, Base):
    pass


class Environment(OntologyMixin, Base):
    pass


class OTUAmplicon(OntologyMixin, Base):
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
    code = Column(String(length=1024), nullable=False)  # long GATTACAt-ype string

    # we query OTUs via heirarchy, so indexes on the first few
    # layers are sufficient
    kingdom_id = ontology_fkey(OTUKingdom, index=True)
    phylum_id = ontology_fkey(OTUPhylum, index=True)
    class_id = ontology_fkey(OTUClass, index=True)
    order_id = ontology_fkey(OTUOrder, index=True)
    family_id = ontology_fkey(OTUFamily, index=True)
    genus_id = ontology_fkey(OTUGenus, index=True)
    species_id = ontology_fkey(OTUSpecies, index=True)
    amplicon_id = ontology_fkey(OTUAmplicon, index=True)

    kingdom = relationship(OTUKingdom)
    phylum = relationship(OTUPhylum)
    klass = relationship(OTUClass)
    order = relationship(OTUOrder)
    family = relationship(OTUFamily)
    genus = relationship(OTUGenus)
    species = relationship(OTUSpecies)
    amplicon = relationship(OTUAmplicon)

    def __repr__(self):
        return "<OTU(%d: %s,%s,%s,%s,%s,%s,%s,%s)>" % (
            self.id,
            self.amplicon_id,
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
    # NB: we use the final component of the ID here
    id = with_attrs({'display_name': 'Sample ID'}, Integer, primary_key=True)

    # There are a large number of contextual fields, we are merging together all fields from BASE and MM
    # so that they can be queried universally.
    #
    # Note that some columns are CIText when they would be better as either a Float or an ontology:
    # as required we can work with the project managers to resolve data quality issues which force
    # use to use a CIText column
    a16s_comment = Column(CIText)
    agrochemical_additions = Column(CIText)
    allo = with_units('mg/m3', Float)
    alpha_beta_car = with_units('mg/m3', Float)
    ammonium = with_units('μmol/L', Float)
    ammonium_nitrogen = with_units('mg/Kg', Float)
    anth = with_units('mg/m3', Float)
    asta = with_units('mg/m3', Float)
    b16s_comment = Column(CIText)
    beta_beta_car = with_units('mg/m3', Float)
    beta_epi_car = with_units('mg/m3', Float)
    biomass = with_units('mg/m3', Float)
    bleaching = with_units('%', Float)
    boron_hot_cacl2 = with_units('mg/Kg', Float)
    bottom_depth = with_units('m', Float)
    but_fuco = with_units('mg/m3', Float)
    cantha = with_units('mg/m3', Float)
    chl_a_allomer = Column(Float)
    chl_a_epi = Column(Float)
    chlf_ctd = Column(Float)
    chlorophyll_a = with_units('μg/L', Float)
    clay = with_units('% (<2 µm)', Float)
    coastal_id = Column(CIText)
    conductivity = with_units('dS/m', Float)
    course_sand = with_units('% (200-2000 µm)', Float)
    cphl_a = with_units('mg/m3', Float)
    cphl_b = with_units('mg/m3', Float)
    cphl_c1 = with_units('mg/m3', Float)
    cphl_c1c2 = with_units('mg/m3', Float)
    cphl_c2 = with_units('mg/m3', Float)
    cphl_c3 = with_units('mg/m3', Float)
    cphlide_a = with_units('mg/m3', Float)
    crop_rotation_1yr_since_present = Column(CIText)
    crop_rotation_2yrs_since_present = Column(CIText)
    crop_rotation_3yrs_since_present = Column(CIText)
    crop_rotation_4yrs_since_present = Column(CIText)
    crop_rotation_5yrs_since_present = Column(CIText)
    ctd_salinity = Column(Float)
    date_sampled = Column(Date)
    date_since_change_in_land_use = Column(CIText)
    day = Column(CIText)
    density = with_units('Kg/m^3', Float)
    deployment = Column(CIText)
    depth = with_units('m', Float)
    depth_salt_water = with_units('m, lat=-27.2', Float)
    diadchr = with_units('mg/m3', Float)
    diadino = with_units('mg/m3', Float)
    diato = with_units('mg/m3', Float)
    dino = with_units('mg/m3', Float)
    dna_extraction_date = Column(Date)
    dtpa_copper = with_units('mg/Kg', Float)
    dtpa_iron = with_units('mg/Kg', Float)
    dtpa_manganese = with_units('mg/Kg', Float)
    dtpa_zinc = with_units('mg/Kg', Float)
    dv_cphl_a = with_units('mg/m3', Float)
    dv_cphl_a_and_cphl_a = with_units('mg/m3', Float)
    dv_cphl_b = with_units('mg/m3', Float)
    dv_cphl_b_and_cphl_b = with_units('mg/m3', Float)
    e18s_comment = Column(CIText)
    echin = with_units('mg/m3', Float)
    elevation = Column(Float)
    exc_aluminium = with_units('meq/100g', Float)
    exc_calcium = with_units('meq/100g', Float)
    exc_magnesium = with_units('meq/100g', Float)
    exc_potassium = with_units('meq/100g', Float)
    exc_sodium = with_units('meq/100g', Float)
    extraction_number = Column(Float)
    extreme_events = Column(CIText)
    fine_sand = Column(Float)
    fire_history = Column(CIText)
    fire_intensity_if_known = Column(CIText)
    flooding = Column(CIText)
    fluorescence = with_units('AU', Float)
    fluorescence_wetlab = with_units('mg/m^3', Float)
    fouling = Column(Float)
    fouling_organisms = Column(String)
    fuco = with_units('mg/m3', Float)
    geo_loc = Column(CIText)
    gravel = with_units('% (> 2.0 mm)', Float)
    gyro = with_units('mg/m3', Float)
    hex_fuco = with_units('mg/m3', Float)
    host_abundance = with_units('individuals per m2', Float)
    host_species = Column(CIText)
    host_state = Column(CIText)
    information = Column(String)
    inorganic_fraction = with_units('mg/L', Float)
    keto_hex_fuco = with_units('mg/m3', Float)
    latitude = with_units('°', Float)
    length = with_units('cm', Float)
    light_intensity = with_units('lux', Float)
    light_intensity_surface = with_units('µmol/m²/s¯¹', Float)
    light_intensity_meadow = with_units('µmol/m²/s¯¹', Float)
    location_code = Column(CIText)
    location_description = Column(CIText)
    longitude = with_units('°', Float)
    lut = with_units('mg/m3', Float)
    lyco = with_units('mg/m3', Float)
    metagenome_comment = Column(CIText)
    mg_dvp = with_units('mg/m3', Float)
    microbial_abundance = with_units('cells per ml', Float)
    month = Column(CIText)
    neo = with_units('mg/m3', Float)
    nitrate_nitrite = with_units('μmol/L', Float)
    nitrate_nitrogen = with_units('mg/Kg', Float)
    nitrite = Column(Float)
    notes = Column(CIText)
    nrs_location_code_voyage_code = Column(CIText)
    nrs_sample_code = Column(CIText)
    nrs_trip_code = Column(CIText)
    organic_carbon = with_units('%', Float)
    organic_fraction = with_units('mg/L', Float)
    organism = Column(CIText)
    oxygen = Column(Float)
    oxygen_ctd = with_units('ml/L', Float)
    oxygen_lab = with_units('μmol/L', Float)
    oxygen_ml_l_ctd = with_units('ml/L', Float)
    oxygen_umol_kg_ctd = with_units('μmol/kg', Float)
    oxygen_umol_l_lab = with_units('μmol/L', Float)
    per_fine_sediment = with_units('%', Float)
    per_total_carbon = with_units('%', Float)
    per_total_inorganc_carbon = with_units('%', Float)
    per_total_nitrogen = with_units('%', Float)
    per_total_phosphorous = with_units('%', Float)
    perid = with_units('mg/m3', Float)
    pressure_bottle = Column(Float)
    ph_level = Column(Float)
    ph_level_cacl2 = with_units('pH', Float)
    ph_level_h2o = with_units('pH', Float)
    phide_a = with_units('mg/m3', Float)
    phosphate = with_units('μmol/L', Float)
    phosphorus_colwell = with_units('mg/Kg', Float)
    phytin_a = with_units('mg/m3', Float)
    phytin_b = with_units('mg/m3', Float)
    potassium_colwell = with_units('mg/Kg', Float)
    pras = with_units('mg/m3', Float)
    pressure = Column(Float)
    pulse_amplitude_modulated_fluorometer_measurement = Column(Float)
    pulse_amplitude_modulated_pam_fluorometer_measurement = Column(Float)
    pyrophide_a = with_units('mg/m3', Float)
    pyrophytin_a = with_units('mg/m3', Float)
    rp = Column(Float)
    salinity = with_units('PSU', Float)
    salinity_ctd = with_units('PSU', Float)
    salinity_lab = Column(Float)
    sample_code = Column(CIText)
    sample_site = Column(CIText)
    sand = with_units('%', Float)
    secchi_depth = with_units('m', Float)
    sedimentation_rate = with_units('g /(cm2 x yr)', Float)
    silicate = Column(Float)
    silt = with_units('% (2-20 µm)', Float)
    slope = with_units('%', CIText)
    slope_aspect = Column(CIText)
    soil_moisture = with_units('%', Float)
    stratification = Column(Float)
    sulphur = with_units('mg/Kg', Float)
    tax_id = Column(Integer)
    temp_from_ctd_file = Column(Float)
    temperature = with_units('ITS-90, deg C', Float)
    texture = Column(CIText)
    time = Column(CIText)
    time_sampled = Column(CIText)
    total_alkalinity = with_units('μmol/kg', Float)
    total_co2 = with_units('μmol/L', Float)
    touching_organisms = Column(String)
    transmittance = with_units('%', Float)
    tss = with_units('mg/L', Float)
    turbidity = with_units('Upoly 0, WET Labs FLNTURT', Float)
    turbidity_ctd = with_units('Nephelometric Turbidity Units', Float)
    vegetation_dom_grasses = with_units('%', Float)
    vegetation_dom_shrubs = with_units('%', Float)
    vegetation_dom_trees = with_units('%', Float)
    vegetation_total_cover = with_units('%', Float)
    viola = with_units('mg/m3', Float)
    year = Column(CIText)
    zea = with_units('mg/m3', Float)
    zm_sigmat = Column(Float)
    zm_delta_sigmat = Column(Float)
    #
    # ontologies: note the default, which is by definition the empty string (''), we don't permit NULLs
    # in ontology columns
    #
    australian_soil_classification_id = ontology_fkey(SampleAustralianSoilClassification, default=0)
    broad_land_use_id = ontology_fkey(SampleLandUse, default=0)
    color_id = ontology_fkey(SampleColor, default=0)
    detailed_land_use_id = ontology_fkey(SampleLandUse, default=0)
    fao_soil_classification_id = ontology_fkey(SampleFAOSoilClassification, default=0)
    general_ecological_zone_id = ontology_fkey(SampleEcologicalZone, default=0)
    horizon_classification_id = ontology_fkey(SampleHorizonClassification, default=0)
    immediate_previous_land_use_id = ontology_fkey(SampleLandUse, default=0)
    profile_position_id = ontology_fkey(SampleProfilePosition, default=0)
    environment_id = ontology_fkey(Environment, default=0)
    sample_type_id = ontology_fkey(SampleType, default=0)
    soil_sample_storage_method_id = ontology_fkey(SampleStorageMethod, default=0)
    tillage_id = ontology_fkey(SampleTillage, default=0)
    vegetation_type_id = ontology_fkey(SampleVegetationType, default=0)

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

    @classmethod
    def units(cls, field_name):
        """
        return the units for a field
        """
        column = getattr(cls, field_name)
        return getattr(column, 'units', None)


class SampleOTU(SchemaMixin, Base):
    __tablename__ = 'sample_otu'
    sample_id = Column(Integer, ForeignKey(SCHEMA + '.sample_context.id'), nullable=False, primary_key=True, index=True)
    otu_id = Column(Integer, ForeignKey(SCHEMA + '.otu.id'), nullable=False, primary_key=True, index=True)
    count = Column(Integer, nullable=False)

    def __repr__(self):
        return "<SampleOTU(%d,%d,%d)>" % (self.sample_id, self.otu_id, self.count)


def make_engine():
    conf = settings.DATABASES['default']
    engine_string = 'postgres://%(USER)s:%(PASSWORD)s@%(HOST)s:%(PORT)s/%(NAME)s' % (conf)
    echo = os.environ.get('BPAOTU_ECHO') == '1'
    return create_engine(engine_string, echo=echo)
