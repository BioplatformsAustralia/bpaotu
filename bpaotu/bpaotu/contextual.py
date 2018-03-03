from .libs.excel_wrapper import ExcelWrapper, make_field_definition as fld
from .libs import ingest_utils
import datetime
from .contextual_controlled_vocabularies import (
    AustralianSoilClassificationVocabulary,
    BroadVegetationTypeVocabulary,
    CropRotationClassification,
    EcologicalZoneVocabulary,
    FAOSoilClassificationVocabulary,
    HorizonClassificationVocabulary,
    LandUseVocabulary,
    ProfilePositionVocabulary,
    SoilColourVocabulary,
    TillageClassificationVocabulary)

from .models import ImportOntologyLog

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
    fld('bpa_id', 'sample_id', coerce=ingest_utils.extract_bpa_id),
    fld('date_sampled', 'date sampled', coerce=ingest_utils.get_date_isoformat),
    fld('latitude', 'latitude', coerce=ingest_utils.get_clean_number),
    fld('longitude', 'longitude', coerce=ingest_utils.get_clean_number),
    fld('depth', 'depth', coerce=ingest_utils.get_clean_number),
    fld('horizon_classification', 'horizon'),
    fld('soil_sample_storage_method', 'soil sample storage method'),
    fld('geo_loc', 'geo_loc'),
    fld('location_description', 'location description'),
    fld('broad_land_use', 'broad land use'),
    fld('detailed_land_use', 'detailed land use'),
    fld('general_ecological_zone', 'general ecological zone'),
    fld('vegetation_type', 'vegetation type'),
    fld('vegetation_total_cover', 'vegetation total cover (%)', coerce=ingest_utils.get_clean_number),
    fld('vegetation_dom_trees', 'vegetation dom. trees (%)', coerce=ingest_utils.get_clean_number),
    fld('vegetation_dom_shrubs', 'vegetation dom. shrubs (%)', coerce=ingest_utils.get_clean_number),
    fld('vegetation_dom_grasses', 'vegetation dom. grasses (%)', coerce=ingest_utils.get_clean_number),
    fld('elevation', 'elevation ()', coerce=ingest_utils.get_clean_number),
    fld('slope', 'slope (%)', coerce=fix_slope_date),
    fld('slope_aspect', 'slope aspect (direction or degrees; e.g., nw or 315)'),
    fld('profile_position', 'profile position controlled vocab (5)'),
    fld('australian_soil_classification', 'australian soil classification controlled vocab (6)'),
    fld('fao_soil_classification', 'fao soil classification controlled vocab (7)'),
    fld('immediate_previous_land_use', 'immediate previous land use controlled vocab (2)'),
    fld('date_since_change_in_land_use', 'date since change in land use'),
    fld('crop_rotation_1yr_since_present', 'crop rotation 1yr since present'),
    fld('crop_rotation_2yrs_since_present', 'crop rotation 2yrs since present'),
    fld('crop_rotation_3yrs_since_present', 'crop rotation 3yrs since present'),
    fld('crop_rotation_4yrs_since_present', 'crop rotation 4yrs since present'),
    fld('crop_rotation_5yrs_since_present', 'crop rotation 5yrs since present'),
    fld('agrochemical_additions', 'agrochemical additions'),
    fld('tillage', 'tillage controlled vocab (9)'),
    fld('fire_history', 'fire', coerce=fix_sometimes_date),
    fld('fire_intensity_if_known', 'fire intensity if known'),
    fld('flooding', 'flooding', coerce=fix_sometimes_date),
    fld('extreme_events', 'extreme events'),
    fld('soil_moisture', 'soil moisture (%)', coerce=ingest_utils.get_clean_number),
    fld('color', 'color controlled vocab (10)'),
    fld('gravel', 'gravel (%)- ( >2.0 mm)', coerce=ingest_utils.get_clean_number),
    fld('texture', 'texture ()', coerce=ingest_utils.get_clean_number),
    fld('course_sand', 'course sand (%) (200-2000 m)', coerce=ingest_utils.get_clean_number),
    fld('fine_sand', 'fine sand (%) - (20-200 m)', coerce=ingest_utils.get_clean_number),
    fld('sand', 'sand (%)', coerce=ingest_utils.get_clean_number),
    fld('silt', 'silt  (%) (2-20 m)', coerce=ingest_utils.get_clean_number),
    fld('clay', 'clay (%) (<2 m)', coerce=ingest_utils.get_clean_number),
    fld('ammonium_nitrogen', 'ammonium nitrogen (mg/kg)', coerce=ingest_utils.get_clean_number),
    fld('nitrate_nitrogen', 'nitrate nitrogen (mg/kg)', coerce=ingest_utils.get_clean_number),
    fld('phosphorus_colwell', 'phosphorus colwell (mg/kg)', coerce=ingest_utils.get_clean_number),
    fld('potassium_colwell', 'potassium colwell (mg/kg)', coerce=ingest_utils.get_clean_number),
    fld('sulphur', 'sulphur (mg/kg)', coerce=ingest_utils.get_clean_number),
    fld('organic_carbon', 'organic carbon (%)', coerce=ingest_utils.get_clean_number),
    fld('conductivity', 'conductivity (ds/m)', coerce=ingest_utils.get_clean_number),
    fld('ph_level_cacl2', 'ph level (cacl2) (ph)', coerce=ingest_utils.get_clean_number),
    fld('ph_level_h2o', 'ph level (h2o) (ph)', coerce=ingest_utils.get_clean_number),
    fld('dtpa_copper', 'dtpa copper (mg/kg)', coerce=ingest_utils.get_clean_number),
    fld('dtpa_iron', 'dtpa iron (mg/kg)', coerce=ingest_utils.get_clean_number),
    fld('dtpa_manganese', 'dtpa manganese (mg/kg)', coerce=ingest_utils.get_clean_number),
    fld('dtpa_zinc', 'dtpa zinc (mg/kg)', coerce=ingest_utils.get_clean_number),
    fld('exc_aluminium', 'exc. aluminium (meq/100g)', coerce=ingest_utils.get_clean_number),
    fld('exc_calcium', 'exc. calcium (meq/100g)', coerce=ingest_utils.get_clean_number),
    fld('exc_magnesium', 'exc. magnesium (meq/100g)', coerce=ingest_utils.get_clean_number),
    fld('exc_potassium', 'exc. potassium (meq/100g)', coerce=ingest_utils.get_clean_number),
    fld('exc_sodium', 'exc. sodium (meq/100g)', coerce=ingest_utils.get_clean_number),
    fld('boron_hot_cacl2', 'boron hot cacl2 (mg/kg)', coerce=ingest_utils.get_clean_number),
]


marine_field_specs = {
    'Coastal water': [
        fld('bpa_id', 'bpa_id', coerce=ingest_utils.extract_bpa_id),
        fld('date_sampled', 'date sampled (yyyy-mm-dd)', coerce=ingest_utils.get_date_isoformat),
        fld('time_sampled', 'time sampled (hh:mm)', coerce=ingest_utils.get_time),
        fld('latitude', 'latitude (decimal degrees)', coerce=ingest_utils.get_clean_number),
        fld('longitude', 'longitude (decimal degrees)', coerce=ingest_utils.get_clean_number),
        fld('depth', 'depth (m)', coerce=ingest_utils.get_clean_number),
        fld('geo_loc', 'geo_loc (country:subregion)'),
        fld('sample_site', 'sample site'),
        fld('coastal_id', 'coastal_id'),
        fld('notes', 'notes'),
        fld('ph_level', 'ph level (h2o) (ph)', coerce=ingest_utils.get_clean_number),
        fld('oxygen_lab', 'oxygen (mol/l) lab', coerce=ingest_utils.get_clean_number),
        fld('oxygen_ctd', 'oxygen (ml/l) ctd', coerce=ingest_utils.get_clean_number),
        fld('nitrate_nitrite', 'nitrate/nitrite (mol/l)', coerce=ingest_utils.get_clean_number),
        fld('phosphate', 'phosphate (mol/l)', coerce=ingest_utils.get_clean_number),
        fld('ammonium', 'ammonium (mol/l)', coerce=ingest_utils.get_clean_number),
        fld('total_co2', 'total co2 (mol/kg)', coerce=ingest_utils.get_clean_number),
        fld('total_alkalinity', 'total alkalinity (mol/kg)', coerce=ingest_utils.get_clean_number),
        fld('temperature', 'temperature [its-90, deg c]', coerce=ingest_utils.get_clean_number),
        fld('conductivity', 'conductivity [s/m]', coerce=ingest_utils.get_clean_number),
        fld('turbidity', 'turbidity (upoly 0, wet labs flnturt)', coerce=ingest_utils.get_clean_number),
        fld('salinity', 'salinity [psu] laboratory', coerce=ingest_utils.get_clean_number),
        fld('microbial_abundance', 'microbial abundance (cells per ml)', coerce=ingest_utils.get_clean_number),
        fld('chlorophyll_a', 'chlorophyll a (g/l)', coerce=ingest_utils.get_clean_number),
        fld('per_total_carbon', '%total carbon', coerce=ingest_utils.get_clean_number),
        fld('per_total_inorganc_carbon', '% total inorganc carbon', coerce=ingest_utils.get_clean_number),
        fld('light_intensity', 'light intensity (lux)', coerce=ingest_utils.get_clean_number),
    ],
    'Coral': [
        fld('bpa_id', 'bpa_id', coerce=ingest_utils.extract_bpa_id),
        fld('date_sampled', 'date sampled (yyyy-mm-dd)', coerce=ingest_utils.get_date_isoformat),
        fld('time_sampled', 'time sampled (hh:mm)', coerce=ingest_utils.get_time),
        fld('latitude', 'latitude (decimal degrees)', coerce=ingest_utils.get_clean_number),
        fld('longitude', 'longitude (decimal degrees)', coerce=ingest_utils.get_clean_number),
        fld('depth', 'depth (m)', coerce=ingest_utils.get_clean_number),
        fld('geo_loc', 'geo_loc (country:subregion)'),
        fld('sample_site', 'sample site'),
        fld('coastal_id', 'coastal_id'),
        fld('host_species', 'host species'),
        fld('notes', 'notes'),
        fld('pulse_amplitude_modulated_fluorometer_measurement', 'pulse amplitude modulated (pam) fluorometer measurement', coerce=ingest_utils.get_clean_number),
        fld('host_state', 'host state (free text field)'),
        fld('host_abundance', 'host abundance (individuals per m2)', coerce=ingest_utils.get_clean_number),
    ],
    'Pelagic_Public': [
        fld('bpa_id', 'id', coerce=ingest_utils.extract_bpa_id),
        fld('organism', 'organism'),
        fld('tax_id', 'tax id', coerce=ingest_utils.get_clean_number),
        fld('date_sampled', 'date sampled (yyyy-mm-dd)', coerce=ingest_utils.get_date_isoformat),
        fld('time_sampled', 'time sampled (hh:mm)', coerce=ingest_utils.get_time),
        fld('latitude', 'latitude (decimal degrees)', coerce=ingest_utils.get_clean_number),
        fld('longitude', 'longitude (decimal degrees)', coerce=ingest_utils.get_clean_number),
        fld('depth', 'depth (m)', coerce=ingest_utils.get_clean_number),
        fld('nrs_location_code_voyage_code', 'nrs_location_code; voyage_code'),
        fld('nrs_trip_code', 'nrs_trip_code'),
        fld('nrs_sample_code', 'nrs_sample_code'),
        fld('geo_loc', 'geo_loc (country:subregion)'),
        fld('sample_site', 'sample site'),
        fld('notes', 'notes'),
        fld('ph_level', 'ph level (h2o) (ph)', coerce=ingest_utils.get_clean_number),
        fld('fluorescence', 'fluorescence (au)', coerce=ingest_utils.get_clean_number),
        fld('transmittance', 'transmittance (%)', coerce=ingest_utils.get_clean_number),
        fld('secchi_depth', 'secchi depth (m)', coerce=ingest_utils.get_clean_number),
        fld('bottom_depth', 'bottom depth', coerce=ingest_utils.get_clean_number),
        fld('pressure_bottle', 'pressure bottle', coerce=ingest_utils.get_clean_number),
        fld('temperature', 'temperature: ctd [its-90, deg c]', coerce=ingest_utils.get_clean_number),
        fld('salinity_ctd', 'salinity [psu] ctd', coerce=ingest_utils.get_clean_number),
        fld('oxygen_ctd', 'oxygen (mol/kg) ctd', coerce=ingest_utils.get_clean_number),
        fld('density', 'density [density, kg/m^3] ctd', coerce=ingest_utils.get_clean_number),
        fld('turbidity', 'turbidity (nephelometric turbidity units) ctd', coerce=ingest_utils.get_clean_number),
        fld('chlf_ctd', 'chlf: ctd', coerce=ingest_utils.get_clean_number),
        fld('silicate', 'silicate (mol/l)', coerce=ingest_utils.get_clean_number),
        fld('nitrate_nitrite', 'nitrate/nitrite (mol/l)', coerce=ingest_utils.get_clean_number),
        fld('nitrite', 'nitrite (mol/l)', coerce=ingest_utils.get_clean_number),
        fld('phosphate', 'phosphate (mol/l)', coerce=ingest_utils.get_clean_number),
        fld('ammonium', 'ammonium (mol/l)', coerce=ingest_utils.get_clean_number),
        fld('salinity_lab', 'salinity [psu] lab', coerce=ingest_utils.get_clean_number),
        fld('oxygen_lab', 'oxygen (mol/l) lab', coerce=ingest_utils.get_clean_number),
        fld('total_co2', 'total co2 (mol/kg)', coerce=ingest_utils.get_clean_number),
        fld('total_alkalinity', 'total alkalinity (mol/kg)', coerce=ingest_utils.get_clean_number),
        fld('tss', 'tss [mg/l]', coerce=ingest_utils.get_clean_number),
        fld('inorganic_fraction', 'inorganic fraction [mg/l]', coerce=ingest_utils.get_clean_number),
        fld('organic_fraction', 'organic fraction [mg/l]', coerce=ingest_utils.get_clean_number),
        fld('allo', 'allo [mg/m3]', coerce=ingest_utils.get_clean_number),
        fld('alpha_beta_car', 'alpha_beta_car [mg/m3]', coerce=ingest_utils.get_clean_number),
        fld('anth', 'anth [mg/m3]', coerce=ingest_utils.get_clean_number),
        fld('asta', 'asta [mg/m3]', coerce=ingest_utils.get_clean_number),
        fld('beta_beta_car', 'beta_beta_car [mg/m3]', coerce=ingest_utils.get_clean_number),
        fld('beta_epi_car', 'beta_epi_car [mg/m3]', coerce=ingest_utils.get_clean_number),
        fld('but_fuco', 'but_fuco [mg/m3]', coerce=ingest_utils.get_clean_number),
        fld('cantha', 'cantha [mg/m3]', coerce=ingest_utils.get_clean_number),
        fld('cphl_a', 'cphl_a [mg/m3]', coerce=ingest_utils.get_clean_number),
        fld('cphl_b', 'cphl_b [mg/m3]', coerce=ingest_utils.get_clean_number),
        fld('cphl_c1c2', 'cphl_c1c2 [mg/m3]', coerce=ingest_utils.get_clean_number),
        fld('cphl_c1', 'cphl_c1 [mg/m3]', coerce=ingest_utils.get_clean_number),
        fld('cphl_c2', 'cphl_c2 [mg/m3]', coerce=ingest_utils.get_clean_number),
        fld('cphl_c3', 'cphl_c3 [mg/m3]', coerce=ingest_utils.get_clean_number),
        fld('cphlide_a', 'cphlide_a [mg/m3]', coerce=ingest_utils.get_clean_number),
        fld('diadchr', 'diadchr [mg/m3]', coerce=ingest_utils.get_clean_number),
        fld('diadino', 'diadino [mg/m3]', coerce=ingest_utils.get_clean_number),
        fld('diato', 'diato [mg/m3]', coerce=ingest_utils.get_clean_number),
        fld('dino', 'dino [mg/m3]', coerce=ingest_utils.get_clean_number),
        fld('dv_cphl_a_and_cphl_a', 'dv_cphl_a_and_cphl_a [mg/m3]', coerce=ingest_utils.get_clean_number),
        fld('dv_cphl_a', 'dv_cphl_a [mg/m3]', coerce=ingest_utils.get_clean_number),
        fld('dv_cphl_b_and_cphl_b', 'dv_cphl_b_and_cphl_b [mg/m3]', coerce=ingest_utils.get_clean_number),
        fld('dv_cphl_b', 'dv_cphl_b [mg/m3]', coerce=ingest_utils.get_clean_number),
        fld('echin', 'echin [mg/m3]', coerce=ingest_utils.get_clean_number),
        fld('fuco', 'fuco [mg/m3]', coerce=ingest_utils.get_clean_number),
        fld('gyro', 'gyro [mg/m3]', coerce=ingest_utils.get_clean_number),
        fld('hex_fuco', 'hex_fuco [mg/m3]', coerce=ingest_utils.get_clean_number),
        fld('keto_hex_fuco', 'keto_hex_fuco [mg/m3]', coerce=ingest_utils.get_clean_number),
        fld('lut', 'lut [mg/m3]', coerce=ingest_utils.get_clean_number),
        fld('lyco', 'lyco [mg/m3]', coerce=ingest_utils.get_clean_number),
        fld('mg_dvp', 'mg_dvp [mg/m3]', coerce=ingest_utils.get_clean_number),
        fld('neo', 'neo [mg/m3]', coerce=ingest_utils.get_clean_number),
        fld('perid', 'perid [mg/m3]', coerce=ingest_utils.get_clean_number),
        fld('phide_a', 'phide_a [mg/m3]', coerce=ingest_utils.get_clean_number),
        fld('phytin_a', 'phytin_a [mg/m3]', coerce=ingest_utils.get_clean_number),
        fld('phytin_b', 'phytin_b [mg/m3]', coerce=ingest_utils.get_clean_number),
        fld('pras', 'pras [mg/m3]', coerce=ingest_utils.get_clean_number),
        fld('pyrophide_a', 'pyrophide_a [mg/m3]', coerce=ingest_utils.get_clean_number),
        fld('pyrophytin_a', 'pyrophytin_a [mg/m3]', coerce=ingest_utils.get_clean_number),
        fld('viola', 'viola [mg/m3]', coerce=ingest_utils.get_clean_number),
        fld('zea', 'zea [mg/m3]', coerce=ingest_utils.get_clean_number),
    ],
    'Seaweed': [
        fld('bpa_id', 'bpa_id', coerce=ingest_utils.extract_bpa_id),
        fld('date_sampled', 'date sampled (yyyy-mm-dd)', coerce=ingest_utils.get_date_isoformat),
        fld('time_sampled', 'time sampled (hh:mm)', coerce=ingest_utils.get_time),
        fld('latitude', 'latitude (decimal degrees)', coerce=ingest_utils.get_clean_number),
        fld('longitude', 'longitude (decimal degrees)', coerce=ingest_utils.get_clean_number),
        fld('depth', 'depth (m)', coerce=ingest_utils.get_clean_number),
        fld('geo_loc', 'geo_loc (country:subregion)'),
        fld('sample_site', 'sample site'),
        fld('coastal_id', 'coastal_id'),
        fld('host_species', 'host species'),
        fld('notes', 'notes'),
        fld('pulse_amplitude_modulated_pam_fluorometer_measurement', 'pulse amplitude modulated (pam) fluorometer measurement', coerce=ingest_utils.get_clean_number),
        fld('host_state', 'host state (free text field)'),
        fld('host_abundance', 'host abundance (individuals per m2)', coerce=ingest_utils.get_clean_number),
    ],
    'Sediment': [
        fld('bpa_id', 'bpa_id', coerce=ingest_utils.extract_bpa_id),
        fld('date_sampled', 'date sampled (yyyy-mm-dd)', coerce=ingest_utils.get_date_isoformat),
        fld('time_sampled', 'time sampled (hh:mm)', coerce=ingest_utils.get_time),
        fld('latitude', 'latitude (decimal degrees)', coerce=ingest_utils.get_clean_number),
        fld('longitude', 'longitude (decimal degrees)', coerce=ingest_utils.get_clean_number),
        fld('depth', 'depth (m)', coerce=ingest_utils.get_clean_number),
        fld('geo_loc', 'geo_loc (country:subregion)'),
        fld('sample_site', 'sample site'),
        fld('coastal_id', 'coastal_id'),
        fld('notes', 'notes'),
        fld('per_total_carbon', '%total carbon', coerce=ingest_utils.get_clean_number),
        fld('per_fine_sediment', '% fine sediment', coerce=ingest_utils.get_clean_number),
        fld('per_total_nitrogen', '% total nitrogen', coerce=ingest_utils.get_clean_number),
        fld('per_total_phosphorous', '% total phosphorous', coerce=ingest_utils.get_clean_number),
        fld('sedimentation_rate', 'sedimentation rate (g /(cm2 x y)r)', coerce=ingest_utils.get_clean_number),
    ],
    'Sponge': [
        fld('bpa_id', 'bpa_id', coerce=ingest_utils.extract_bpa_id),
        fld('date_sampled', 'date sampled (yyyy-mm-dd)', coerce=ingest_utils.get_date_isoformat),
        fld('time_sampled', 'time sampled (hh:mm)', coerce=ingest_utils.get_time),
        fld('latitude', 'latitude (decimal degrees)', coerce=ingest_utils.get_clean_number),
        fld('longitude', 'longitude (decimal degrees)', coerce=ingest_utils.get_clean_number),
        fld('depth', 'depth (m)', coerce=ingest_utils.get_clean_number),
        fld('geo_loc', 'geo_loc (country:subregion)'),
        fld('sample_site', 'sample site'),
        fld('coastal_id', 'coastal_id'),
        fld('host_species', 'host species'),
        fld('notes', 'notes'),
        fld('host_state', 'host state (free text field)'),
        fld('host_abundance', 'host abundance (individuals per m2)', coerce=ingest_utils.get_clean_number),
    ]
}


class NotInVocabulary(Exception):
    pass


def context_valid(obj):
    # we must have certain minimal fields, or we exclude the sample from the context
    # (and, by extension, from the ingest)
    return obj.get('latitude') is not None and obj.get('longitude') is not None


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
        norm = _normalise_classification(parts[0])  # take first part of string which is the tillage and leave out description

        if not norm:
            return ''
        elif norm in recognised_classifications:
            return recognised_classifications[norm]
        else:
            raise NotInVocabulary(original)
            return ''

    def _fix_crop_rotation(original):
        recognised_classifications = []

        for entry in CropRotationClassification:
            parts = entry.split("-")
            parts = [p.strip() for p in parts]

            for p in parts:
                recognised_classifications.append(p)

            recognised_classifications.append(entry)

        recognised_classifications = dict((_normalise_classification(x), x) for x in recognised_classifications)

        norm = _normalise_classification(original)

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
        'crop_rotation_1yr_since_present': _fix_crop_rotation,
        'crop_rotation_2yrs_since_present': _fix_crop_rotation,
        'crop_rotation_3yrs_since_present': _fix_crop_rotation,
        'crop_rotation_4yrs_since_present': _fix_crop_rotation,
        'crop_rotation_5yrs_since_present': _fix_crop_rotation,
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
                del obj[cleanup_name]
        objs.append(obj)

    ImportOntologyLog.objects.all().delete()
    for val in onotology_error_values:
        il = ImportOntologyLog(project_name="BASE", ontology_name=val, import_result=list(sorted(onotology_error_values[val])))
        il.save()
    return [t for t in objs if context_valid(t)]


def marine_contextual_rows(metadata_path):
    # MM spreadsheet has multiple tabs for the various forms of data
    objs = []
    for sheet_name, field_spec in sorted(marine_field_specs.items()):
        wrapper = ExcelWrapper(
            field_spec,
            metadata_path,
            sheet_name=sheet_name,
            header_length=1,
            column_name_row_index=0,
            additional_context={'sample_type': sheet_name, 'project': 'Marine Microbes'})
        objs += [t._asdict() for t in wrapper.get_all()]
    return [t for t in objs if context_valid(t)]
