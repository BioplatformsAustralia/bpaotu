from .libs.excel_wrapper import ExcelWrapper
from .libs import ingest_utils
import datetime
from .contextual_controlled_vocabularies import *

from .models import ImportLog

from pprint import pprint

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
        s = s.replace('-', "")
        return s


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
        def expand_tree(values, tree, prefix=[]):
            # some of the names are actually a tree path in themselves
            name = [t.strip() for t in values[0].split('-')]
            path = prefix + name
            norm_path = tuple([_normalise_classification(t) for t in path])
            tree[norm_path] = ' - '.join(path)
            for value in values[1:]:
                if type(value) is tuple:
                    # a tuple is a sub-tree which we recurse into
                    if value:
                        expand_tree(value, tree, prefix=path)
                else:
                    # a string is a fellow leaf-node of the parent
                    expand_tree((value,), tree, prefix=prefix)

        if original == '':
            return original
        query = tuple([_normalise_classification(t) for t in original.split('-')])

        # tree contains all fully expanded paths through the classifcation tree,
        # as tuples, and the values in the tree are the string representation of these
        # fully expanded forms. tuples have been run through normalisation.
        recognised_classifications = {}
        for subtree in LandUseVocabulary:
            expand_tree(subtree, recognised_classifications)

        matches = []
        for code, classification in recognised_classifications.items():
            if code[-len(query):] == query:
                matches.append(code)

        matches.sort(key=lambda m: len(m))
        if matches:
            return recognised_classifications[matches[0]]
        else:
            raise NotInVocabulary(original)


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


    def _fix_profile_position(original):
        recognised_classifications = []

        for classification, _ in ProfilePositionVocabulary:
            recognised_classifications.append(classification)

        recognised_classifications = dict((_normalise_classification(x), x) for x in recognised_classifications)

        norm = _normalise_classification(original)

        if not norm:
            return ''
        elif norm in recognised_classifications:
            return recognised_classifications[norm]
        else:
            raise NotInVocabulary(original)
            return ''


    def _fix_vegetation_type(original):
        recognised_classifications = []

        for classification, _ in BroadVegetationTypeVocabulary:
            recognised_classifications.append(classification)

        recognised_classifications = dict((_normalise_classification(x), x) for x in recognised_classifications)

        norm = _normalise_classification(original)

        if not norm:
            return ''
        elif norm in recognised_classifications:
            return recognised_classifications[norm]
        else:
            raise NotInVocabulary(original)
            return ''


    def _fix_fao_soil_classification(original):
        recognised_classifications = []

        for classification, _ in FAOSoilClassificationVocabulary:
            recognised_classifications.append(classification)

        recognised_classifications = dict((_normalise_classification(x), x) for x in recognised_classifications)
        recognised_classifications[_normalise_classification('Tenosol')] = 'Tenosols'
        recognised_classifications[_normalise_classification('Cambisol')] = 'Cambisols'

        norm = _normalise_classification(original)

        if not norm:
            return ''
        elif norm in recognised_classifications:
            return recognised_classifications[norm]
        else:
            raise NotInVocabulary(original)
            return ''


    def _fix_color(original):
        recognised_classifications = []

        for color, code in SoilColourVocabulary:
            recognised_classifications.append(code)

        recognised_classifications = dict((_normalise_classification(x), x) for x in recognised_classifications)

        norm = _normalise_classification(original)

        if not norm:
            return ''
        elif norm in recognised_classifications:
            return recognised_classifications[norm]
        else:
            raise NotInVocabulary(original)
            return ''


    def _fix_horizon_classification(original):
        recognised_classifications = []

        for code, description in HorizonClassificationVocabulary:
            recognised_classifications.append(code)

        recognised_classifications = dict((_normalise_classification(x), x) for x in recognised_classifications)

        if not original:
            return ''
        else:
            codes = [_normalise_classification(x) for x in original.split(",")]

            # this is to deal entries like: O A, OAB, AB that do not have a comma
            for idx, c in enumerate(codes):
                if len(c) > 1:
                    split = list(c)
                    codes = codes + split
                    codes.pop(idx)

            for c in codes:
                if c not in recognised_classifications:
                    print("{} {}".format(original, codes))
                    raise NotInVocabulary(original)
                    return ''

            return original


    def _fix_general_ecological_zone(original):
        recognised_classifications = []

        for code, note in EcologicalZoneVocabulary:
            recognised_classifications.append(code)

        recognised_classifications = dict((_normalise_classification(x), x) for x in recognised_classifications)
        recognised_classifications[_normalise_classification('Mediterranian')] = 'Mediterranean'
        recognised_classifications[_normalise_classification('Wet Tropics')] = 'Tropical (wet)'
        recognised_classifications[_normalise_classification('Other (polar)')] = 'Polar'

        norm = _normalise_classification(original)

        if not norm:
            return ''
        elif norm in recognised_classifications:
            return recognised_classifications[norm]
        else:
            raise NotInVocabulary(original)
            return ''


    def _fix_tillage(original):
        recognised_classifications = []

        for tillage, desc in TillageClassificationVocabulary:
            recognised_classifications.append(tillage)

        recognised_classifications = dict((_normalise_classification(x), x) for x in recognised_classifications)

        parts = original.split(":")
        norm = _normalise_classification(parts[0]) #take first part of string which is the tillage and leave out description

        if not norm:
            return ''
        elif norm in recognised_classifications:
            return recognised_classifications[norm]
        else:
            raise NotInVocabulary(original)
            return ''


    ontology_cleanups = {
        'horizon_classification': _fix_horizon_classification,
        'broad_land_use': _fix_broad_land_use,
        'detailed_land_use': _fix_detailed_land_use,
        'general_ecological_zone': _fix_general_ecological_zone,
        'vegetation_type': _fix_vegetation_type,
        'profile_position': _fix_profile_position,
        'australian_soil_classification': _fix_australian_soil_classification,
        'fao_soil_classification': _fix_fao_soil_classification,
        'tillage': _fix_tillage,
        'color': _fix_color,
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

    ImportLog.objects.all().delete()
    for val in onotology_error_values:
        il = ImportLog(ontology_name=val, import_result=onotology_error_values[val])
        il.save()

    logger.critical(pprint(onotology_error_values))
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
