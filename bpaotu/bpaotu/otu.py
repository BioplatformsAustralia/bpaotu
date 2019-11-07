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
    allo = Column(Float)
    alpha_beta_car = Column(Float)
    ammonium = Column(Float)
    ammonium_nitrogen = Column(Float)
    anth = Column(Float)
    asta = Column(Float)
    average_host_abundance = Column(Float)
    beta_beta_car = Column(Float)
    beta_epi_car = Column(Float)
    bleaching = Column(Float)
    boron_hot_cacl2 = Column(Float)
    bottom_depth = Column(Float)
    but_fuco = Column(Float)
    cantha = Column(Float)
    chlf_ctd = Column(Float)
    chlorophyll_a = Column(Float)
    clay = Column(Float)
    coastal_id = Column(CIText)
    conductivity_dsm = Column(Float)
    conductivity_sm = Column(Float)
    course_sand = Column(Float)
    cphl_a = Column(Float)
    cphl_b = Column(Float)
    cphl_c1 = Column(Float)
    cphl_c1c2 = Column(Float)
    cphl_c2 = Column(Float)
    cphl_c3 = Column(Float)
    cphlide_a = Column(Float)
    date_sampled = Column(Date)
    density_ctd = Column(Float)
    depth = Column(Float)
    diadchr = Column(Float)
    diadino = Column(Float)
    diato = Column(Float)
    dino = Column(Float)
    dtpa_copper = Column(Float)
    dtpa_iron = Column(Float)
    dtpa_manganese = Column(Float)
    dtpa_zinc = Column(Float)
    dv_cphl_a = Column(Float)
    dv_cphl_a_and_cphl_a = Column(Float)
    dv_cphl_b = Column(Float)
    dv_cphl_b_and_cphl_b = Column(Float)
    echin = Column(Float)
    elevation = Column(Float)
    exc_aluminium = Column(Float)
    exc_calcium = Column(Float)
    exc_magnesium = Column(Float)
    exc_potassium = Column(Float)
    exc_sodium = Column(Float)
    fine_sand = Column(Float)
    fine_sediment = Column(Float)
    fluorescence = Column(Float)
    fouling = Column(Float)
    fouling_organisms = Column(String)
    fuco = Column(Float)
    geo_loc = Column(CIText)
    gravel = Column(Float)
    grazing = Column(CIText)
    grazing_number = Column(Float)
    gyro = Column(Float)
    hex_fuco = Column(Float)
    host_abundance = Column(Float)
    host_abundance_seaweed = Column(Float)
    host_species = Column(CIText)
    host_state = Column(CIText)
    information = Column(String)
    inorganic_fraction = Column(Float)
    keto_hex_fuco = Column(Float)
    latitude = Column(Float)
    length = Column(Float)
    light_intensity = Column(Float)
    light_intensity_surface = Column(Float)
    light_intensity_meadow = Column(Float)
    location_description = Column(CIText)
    longitude = Column(Float)
    lut = Column(Float)
    lyco = Column(Float)
    mg_dvp = Column(Float)
    microbial_abundance = Column(Float)
    ncbi_bioproject_accession = Column(CIText)
    ncbi_biosample_accession = Column(CIText)
    neo = Column(Float)
    nitrate_nitrite = Column(Float)
    nitrate_nitrogen = Column(Float)
    nitrite = Column(Float)
    no2 = Column(Float)
    notes = Column(CIText)
    npic = Column(Float)
    npoc = Column(Float)
    nrs_location_code_voyage_code = Column(CIText)
    nrs_sample_code = Column(CIText)
    nrs_trip_code = Column(CIText)
    organic_carbon = Column(Float)
    organic_fraction = Column(Float)
    organism = Column(CIText)
    oxygen_ctd_coastal_water = Column(Float)
    oxygen_ctd_pelagic = Column(Float)
    oxygen_lab = Column(Float)
    pam_fluorometer = Column(Float)
    perid = Column(Float)
    pressure_bottle = Column(Float)
    ph_level = Column(Float)
    ph_level_cacl2 = Column(Float)
    ph_level_h2o = Column(Float)
    phide_a = Column(Float)
    phosphate = Column(Float)
    phosphorus_colwell = Column(Float)
    phytin_a = Column(Float)
    phytin_b = Column(Float)
    pn = Column(Float)
    poc = Column(Float)
    potassium_colwell = Column(Float)
    pras = Column(Float)
    pyrophide_a = Column(Float)
    pyrophytin_a = Column(Float)
    salinity_ctd = Column(Float)
    salinity_lab = Column(Float)
    sample_storage_method = Column(CIText)
    samplename_depth = Column(CIText)
    sample_site = Column(CIText)
    sand = Column(Float)
    secchi_depth = Column(Float)
    sedimentation_rate = Column(Float)
    silicate = Column(Float)
    silt = Column(Float)
    sio2 = Column(Float)
    slope = Column(CIText)
    slope_aspect = Column(CIText)
    soil_moisture = Column(Float)
    sulphur = Column(Float)
    temperature = Column(Float)
    temperature_ctd = Column(Float)
    texture = Column(CIText)
    time_sampled = Column(CIText)
    total_alkalinity = Column(Float)
    total_co2 = Column(Float)
    total_carbon = Column(Float)
    total_inorganc_carbon = Column(Float)
    total_nitrogen = Column(Float)
    total_phosphorous = Column(Float)
    touching_organisms = Column(String)
    transmittance = Column(Float)
    tss = Column(Float)
    turbidity = Column(Float)
    turbidity_ctd = Column(Float)
    viola = Column(Float)
    zea = Column(Float)
    #
    # ontologies: note the default, which is by definition the empty string (''), we don't permit NULLs
    # in ontology columns
    #
    australian_soil_classification_id = ontology_fkey(SampleAustralianSoilClassification, default=0)
    broad_land_use_id = ontology_fkey(SampleLandUse, default=0)
    color_id = ontology_fkey(SampleColor, default=0)
    detailed_land_use_id = ontology_fkey(SampleLandUse, default=0)
    general_ecological_zone_id = ontology_fkey(SampleEcologicalZone, default=0)
    environment_id = ontology_fkey(Environment, default=0)
    sample_type_id = ontology_fkey(SampleType, default=0)
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
