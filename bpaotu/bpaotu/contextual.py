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


class BaseOntologyEnforcement:
    def __init__(self):
        self.norm_to_term = self._build_terms()

    def _build_terms(self):
        terms = [t[0] for t in self.vocabulary]
        return dict((BaseOntologyEnforcement._normalise(x), x) for x in terms)

    @classmethod
    def _normalise(cls, s):
        s = s.lower()
        s = s.replace(" ", "")
        s = s.replace("&", "and")
        s = s.replace('-', "")
        return s

    def get(self, term):
        """
        returns the term, as found in the list of appropriate terms,
        or raises NotInVocabulary
        """
        norm = self._normalise(term)
        if not norm:
            return ''
        elif norm in self.norm_to_term:
            return self.norm_to_term[norm]
        else:
            raise NotInVocabulary(term)


class BroadLandUseEnforcement(BaseOntologyEnforcement):
    vocabulary = LandUseVocabulary


class AustralianSoilClassificationEnforcement(BaseOntologyEnforcement):
    vocabulary = AustralianSoilClassificationVocabulary

    def __init__(self):
        super().__init__()
        self.norm_to_term[self._normalise('Tenosol')] = 'Tenosols'
        self.norm_to_term[self._normalise('Chromosol')] = 'Chromosols'
        self.norm_to_term[self._normalise('Hydrosol')] = 'Hydrosols'


class ProfilePositionEnforcement(BaseOntologyEnforcement):
    vocabulary = ProfilePositionVocabulary


class BroadVegetationTypeEnforement(BaseOntologyEnforcement):
    vocabulary = BroadVegetationTypeVocabulary


class FAOSoilClassificationEnforcement(BaseOntologyEnforcement):
    vocabulary = FAOSoilClassificationVocabulary

    def __init__(self):
        super().__init__()
        self.norm_to_term[self._normalise('Tenosol')] = 'Tenosols'
        self.norm_to_term[self._normalise('Cambisol')] = 'Cambisols'


class SoilColourEnforcement(BaseOntologyEnforcement):
    vocabulary = SoilColourVocabulary

    def _build_terms(self):
        terms = [t[1] for t in self.vocabulary]
        return dict((BaseOntologyEnforcement._normalise(x), x) for x in terms)


class HorizonClassificationEnforcement(BaseOntologyEnforcement):
    vocabulary = HorizonClassificationVocabulary

    def get(self, term):
        # codes are single characters. we check each character
        # against the vocabulary; if it's not in there, we chuck it out
        terms = []
        for c in term:
            norm = self._normalise(c)
            if not norm or norm not in self.norm_to_term:
                continue
            terms.append(self.norm_to_term[norm])
        return ','.join(sorted(terms))


class EcologicalZoneEnforcement(BaseOntologyEnforcement):
    vocabulary = EcologicalZoneVocabulary

    def __init__(self):
        super().__init__()
        self.norm_to_term[self._normalise('Tenosol')] = 'Tenosols'
        self.norm_to_term[self._normalise('Mediterranian')] = 'Mediterranean'
        self.norm_to_term[self._normalise('Wet Tropics')] = 'Tropical (wet)'
        self.norm_to_term[self._normalise('Other (polar)')] = 'Polar'


class TillageClassificationEnforcement(BaseOntologyEnforcement):
    vocabulary = TillageClassificationVocabulary

    def get(self, term):
        # take first part of string which is the tillage and leave out description
        first_part = term.split(":")[0]
        return super().get(first_part)


class CropRotationEnforcement(BaseOntologyEnforcement):
    vocabulary = CropRotationClassification

    def _build_terms(self):
        terms = [t for t in self.vocabulary]
        return dict((BaseOntologyEnforcement._normalise(x), x) for x in terms)


class LandUseEnforcement(BaseOntologyEnforcement):
    def __init__(self):
        self.tree = self._build_tree()

    def _build_tree(self):
        def expand_tree(values, tree, prefix=[]):
            # some of the names are actually a tree path in themselves
            name = [t.strip() for t in values[0].split('-')]
            path = prefix + name
            norm_path = tuple([self._normalise(t) for t in path])
            tree[norm_path] = ' - '.join(path)
            for value in values[1:]:
                if type(value) is tuple:
                    # a tuple is a sub-tree which we recurse into
                    if value:
                        expand_tree(value, tree, prefix=path)
                else:
                    # a string is a fellow leaf-node of the parent
                    expand_tree((value,), tree, prefix=prefix)

        tree = {}
        for subtree in LandUseVocabulary:
            expand_tree(subtree, tree)
        return tree

    def get(self, original):
        query = tuple([t for t in [self._normalise(t) for t in original.split('-')] if t])

        if len(query) == 0:
            return ''

        # tree contains all fully expanded paths through the classification tree,
        # as tuples, and the values in the tree are the string representation of these
        # fully expanded forms. tuples have been run through normalisation.

        matches = []
        for code, classification in self.tree.items():
            if code[-len(query):] == query:
                matches.append(code)

        matches.sort(key=lambda m: len(m))
        if matches:
            return self.tree[matches[0]]
        else:
            raise NotInVocabulary(original)


def soil_contextual_rows(metadata_path):
    wrapper = ExcelWrapper(
        soil_field_spec,
        metadata_path,
        sheet_name=None,
        header_length=1,
        column_name_row_index=0,
        additional_context={'environment': 'Soil', 'sample_type': 'Soil'})

    ontology_cleanups = {
        'horizon_classification': HorizonClassificationEnforcement(),
        'broad_land_use': LandUseEnforcement(),
        'detailed_land_use': LandUseEnforcement(),
        'immediate_previous_land_use': LandUseEnforcement(),
        'general_ecological_zone': EcologicalZoneEnforcement(),
        'vegetation_type': BroadVegetationTypeEnforement(),
        'profile_position': ProfilePositionEnforcement(),
        'australian_soil_classification': AustralianSoilClassificationEnforcement(),
        'fao_soil_classification': FAOSoilClassificationEnforcement(),
        'tillage': TillageClassificationEnforcement(),
        'color': SoilColourEnforcement(),
        'crop_rotation_1yr_since_present': CropRotationEnforcement(),
        'crop_rotation_2yrs_since_present': CropRotationEnforcement(),
        'crop_rotation_3yrs_since_present': CropRotationEnforcement(),
        'crop_rotation_4yrs_since_present': CropRotationEnforcement(),
        'crop_rotation_5yrs_since_present': CropRotationEnforcement(),
    }

    onotology_error_values = dict((t, set()) for t in ontology_cleanups)

    objs = []
    for row in wrapper.get_all():
        obj = row._asdict()

        for cleanup_name, enforcer in ontology_cleanups.items():
            try:
                obj[cleanup_name] = enforcer.get(obj[cleanup_name])
            except NotInVocabulary as e:
                onotology_error_values[cleanup_name].add(e.args[0])
                del obj[cleanup_name]
        objs.append(obj)

    ImportOntologyLog.objects.all().delete()
    for val in onotology_error_values:
        il = ImportOntologyLog(environment="Soil", ontology_name=val, import_result=list(sorted(onotology_error_values[val])))
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
            additional_context={'sample_type': sheet_name, 'environment': 'Marine'})
        objs += [t._asdict() for t in wrapper.get_all()]
    return [t for t in objs if context_valid(t)]
