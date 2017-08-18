import csv
import logging
import datetime
import sqlalchemy
from django.core.cache import caches
from sqlalchemy.ext.declarative import declarative_base, declared_attr
from sqlalchemy import Column, Integer, String, ForeignKey, Date, Float
from sqlalchemy.schema import CreateSchema, DropSchema
from itertools import zip_longest, chain
from django.conf import settings
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, relationship
from hashlib import sha256
from glob import glob
from .contextual import contextual_rows
from collections import defaultdict


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
    date_sampled = Column(Date)
    latitude = Column(Float)
    longitude = Column(Float)
    depth = Column(Float)
    geo_loc_name = Column(String)
    location_description = Column(String)
    vegetation_total_cover = Column(Float)
    vegetation_dom_trees = Column(Float)
    vegetation_dom_shrubs = Column(Float)
    vegetation_dom_grasses = Column(Float)
    elevation = Column(Float)
    slope = Column(String)
    slope_aspect = Column(String)
    date_since_change_in_land_use = Column(String)
    crop_rotation_1yr_since_present = Column(String)
    crop_rotation_2yrs_since_present = Column(String)
    crop_rotation_3yrs_since_present = Column(String)
    crop_rotation_4yrs_since_present = Column(String)
    crop_rotation_5yrs_since_present = Column(String)
    agrochemical_additions = Column(String)
    fire_history = Column(String)
    fire_intensity_if_known = Column(String)
    flooding = Column(String)
    extreme_events = Column(String)
    soil_moisture = Column(Float)
    gravel = Column(Float)
    texture = Column(Float)
    course_sand = Column(Float)
    fine_sand = Column(Float)
    sand = Column(Float)
    silt = Column(Float)
    clay = Column(Float)
    ammonium_nitrogen = Column(Float)
    nitrate_nitrogen = Column(Float)
    phosphorus_colwell = Column(Float)
    potassium_colwell = Column(Float)
    sulphur = Column(Float)
    organic_carbon = Column(Float)
    conductivity = Column(Float)
    ph_level_cacl2 = Column(Float)
    ph_level_h2o = Column(Float)
    dtpa_copper = Column(Float)
    dtpa_iron = Column(Float)
    dtpa_manganese = Column(Float)
    dtpa_zinc = Column(Float)
    exc_aluminium = Column(Float)
    exc_calcium = Column(Float)
    exc_magnesium = Column(Float)
    exc_potassium = Column(Float)
    exc_sodium = Column(Float)
    boron_hot_cacl2 = Column(Float)
    #
    horizon_classification_id = ontology_fkey(SampleHorizonClassification)
    soil_sample_storage_method_id = ontology_fkey(SampleStorageMethod)
    broad_land_use_id = ontology_fkey(SampleLandUse)
    detailed_land_use_id = ontology_fkey(SampleLandUse)
    general_ecological_zone_id = ontology_fkey(SampleEcologicalZone)
    vegetation_type_id = ontology_fkey(SampleVegetationType)
    profile_position_id = ontology_fkey(SampleProfilePosition)
    australian_soil_classification_id = ontology_fkey(SampleAustralianSoilClassification)
    fao_soil_classification_id = ontology_fkey(SampleFAOSoilClassification)
    immediate_previous_land_use_id = ontology_fkey(SampleLandUse)
    tillage_id = ontology_fkey(SampleTillage)
    color_id = ontology_fkey(SampleColor)

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