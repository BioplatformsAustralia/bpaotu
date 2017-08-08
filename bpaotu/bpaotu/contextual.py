from .libs.excel_wrapper import ExcelWrapper
from .libs import ingest_utils
import datetime

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


field_spec = [
    ('bpa_id', 'sample_id', ingest_utils.extract_bpa_id),
    ('date_sampled', 'date sampled', ingest_utils.get_date_isoformat),
    ('latitude', 'latitude', ingest_utils.get_clean_number),
    ('longitude', 'longitude', ingest_utils.get_clean_number),
    ('depth', 'depth', ingest_utils.get_clean_number),
    ('horizon_classification', 'horizon'),
    ('soil_sample_storage_method', 'soil sample storage method'),
    ('geo_loc_name', 'geo_loc'),
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


def contextual_rows(metadata_path):
    wrapper = ExcelWrapper(field_spec, metadata_path, sheet_name=None, header_length=1, column_name_row_index=0)
    return list(wrapper.get_all())
