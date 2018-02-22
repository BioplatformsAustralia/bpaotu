from .libs.excel_wrapper import ExcelWrapper
from .libs import ingest_utils
import datetime
from .contextual_controlled_vocabularies import *

import logging

logger = logging.getLogger("rainbow")

# this code is taken from bpa-ingest: projects/base/contextual.py

CHEM_MIN_SENTINAL_VALUE = 0.0001


def fix_sometimes_date(val):
    "mix of dates and free-text, make into strings"
    if type(val) is datetime.date or type(val) is datetime.datetime:
        return ingest_utils.get_date_isoformat(val)
    val = val.strip()
    if val == '':
        return None
    return val


def fix_slope_date(val):
    # 2/3 has been turned into a date by Excel
    if isinstance(val, datetime.datetime):
        return '%s/%s' % (val.day, val.month)
    return val


soil_field_spec = [
    ('bpa_id', 'sample_id', ingest_utils.extract_bpa_id),
    ('date_sampled', 'date sampled', ingest_utils.get_date_isoformat),
    ('latitude', 'latitude', ingest_utils.get_clean_number),
    ('longitude', 'longitude', ingest_utils.get_clean_number),
    ('depth', 'depth', ingest_utils.get_clean_number),
    ('horizon_classification', 'horizon'),
    ('soil_sample_storage_method', 'soil sample storage method'),
    ('geo_loc', 'geo_loc'),
    ('location_description', 'location description'),
    ('broad_land_use', 'broad land use'),
    ('detailed_land_use', 'detailed land use'),
    ('general_ecological_zone', 'general ecological zone'),
    ('vegetation_type', 'vegetation type'),
    ('vegetation_total_cover', 'vegetation total cover (%)', ingest_utils.get_clean_number),
    ('vegetation_dom_trees', 'vegetation dom. trees (%)', ingest_utils.get_clean_number),
    ('vegetation_dom_shrubs', 'vegetation dom. shrubs (%)', ingest_utils.get_clean_number),
    ('vegetation_dom_grasses', 'vegetation dom. grasses (%)', ingest_utils.get_clean_number),
    ('elevation', 'elevation ()', ingest_utils.get_clean_number),
    ('slope', 'slope (%)', fix_slope_date),
    ('slope_aspect', 'slope aspect (direction or degrees; e.g., nw or 315)'),
    ('profile_position', 'profile position controlled vocab (5)'),
    ('australian_soil_classification', 'australian soil classification controlled vocab (6)'),
    ('fao_soil_classification', 'fao soil classification controlled vocab (7)'),
    ('immediate_previous_land_use', 'immediate previous land use controlled vocab (2)'),
    ('date_since_change_in_land_use', 'date since change in land use'),
    ('crop_rotation_1yr_since_present', 'crop rotation 1yr since present'),
    ('crop_rotation_2yrs_since_present', 'crop rotation 2yrs since present'),
    ('crop_rotation_3yrs_since_present', 'crop rotation 3yrs since present'),
    ('crop_rotation_4yrs_since_present', 'crop rotation 4yrs since present'),
    ('crop_rotation_5yrs_since_present', 'crop rotation 5yrs since present'),
    ('agrochemical_additions', 'agrochemical additions'),
    ('tillage', 'tillage controlled vocab (9)'),
    ('fire_history', 'fire', fix_sometimes_date),
    ('fire_intensity_if_known', 'fire intensity if known'),
    ('flooding', 'flooding', fix_sometimes_date),
    ('extreme_events', 'extreme events'),
    ('soil_moisture', 'soil moisture (%)', ingest_utils.get_clean_number),
    ('color', 'color controlled vocab (10)'),
    ('gravel', 'gravel (%)- ( >2.0 mm)', ingest_utils.get_clean_number),
    ('texture', 'texture ()', ingest_utils.get_clean_number),
    ('course_sand', 'course sand (%) (200-2000 m)', ingest_utils.get_clean_number),
    ('fine_sand', 'fine sand (%) - (20-200 m)', ingest_utils.get_clean_number),
    ('sand', 'sand (%)', ingest_utils.get_clean_number),
    ('silt', 'silt  (%) (2-20 m)', ingest_utils.get_clean_number),
    ('clay', 'clay (%) (<2 m)', ingest_utils.get_clean_number),
    ('ammonium_nitrogen', 'ammonium nitrogen (mg/kg)', ingest_utils.get_clean_number),
    ('nitrate_nitrogen', 'nitrate nitrogen (mg/kg)', ingest_utils.get_clean_number),
    ('phosphorus_colwell', 'phosphorus colwell (mg/kg)', ingest_utils.get_clean_number),
    ('potassium_colwell', 'potassium colwell (mg/kg)', ingest_utils.get_clean_number),
    ('sulphur', 'sulphur (mg/kg)', ingest_utils.get_clean_number),
    ('organic_carbon', 'organic carbon (%)', ingest_utils.get_clean_number),
    ('conductivity', 'conductivity (ds/m)', ingest_utils.get_clean_number),
    ('ph_level_cacl2', 'ph level (cacl2) (ph)', ingest_utils.get_clean_number),
    ('ph_level_h2o', 'ph level (h2o) (ph)', ingest_utils.get_clean_number),
    ('dtpa_copper', 'dtpa copper (mg/kg)', ingest_utils.get_clean_number),
    ('dtpa_iron', 'dtpa iron (mg/kg)', ingest_utils.get_clean_number),
    ('dtpa_manganese', 'dtpa manganese (mg/kg)', ingest_utils.get_clean_number),
    ('dtpa_zinc', 'dtpa zinc (mg/kg)', ingest_utils.get_clean_number),
    ('exc_aluminium', 'exc. aluminium (meq/100g)', ingest_utils.get_clean_number),
    ('exc_calcium', 'exc. calcium (meq/100g)', ingest_utils.get_clean_number),
    ('exc_magnesium', 'exc. magnesium (meq/100g)', ingest_utils.get_clean_number),
    ('exc_potassium', 'exc. potassium (meq/100g)', ingest_utils.get_clean_number),
    ('exc_sodium', 'exc. sodium (meq/100g)', ingest_utils.get_clean_number),
    ('boron_hot_cacl2', 'boron hot cacl2 (mg/kg)', ingest_utils.get_clean_number),
]


marine_field_specs = {
    'Coastal water': [
        ('bpa_id', 'bpa_id', ingest_utils.extract_bpa_id),
        ('date_sampled', 'date sampled (yyyy-mm-dd)', ingest_utils.get_date_isoformat),
        ('time_sampled', 'time sampled (hh:mm)', ingest_utils.get_time),
        ('latitude', 'latitude (decimal degrees)', ingest_utils.get_clean_number),
        ('longitude', 'longitude (decimal degrees)', ingest_utils.get_clean_number),
        ('depth', 'depth (m)', ingest_utils.get_clean_number),
        ('geo_loc', 'geo_loc (country:subregion)'),
        ('sample_site', 'sample site'),
        ('coastal_id', 'coastal_id'),
        ('notes', 'notes'),
        ('ph_level', 'ph level (h2o) (ph)', ingest_utils.get_clean_number),
        ('oxygen_lab', 'oxygen (mol/l) lab', ingest_utils.get_clean_number),
        ('oxygen_ctd', 'oxygen (ml/l) ctd', ingest_utils.get_clean_number),
        ('nitrate_nitrite', 'nitrate/nitrite (mol/l)', ingest_utils.get_clean_number),
        ('phosphate', 'phosphate (mol/l)', ingest_utils.get_clean_number),
        ('ammonium', 'ammonium (mol/l)', ingest_utils.get_clean_number),
        ('total_co2', 'total co2 (mol/kg)', ingest_utils.get_clean_number),
        ('total_alkalinity', 'total alkalinity (mol/kg)', ingest_utils.get_clean_number),
        ('temperature', 'temperature [its-90, deg c]', ingest_utils.get_clean_number),
        ('conductivity', 'conductivity [s/m]', ingest_utils.get_clean_number),
        ('turbidity', 'turbidity (upoly 0, wet labs flnturt)', ingest_utils.get_clean_number),
        ('salinity', 'salinity [psu] laboratory', ingest_utils.get_clean_number),
        ('microbial_abundance', 'microbial abundance (cells per ml)', ingest_utils.get_clean_number),
        ('chlorophyll_a', 'chlorophyll a (g/l)', ingest_utils.get_clean_number),
        ('per_total_carbon', '%total carbon', ingest_utils.get_clean_number),
        ('per_total_inorganc_carbon', '% total inorganc carbon', ingest_utils.get_clean_number),
        ('light_intensity', 'light intensity (lux)', ingest_utils.get_clean_number),
    ],
    'Coral': [
        ('bpa_id', 'bpa_id', ingest_utils.extract_bpa_id),
        ('date_sampled', 'date sampled (yyyy-mm-dd)', ingest_utils.get_date_isoformat),
        ('time_sampled', 'time sampled (hh:mm)', ingest_utils.get_time),
        ('latitude', 'latitude (decimal degrees)', ingest_utils.get_clean_number),
        ('longitude', 'longitude (decimal degrees)', ingest_utils.get_clean_number),
        ('depth', 'depth (m)', ingest_utils.get_clean_number),
        ('geo_loc', 'geo_loc (country:subregion)'),
        ('sample_site', 'sample site'),
        ('coastal_id', 'coastal_id'),
        ('host_species', 'host species'),
        ('notes', 'notes'),
        ('pulse_amplitude_modulated_fluorometer_measurement', 'pulse amplitude modulated (pam) fluorometer measurement', ingest_utils.get_clean_number),
        ('host_state', 'host state (free text field)'),
        ('host_abundance', 'host abundance (individuals per m2)', ingest_utils.get_clean_number),
    ],
    'Pelagic': [
        ('bpa_id', 'bpa_id', ingest_utils.extract_bpa_id),
        ('date_sampled', 'date sampled (yyyy-mm-dd)', ingest_utils.get_date_isoformat),
        ('time_sampled', 'time sampled (hh:mm)', ingest_utils.get_time),
        ('latitude', 'latitude (decimal degrees)', ingest_utils.get_clean_number),
        ('longitude', 'longitude (decimal degrees)', ingest_utils.get_clean_number),
        ('depth', 'depth (m)', ingest_utils.get_clean_number),
        ('geo_loc', 'geo_loc (country:subregion)'),
        ('sample_site', 'sample site'),
        ('notes', 'notes'),
        ('ph_level', 'ph level (h2o) (ph)', ingest_utils.get_clean_number),
        ('oxygen_umol_l_lab', 'oxygen (mol/l) lab', ingest_utils.get_clean_number),
        ('oxygen_umol_kg_ctd', 'oxygen (mol/kg) ctd', ingest_utils.get_clean_number),
        ('oxygen_ml_l_ctd', 'oxygen (ml/l) ctd', ingest_utils.get_clean_number),
        ('silicate', 'silicate (mol/l)', ingest_utils.get_clean_number),
        ('nitrate_nitrite', 'nitrate/nitrite (mol/l)', ingest_utils.get_clean_number),
        ('phosphate', 'phosphate (mol/l)', ingest_utils.get_clean_number),
        ('ammonium', 'ammonium (mol/l)', ingest_utils.get_clean_number),
        ('total_co2', 'total co2 (mol/kg)', ingest_utils.get_clean_number),
        ('total_alkalinity', 'total alkalinity (mol/kg)', ingest_utils.get_clean_number),
        ('temperature', 'temperature [its-90, deg c]', ingest_utils.get_clean_number),
        ('conductivity', 'conductivity [s/m]', ingest_utils.get_clean_number),
        ('fluorescence_wetlab', 'fluorescence, wetlab eco-afl/fl [mg/m^3]', ingest_utils.get_clean_number),
        ('fluorescence', 'fluorescence (au)', ingest_utils.get_clean_number),
        ('transmittance', 'transmittance (%)', ingest_utils.get_clean_number),
        ('turbidity_ctd', 'turbidity (nephelometric turbidity units) ctd', ingest_utils.get_clean_number),
        ('density', 'density [density, kg/m^3] ctd', ingest_utils.get_clean_number),
        ('depth_salt_water', 'depth [salt water, m], lat = -27.2', ingest_utils.get_clean_number),
        ('salinity_lab', 'salinity [psu] lab', ingest_utils.get_clean_number),
        ('salinity_ctd', 'salinity [psu] ctd', ingest_utils.get_clean_number),
        ('tss', 'tss [mg/l]', ingest_utils.get_clean_number),
        ('inorganic_fraction', 'inorganic fraction [mg/l]', ingest_utils.get_clean_number),
        ('organic_fraction', 'organic fraction [mg/l]', ingest_utils.get_clean_number),
        ('secchi_depth', 'secchi depth (m)', ingest_utils.get_clean_number),
        ('biomass', 'biomass (mg/m3)', ingest_utils.get_clean_number),
        ('allo', 'allo [mg/m3]', ingest_utils.get_clean_number),
        ('alpha_beta_car', 'alpha_beta_car [mg/m3]', ingest_utils.get_clean_number),
        ('anth', 'anth [mg/m3]', ingest_utils.get_clean_number),
        ('asta', 'asta [mg/m3]', ingest_utils.get_clean_number),
        ('beta_beta_car', 'beta_beta_car [mg/m3]', ingest_utils.get_clean_number),
        ('beta_epi_car', 'beta_epi_car [mg/m3]', ingest_utils.get_clean_number),
        ('but_fuco', 'but_fuco [mg/m3]', ingest_utils.get_clean_number),
        ('cantha', 'cantha [mg/m3]', ingest_utils.get_clean_number),
        ('cphl_a', 'cphl_a [mg/m3]', ingest_utils.get_clean_number),
        ('cphl_b', 'cphl_b [mg/m3]', ingest_utils.get_clean_number),
        ('cphl_c1c2', 'cphl_c1c2 [mg/m3]', ingest_utils.get_clean_number),
        ('cphl_c1', 'cphl_c1 [mg/m3]', ingest_utils.get_clean_number),
        ('cphl_c2', 'cphl_c2 [mg/m3]', ingest_utils.get_clean_number),
        ('cphl_c3', 'cphl_c3 [mg/m3]', ingest_utils.get_clean_number),
        ('cphlide_a', 'cphlide_a [mg/m3]', ingest_utils.get_clean_number),
        ('diadchr', 'diadchr [mg/m3]', ingest_utils.get_clean_number),
        ('diadino', 'diadino [mg/m3]', ingest_utils.get_clean_number),
        ('diato', 'diato [mg/m3]', ingest_utils.get_clean_number),
        ('dino', 'dino [mg/m3]', ingest_utils.get_clean_number),
        ('dv_cphl_a_and_cphl_a', 'dv_cphl_a_and_cphl_a [mg/m3]', ingest_utils.get_clean_number),
        ('dv_cphl_a', 'dv_cphl_a [mg/m3]', ingest_utils.get_clean_number),
        ('dv_cphl_b_and_cphl_b', 'dv_cphl_b_and_cphl_b [mg/m3]', ingest_utils.get_clean_number),
        ('dv_cphl_b', 'dv_cphl_b [mg/m3]', ingest_utils.get_clean_number),
        ('echin', 'echin [mg/m3]', ingest_utils.get_clean_number),
        ('fuco', 'fuco [mg/m3]', ingest_utils.get_clean_number),
        ('gyro', 'gyro [mg/m3]', ingest_utils.get_clean_number),
        ('hex_fuco', 'hex_fuco [mg/m3]', ingest_utils.get_clean_number),
        ('keto_hex_fuco', 'keto_hex_fuco [mg/m3]', ingest_utils.get_clean_number),
        ('lut', 'lut [mg/m3]', ingest_utils.get_clean_number),
        ('lyco', 'lyco [mg/m3]', ingest_utils.get_clean_number),
        ('mg_dvp', 'mg_dvp [mg/m3]', ingest_utils.get_clean_number),
        ('neo', 'neo [mg/m3]', ingest_utils.get_clean_number),
        ('perid', 'perid [mg/m3]', ingest_utils.get_clean_number),
        ('phide_a', 'phide_a [mg/m3]', ingest_utils.get_clean_number),
        ('phytin_a', 'phytin_a [mg/m3]', ingest_utils.get_clean_number),
        ('phytin_b', 'phytin_b [mg/m3]', ingest_utils.get_clean_number),
        ('pras', 'pras [mg/m3]', ingest_utils.get_clean_number),
        ('pyrophide_a', 'pyrophide_a [mg/m3]', ingest_utils.get_clean_number),
        ('pyrophytin_a', 'pyrophytin_a [mg/m3]', ingest_utils.get_clean_number),
        ('viola', 'viola [mg/m3]', ingest_utils.get_clean_number),
        ('zea', 'zea [mg/m3]', ingest_utils.get_clean_number),
        ('dna_extraction_date', 'dna extraction date', ingest_utils.get_date_isoformat),
        ('location_code', 'location_code'),
        ('year', 'year'),
        ('month', 'month'),
        ('day', 'day'),
        ('a16s_comment', 'a16s comment'),
        ('b16s_comment', 'b16s comment'),
        ('e18s_comment', 'e18s comment'),
        ('metagenome_comment', 'metagenome comment'),
        ('sample_code', 'sample_code'),
        ('nitrite', 'nitrite', ingest_utils.get_clean_number),
        ('oxygen', 'oxygen (ctd)', ingest_utils.get_clean_number),
        ('ctd_salinity', 'ctd salinity', ingest_utils.get_clean_number),
        ('salinity', 'salinity', ingest_utils.get_clean_number),
        ('extraction_number', 'extraction number', ingest_utils.get_clean_number),
        ('deployment', 'deployment'),
        ('rp', 'rp', ingest_utils.get_clean_number),
        ('bottom_depth', 'bottom depth', ingest_utils.get_clean_number),
        ('pressure', 'pressure', ingest_utils.get_clean_number),
        ('time', 'time', ingest_utils.get_time),
        ('chl_a_epi', 'chl_a_epi', ingest_utils.get_clean_number),
        ('chl_a_allomer', 'chl_a_allomer', ingest_utils.get_clean_number),
        ('zm_delta_sigmat', 'zm (delta.sigmat)', ingest_utils.get_clean_number),
        ('zm_sigmat', 'zm (sigmat)', ingest_utils.get_clean_number),
        ('stratification', 'stratification (zm)', ingest_utils.get_clean_number),
        ('temp_from_ctd_file', '[temp from ctd file]', ingest_utils.get_clean_number),
    ],
    'Seaweed': [
        ('bpa_id', 'bpa_id', ingest_utils.extract_bpa_id),
        ('date_sampled', 'date sampled (yyyy-mm-dd)', ingest_utils.get_date_isoformat),
        ('time_sampled', 'time sampled (hh:mm)', ingest_utils.get_time),
        ('latitude', 'latitude (decimal degrees)', ingest_utils.get_clean_number),
        ('longitude', 'longitude (decimal degrees)', ingest_utils.get_clean_number),
        ('depth', 'depth (m)', ingest_utils.get_clean_number),
        ('geo_loc', 'geo_loc (country:subregion)'),
        ('sample_site', 'sample site'),
        ('coastal_id', 'coastal_id'),
        ('host_species', 'host species'),
        ('notes', 'notes'),
        ('pulse_amplitude_modulated_pam_fluorometer_measurement', 'pulse amplitude modulated (pam) fluorometer measurement', ingest_utils.get_clean_number),
        ('host_state', 'host state (free text field)'),
        ('host_abundance', 'host abundance (individuals per m2)', ingest_utils.get_clean_number),
    ],
    'Sediment': [
        ('bpa_id', 'bpa_id', ingest_utils.extract_bpa_id),
        ('date_sampled', 'date sampled (yyyy-mm-dd)', ingest_utils.get_date_isoformat),
        ('time_sampled', 'time sampled (hh:mm)', ingest_utils.get_time),
        ('latitude', 'latitude (decimal degrees)', ingest_utils.get_clean_number),
        ('longitude', 'longitude (decimal degrees)', ingest_utils.get_clean_number),
        ('depth', 'depth (m)', ingest_utils.get_clean_number),
        ('geo_loc', 'geo_loc (country:subregion)'),
        ('sample_site', 'sample site'),
        ('coastal_id', 'coastal_id'),
        ('notes', 'notes'),
        ('per_total_carbon', '%total carbon', ingest_utils.get_clean_number),
        ('per_fine_sediment', '% fine sediment', ingest_utils.get_clean_number),
        ('per_total_nitrogen', '% total nitrogen', ingest_utils.get_clean_number),
        ('per_total_phosphorous', '% total phosphorous', ingest_utils.get_clean_number),
        ('sedimentation_rate', 'sedimentation rate (g /(cm2 x y)r)', ingest_utils.get_clean_number),
    ],
    'Sponge': [
        ('bpa_id', 'bpa_id', ingest_utils.extract_bpa_id),
        ('date_sampled', 'date sampled (yyyy-mm-dd)', ingest_utils.get_date_isoformat),
        ('time_sampled', 'time sampled (hh:mm)', ingest_utils.get_time),
        ('latitude', 'latitude (decimal degrees)', ingest_utils.get_clean_number),
        ('longitude', 'longitude (decimal degrees)', ingest_utils.get_clean_number),
        ('depth', 'depth (m)', ingest_utils.get_clean_number),
        ('geo_loc', 'geo_loc (country:subregion)'),
        ('sample_site', 'sample site'),
        ('coastal_id', 'coastal_id'),
        ('host_species', 'host species'),
        ('notes', 'notes'),
        ('host_state', 'host state (free text field)'),
        ('host_abundance', 'host abundance (individuals per m2)', ingest_utils.get_clean_number),
    ]
}


class NotInVocabulary(Exception):
    pass


def soil_contextual_rows(metadata_path):
    wrapper = ExcelWrapper(
        soil_field_spec,
        metadata_path,
        sheet_name=None,
        header_length=1,
        column_name_row_index=0,
        additional_context={'project': 'BASE', 'sample_type': 'Soil'})


    def _normalise_classification(s):
        s = s.lower()
        s = s.replace(" ", "")
        s = s.replace("&", "and")
        s = s.replace("reserve", "reserves")

        return s


    def _fix_australian_soil_classification(original):
        recognised_classifications = []
        for classification, _ in AustralianSoilClassificationVocabulary:
            recognised_classifications.append(classification)

        recognised_classifications = dict((_normalise_classification(x), x) for x in recognised_classifications)
        # hard-coded fixes
        recognised_classifications[_normalise_classification('Tenosol')] = 'Tenosols'
        recognised_classifications[_normalise_classification('Chromosol')] = 'Chromosols'
        recognised_classifications[_normalise_classification('Hydrosol')] = 'Hydrosols'

        norm = _normalise_classification(original)
        if not norm:
            return ''
        elif norm in recognised_classifications:
            return recognised_classifications[norm]
        else:
            raise NotInVocabulary(original)
            return ''


    def _fix_broad_land_use(original):
        recognised_classifications = []

        for classification in LandUseVocabulary:
            recognised_classifications.append(classification[0])

        recognised_classifications = dict((_normalise_classification(x), x) for x in recognised_classifications)
        norm = _normalise_classification(original)

        if not norm:
            return ''
        elif norm in recognised_classifications:
            return recognised_classifications[norm]
        else:
            raise NotInVocabulary(original)
            return ''



    def _fix_detailed_land_use(original):
        recognised_classifications = []


        # the tree does not go more than 3 levels down.
        for classification in LandUseVocabulary:
            logger.critical(classification[0])

            for subclassification in classification:
                if type(subclassification) is tuple:
                    recognised_classifications.append(subclassification[0])
                    logger.critical(subclassification[0])

                for subsubclassification in subclassification:
                    if type(subsubclassification) is tuple:
                        for elem in subsubclassification:
                            recognised_classifications.append(elem)
                            logger.critical(elem)



        # 1. normalise classification list
        recognised_classifications = dict((_normalise_classification(x), x) for x in recognised_classifications)

        # 2. add hardcoded values
        recognised_classifications[_normalise_classification('Strict nature reserve')] = 'Strict nature reserves'

        # 3. normalise original string
        norm = _normalise_classification(original)
        if not norm:
            return ''
        elif norm in recognised_classifications:
            return recognised_classifications[norm]
        else:
            raise NotInVocabulary(original)
            return ''

        quit()














    ontology_cleanups = {
        'detailed_land_use': _fix_detailed_land_use,
        'broad_land_use': _fix_broad_land_use,
        'australian_soil_classification': _fix_australian_soil_classification,
    }

    onotology_error_values = dict((t, set()) for t in ontology_cleanups)

    objs = []
    for row in wrapper.get_all():
        obj = row._asdict()

        for cleanup_name, cleanup_fn in ontology_cleanups.items():
            try:
                obj[cleanup_name] = cleanup_fn(obj[cleanup_name])
            except NotInVocabulary as e:
                onotology_error_values[cleanup_name].add(e.args[0])
        objs.append(obj)
    logger.critical(onotology_error_values)
    return objs


def marine_contextual_rows(metadata_path):
    # MM spreadsheet has multiple tabs for the various forms of data
    rows = []
    for sheet_name, field_spec in sorted(marine_field_specs.items()):
        wrapper = ExcelWrapper(
            field_spec,
            metadata_path,
            sheet_name=sheet_name,
            header_length=1,
            column_name_row_index=0,
            additional_context={'sample_type': sheet_name, 'project': 'Marine Microbes'})
        rows += wrapper.get_all()
    return rows
