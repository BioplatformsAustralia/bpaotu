import logging
import os

from citext import CIText
from django.conf import settings
from sqlalchemy import (ARRAY, Column, Date, Time, Float, ForeignKey, Integer,
                        String, create_engine)
from sqlalchemy.dialects import postgresql
from sqlalchemy.ext.declarative import declarative_base, declared_attr
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
    utc_date_sampled = Column(Date)
    utc_time_sampled = Column(Time)
    longitude = Column(Float)
    latitude = Column(Float)
    geo_loc_country_subregion = Column(CIText)
    sample_site_location_description = Column(CIText)
    sample_submitter = Column(CIText)
    sample_attribution = Column(CIText)
    funding_agency = Column(CIText)
    sample_collection_device_method = Column(CIText)
    sample_material_processing = Column(CIText)
    sample_material_processing_method = Column(CIText)
    environment_controlled_vocab_a = Column(CIText)
    env_material_controlled_vocab_0 = Column(CIText)
    notes = Column(CIText)
    depth_lower = Column(Float)
    depth_upper = Column(Float)
    acid_volatile_sulphides = Column(Float)
    acid_volatile_sulphides_method = Column(CIText)
    agrochemical_additions = Column(CIText)
    allo = Column(Float)
    allo_method = Column(CIText)
    alpha_beta_car = Column(Float)
    alpha_beta_car_method = Column(CIText)
    ammonium_nitrogen = Column(Float)
    ammonium_nitrogen_method = Column(CIText)
    ammonium_nitrogen_mg_per_kg = Column(Float)
    ammonium_nitrogen_mg_per_kg_method = Column(CIText)
    ammonium_nitrogen_mg_per_l = Column(Float)
    ammonium_nitrogen_mg_per_l_method = Column(CIText)
    ammonium = Column(Float)
    ammonium_method = Column(CIText)
    anth = Column(Float)
    anth_method = Column(CIText)
    antimony = Column(Float)
    antimony_method = Column(CIText)
    arsenic = Column(Float)
    arsenic_method = Column(CIText)
    asta = Column(Float)
    asta_method = Column(CIText)
    average_host_abundance = Column(Float)
    barium = Column(Float)
    barium_method = Column(CIText)
    beta_beta_car = Column(Float)
    beta_beta_car_method = Column(CIText)
    beta_epi_car = Column(Float)
    beta_epi_car_method = Column(CIText)
    bleaching = Column(Float)
    boron_hot_cacl2 = Column(Float)
    boron_hot_cacl2_method = Column(CIText)
    bottle_number = Column(CIText)
    bottom_depth = Column(Float)
    bottom_depth_method = Column(CIText)
    bulk_density_g_per_cm3_or = Column(Float)
    bulk_density_method = Column(CIText)
    but_fuco = Column(Float)
    but_fuco_method = Column(CIText)
    cadmium = Column(CIText)
    cadmium_method = Column(CIText)
    cantha = Column(Float)
    cantha_method = Column(CIText)
    carbonate_bicarbonate = Column(Float)
    carbonate_bicarbonate_method = Column(CIText)
    cation_exchange_capacity = Column(CIText)
    cation_exchange_capacity_method = Column(CIText)
    cerium = Column(Float)
    cerium_method = Column(CIText)
    cesium = Column(Float)
    cesium_method = Column(CIText)
    chloride = Column(Float)
    chloride_method = Column(CIText)
    chlorophyll_a = Column(Float)
    chlorophyll_a_method = Column(CIText)
    chlorophyll_ctd = Column(Float)
    chlorophyll_ctd_method = Column(CIText)
    chromium = Column(Float)
    chromium_method = Column(CIText)
    citation = Column(CIText)
    clay = Column(Float)
    clay_method = Column(CIText)
    course_sand = Column(Float)
    course_sand_method = Column(CIText)
    coastal_id = Column(CIText)
    cobalt = Column(Float)
    cobalt_method = Column(CIText)
    conductivity_ds_per_m = Column(Float)
    conductivity_ds_per_m_method = Column(CIText)
    conductivity = Column(CIText)
    conductivity_s_per_m_method = Column(CIText)
    cphl_a = Column(Float)
    cphl_a_method = Column(CIText)
    cphl_b = Column(Float)
    cphl_b_method = Column(CIText)
    cphl_c1c2 = Column(Float)
    cphl_c1c2_method = Column(CIText)
    cphl_c1 = Column(Float)
    cphl_c1_method = Column(CIText)
    cphl_c2 = Column(Float)
    cphl_c2_method = Column(CIText)
    cphl_c3 = Column(Float)
    cphl_c3_method = Column(CIText)
    cphlide_a = Column(Float)
    cphlide_a_method = Column(CIText)
    crop_rotation_1yr_since_present = Column(CIText)
    crop_rotation_2yrs_since_present = Column(CIText)
    crop_rotation_3yrs_since_present = Column(CIText)
    crop_rotation_4yrs_since_present = Column(CIText)
    crop_rotation_5yrs_since_present = Column(CIText)
    current_land_use_controlled_vocab_2 = Column(CIText)
    date_since_change_in_land_use = Column(CIText)
    days_since_planting = Column(Float)
    density_ctd_density = Column(Float)
    density_method = Column(CIText)
    description = Column(CIText)
    diadchr = Column(Float)
    diadchr_method = Column(CIText)
    diadino = Column(Float)
    diadino_method = Column(CIText)
    diato = Column(Float)
    diato_method = Column(CIText)
    dino = Column(Float)
    dino_method = Column(CIText)
    dtpa_copper = Column(Float)
    dtpa_copper_method = Column(CIText)
    dtpa_iron = Column(Float)
    dtpa_iron_method = Column(CIText)
    dtpa_manganese = Column(Float)
    dtpa_manganese_method = Column(CIText)
    dtpa_zinc = Column(Float)
    dtpa_zinc_method = Column(CIText)
    dna_extraction_method = Column(CIText)
    dna_concentration_submitter = Column(Float)
    dna_concentration_method_submitter = Column(CIText)
    absorbance_268_280_ratio_submitter = Column(Float)
    absorbance_268_280_ratio_method_submitter = Column(CIText)
    dv_cphl_a_and_cphl_a = Column(Float)
    dv_cphl_a_and_cphl_a_method = Column(CIText)
    dv_cphl_a = Column(Float)
    dv_cphl_a_method = Column(CIText)
    dv_cphl_b_and_cphl_b = Column(Float)
    dv_cphl_b_and_cphl_b_method = Column(CIText)
    dv_cphl_b = Column(Float)
    dv_cphl_b_method = Column(CIText)
    dysprosium = Column(Float)
    dysprosium_method = Column(CIText)
    echin = Column(Float)
    echin_method = Column(CIText)
    elevation = Column(Float)
    erbium = Column(Float)
    erbium_method = Column(CIText)
    europium = Column(Float)
    europium_method = Column(CIText)
    exc_aluminium = Column(Float)
    exc_aluminium_method = Column(CIText)
    exc_calcium = Column(Float)
    exc_calcium_method = Column(CIText)
    exc_magnesium = Column(Float)
    exc_magnesium_method = Column(CIText)
    exc_potassium = Column(Float)
    exc_potassium_method = Column(CIText)
    exc_sodium = Column(Float)
    exc_sodium_method = Column(CIText)
    extreme_events = Column(CIText)
    fine_sand = Column(Float)
    fine_sand_method = Column(CIText)
    fine_sediment = Column(Float)
    fine_sediment_method = Column(CIText)
    fire = Column(CIText)
    fire_intensity_if_known = Column(CIText)
    flooding = Column(CIText)
    fluorescence_au = Column(Float)
    fluorescence_method = Column(CIText)
    fouling_organisms = Column(CIText)
    fouling = Column(Float)
    fresh_weight = Column(Float)
    fresh_weight_method = Column(CIText)
    fuco = Column(Float)
    fuco_method = Column(CIText)
    gadolinium = Column(Float)
    gadolinium_method = Column(CIText)
    gallium = Column(Float)
    gallium_method = Column(CIText)
    geospatial_coverage = Column(CIText)
    germanium = Column(Float)
    germanium_method = Column(CIText)
    gold = Column(Float)
    gold_method = Column(CIText)
    gravel = Column(CIText)
    gravel_percent_method = Column(CIText)
    grazing_number = Column(CIText)
    grazing = Column(Float)
    gyro = Column(Float)
    gyro_method = Column(CIText)
    hafnium = Column(Float)
    hafnium_method = Column(CIText)
    hex_fuco = Column(Float)
    hex_fuco_method = Column(CIText)
    holmium = Column(Float)
    holmium_method = Column(CIText)
    host_abundance_mean = Column(Float)
    host_abundance = Column(Float)
    host_abundance_seaweed_mean = Column(Float)
    host_associated_microbiome_zone_see_vocab_d = Column(CIText)
    host_species = Column(CIText)
    host_species_variety = Column(CIText)
    host_state = Column(CIText)
    host_type_see_vocab_c = Column(CIText)
    icp_te_boron = Column(Float)
    icp_te_boron_method = Column(CIText)
    icp_te_calcium = Column(Float)
    icp_te_calcium_method = Column(CIText)
    icp_te_copper = Column(Float)
    icp_te_copper_method = Column(CIText)
    icp_te_iron = Column(Float)
    icp_te_iron_method = Column(CIText)
    icp_te_magnesium = Column(Float)
    icp_te_magnesium_method = Column(CIText)
    icp_te_manganese = Column(Float)
    icp_te_manganese_method = Column(CIText)
    icp_te_phosphorus = Column(Float)
    icp_te_phosphorus_method = Column(CIText)
    icp_te_potassium = Column(Float)
    icp_te_potassium_method = Column(CIText)
    icp_te_sodium = Column(Float)
    icp_te_sodium_method = Column(CIText)
    icp_te_sulfur = Column(Float)
    icp_te_sulfur_method = Column(CIText)
    icp_te_zinc = Column(Float)
    icp_te_zinc_method = Column(CIText)
    imos_site_code = Column(CIText)
    information = Column(CIText)
    inorganic_fraction = Column(Float)
    inorganic_fraction_method = Column(CIText)
    iridium = Column(Float)
    iridium_method = Column(CIText)
    keto_hex_fuco = Column(Float)
    keto_hex_fuco_method = Column(CIText)
    lanthanum = Column(Float)
    lanthanum_method = Column(CIText)
    lead = Column(Float)
    lead_method = Column(CIText)
    length_cm = Column(Float)
    light_intensity_lux = Column(Float)
    light_intensity_lux_method = Column(CIText)
    light_intensity_meadow = Column(Float)
    light_intensity_meadow_method = Column(CIText)
    light_intensity_bottom = Column(Float)
    light_intensity_bottom_method = Column(CIText)
    light_intensity_surface = Column(Float)
    light_intensity_surface_method = Column(CIText)
    lutetium = Column(Float)
    lutetium_method = Column(CIText)
    lut = Column(Float)
    lut_method = Column(CIText)
    lyco = Column(Float)
    lyco_method = Column(CIText)
    metals = Column(CIText)
    metals_method = Column(CIText)
    method_of_australian_soil_classification = Column(CIText)
    method_of_fao_soil_classification = Column(CIText)
    mg_dvp = Column(Float)
    mg_dvp_method = Column(CIText)
    microbial_abundance = Column(Float)
    microbial_abundance_method = Column(CIText)
    microbial_biomass = Column(Float)
    microbial_biomass_method = Column(CIText)
    molybdenum = Column(Float)
    molybdenum_method = Column(CIText)
    mud = Column(Float)
    mud_method = Column(CIText)
    ncbi_bioproject_accession = Column(CIText)
    ncbi_biosample_accession = Column(CIText)
    neodymium = Column(Float)
    neodymium_method = Column(CIText)
    neo = Column(Float)
    neo_method = Column(CIText)
    nickel = Column(Float)
    nickel_method = Column(CIText)
    niobium_columbium = Column(Float)
    niobium_columbium_method = Column(CIText)
    nitrate_nitrite = Column(Float)
    nitrate_nitrite_method = Column(CIText)
    nitrate_nitrogen = Column(Float)
    nitrate_nitrogen_mg_per_kg_method = Column(CIText)
    nitrite = Column(Float)
    nitrite_method = Column(CIText)
    no2 = Column(CIText)
    no2_method = Column(CIText)
    npic = Column(Float)
    npic_method = Column(CIText)
    npoc = Column(Float)
    npoc_method = Column(CIText)
    nrs_sample_code = Column(CIText)
    nrs_trip_code = Column(CIText)
    operation_cast_id = Column(CIText)
    organic_carbon = Column(Float)
    organic_carbon_percent_method = Column(CIText)
    organic_fraction = Column(Float)
    organic_fraction_method = Column(CIText)
    organic_matter_content_loi = Column(Float)
    organic_matter_content_method = Column(CIText)
    osmium = Column(Float)
    osmium_method = Column(CIText)
    oxygen_ml_per_l_ctd = Column(Float)
    oxygen_ml_per_l_method = Column(CIText)
    oxygen_ctd = Column(Float)
    oxygen_ctd_method = Column(CIText)
    oxygen = Column(Float)
    oxygen_method = Column(CIText)
    palladium = Column(Float)
    palladium_method = Column(CIText)
    pam_fluorometer_measurement = Column(Float)
    pam_fluorometer_measurement_method = Column(CIText)
    perid = Column(Float)
    perid_method = Column(CIText)
    ph_aqueous = Column(Float)
    ph_aqueous_method = Column(CIText)
    phide_a = Column(Float)
    phide_a_method = Column(CIText)
    phosphate = Column(Float)
    phosphate_method = Column(CIText)
    phosphorus_colwell = Column(Float)
    phosphorus_colwell_method = Column(CIText)
    ph_solid_cacl2 = Column(Float)
    ph_solid_cacl2_method = Column(CIText)
    ph_solid_h2o = Column(Float)
    ph_solid_h2o_method = Column(CIText)
    phytin_a = Column(Float)
    phytin_a_method = Column(CIText)
    phytin_b = Column(Float)
    phytin_b_method = Column(CIText)
    pigments = Column(CIText)
    pigments_methods = Column(CIText)
    plant_id = Column(CIText)
    plant_stage = Column(CIText)
    plant_stage_method = Column(CIText)
    platinum = Column(Float)
    platinum_method = Column(CIText)
    pn = Column(Float)
    pn_method = Column(CIText)
    poc = Column(Float)
    poc_method = Column(CIText)
    porewater_ph = Column(Float)
    porewater_ph_method = Column(CIText)
    potassium_colwell = Column(Float)
    potassium_colwell_method = Column(CIText)
    praseodymium = Column(Float)
    praseodymium_method = Column(CIText)
    pras = Column(Float)
    pras_method = Column(CIText)
    pres_rel_dbar = Column(CIText)
    pres_rel_method = Column(CIText)
    pyrophide_a = Column(Float)
    pyrophide_a_method = Column(CIText)
    pyrophytin_a = Column(Float)
    pyrophytin_a_method = Column(CIText)
    rhodium = Column(Float)
    rhodium_method = Column(CIText)
    root_length = Column(Float)
    root_length_method = Column(CIText)
    rubidium = Column(Float)
    rubidium_method = Column(CIText)
    ruthenium = Column(Float)
    ruthenium_method = Column(CIText)
    salinity_ctd_psu = Column(Float)
    salinity_ctd_method = Column(CIText)
    salinity_lab_psu = Column(Float)
    salinity_lab_method = Column(CIText)
    samarium = Column(Float)
    samarium_method = Column(CIText)
    sample_integrity_warnings = Column(CIText)
    sample_volume = Column(Float)
    sample_volume_notes = Column(CIText)
    sand = Column(Float)
    sand_method = Column(CIText)
    scandium = Column(Float)
    scandium_method = Column(CIText)
    secchi_depth = Column(Float)
    secchi_depth_method = Column(CIText)
    sedimentation_rate = Column(Float)
    sedimentation_rate_method = Column(CIText)
    sediment_porewater_h4sio4 = Column(Float)
    sediment_porewater_h4sio4_method = Column(CIText)
    sediment_porewater_nh4 = Column(Float)
    sediment_porewater_nh4_method = Column(CIText)
    sediment_porewater_no2 = Column(Float)
    sediment_porewater_no2_method = Column(CIText)
    sediment_porewater_no3 = Column(Float)
    sediment_porewater_no3_method = Column(CIText)
    sediment_porewater_po43 = Column(Float)
    sediment_porewater_po43_method = Column(CIText)
    selenium = Column(Float)
    selenium_method = Column(CIText)
    shoot_length = Column(Float)
    shoot_length_method = Column(CIText)
    silicate = Column(Float)
    silicate_method = Column(CIText)
    silt = Column(Float)
    silt_method = Column(CIText)
    silver = Column(Float)
    silver_method = Column(CIText)
    sio2 = Column(Float)
    sio2_method = Column(CIText)
    slope_aspect_direction_or_degrees = Column(CIText)
    slope = Column(Float)
    slope_method = Column(Float)
    soil_moisture = Column(Float)
    soil_moisture_method = Column(CIText)
    stress = Column(CIText)
    strontium = Column(Float)
    strontium_method = Column(CIText)
    sulphur = Column(Float)
    sulphur_method = Column(CIText)
    tantalum = Column(Float)
    tantalum_method = Column(CIText)
    temperature = Column(Float)
    temperature_method = Column(CIText)
    temperature_ctd = Column(Float)
    temperature_ctd_method = Column(CIText)
    terbium = Column(Float)
    terbium_method = Column(CIText)
    texture = Column(CIText)
    texture_method = Column(CIText)
    thorium = Column(Float)
    thorium_method = Column(CIText)
    thulium = Column(Float)
    thulium_method = Column(CIText)
    tin = Column(Float)
    tin_method = Column(CIText)
    toc = Column(CIText)
    toc_method = Column(CIText)
    total_alkalinity = Column(Float)
    total_alkalinity_method = Column(CIText)
    total_carbon = Column(Float)
    total_carbon_percent_method = Column(CIText)
    total_co2 = Column(Float)
    total_co2_method = Column(CIText)
    total_inorganic_carbon = Column(Float)
    total_inorganic_carbon_percent_method = Column(CIText)
    total_nitrogen = Column(Float)
    total_nitrogen_method = Column(CIText)
    total_phosphorous = Column(Float)
    total_phosphorous_mg_per_kg_method = Column(CIText)
    total_phosphorous_percent = Column(Float)
    total_phosphorous_method = Column(CIText)
    touching_organisms = Column(CIText)
    transmittance = Column(Float)
    transmittance_method = Column(CIText)
    tss = Column(Float)
    tss_method = Column(CIText)
    tungsten_or_wolfram = Column(Float)
    tungsten_or_wolfram_method = Column(CIText)
    turbidity = Column(Float)
    turbidity_ntu_method = Column(CIText)
    turbidity_ctd = Column(Float)
    turbidity_ctd_method = Column(CIText)
    uranium = Column(Float)
    uranium_method = Column(CIText)
    vanadium = Column(Float)
    vanadium_method = Column(CIText)
    vegetation_dom_grasses = Column(CIText)
    vegetation_dom_shrubs = Column(CIText)
    vegetation_dom_trees = Column(CIText)
    vegetation_total_basal_area = Column(Float)
    vegetation_total_cover = Column(CIText)
    vegetation_type_descriptive = Column(CIText)
    viola = Column(Float)
    viola_method = Column(CIText)
    voyage_code = Column(CIText)
    voyage_survey_link = Column(CIText)
    water_depth = Column(Float)
    water_holding_capacity = Column(CIText)
    water_holding_capacity_method = Column(CIText)
    ytterbium = Column(Float)
    ytterbium_method = Column(CIText)
    yttrium = Column(Float)
    yttrium_method = Column(CIText)
    zea = Column(Float)
    zea_method = Column(CIText)
    zirconium = Column(Float)
    zirconium_method = Column(CIText)
    sample_metadata_ingest_date = Column(Date)
    sample_metadata_ingest_file = Column(CIText)
    sample_metadata_update_history = Column(CIText)
    #
    # ontologies: note the default, which is by definition the empty string (''), we don't permit NULLs
    # in ontology columns
    #
    australian_soil_classification_control_vocab_6_id = ontology_fkey(SampleAustralianSoilClassification, default=0)
    broad_land_use_major_head_control_vocab_2_id = ontology_fkey(SampleLandUse, default=0)
    color_control_vocab_10_id = ontology_fkey(SampleColor, default=0)
    detailed_land_use_sub_head_control_vocab_2_id = ontology_fkey(SampleLandUse, default=0)
    general_env_feature_control_vocab_3_id = ontology_fkey(SampleEcologicalZone, default=0)
    environment_id = ontology_fkey(Environment, default=0)
    sample_type_id = ontology_fkey(SampleType, default=0)
    vegetation_type_id = ontology_fkey(SampleVegetationType, default=0)
    profile_position_control_vocab_5_id = ontology_fkey(SampleProfilePosition, default=0)
    tillage_control_vocab_9_id = ontology_fkey(SampleTillage, default=0)
    immediate_previous_land_use_control_vocab_2_id = ontology_fkey(SampleLandUse, default=0)
    fao_soil_classification_control_vocab_7_id = ontology_fkey(SampleFAOSoilClassification, default=0)
    horizon_control_vocab_1_id = ontology_fkey(SampleHorizonClassification, default=0)
    sample_storage_method_id = ontology_fkey(SampleStorageMethod, default=0)

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
    conf = settings.DATABASES['default']
    engine_string = 'postgres://%(USER)s:%(PASSWORD)s@%(HOST)s:%(PORT)s/%(NAME)s' % (conf)
    echo = os.environ.get('BPAOTU_ECHO') == '1'
    return create_engine(engine_string, echo=echo)
