from collections import defaultdict
import pandas as pd

from bpaingest.projects.amdb.contextual import AustralianMicrobiomeSampleContextual
from django.core.cache import caches

from .importer import DataImporter
from .otu import Environment, SampleContext
from .query import SampleSchemaDefinition, OntologyInfo, get_sample_ids, make_cache_key, CACHE_7DAYS

# columns_subset: nullable array
# if None then returns all definitions, otherwise only includes the columns in the array
def contextual_definitions(columns_subset = None, include_sample_id = True):
    field_definitions, classifications, ontology_classes, fields_by_type = {}, {}, {}, defaultdict(list)
    field_units = AustralianMicrobiomeSampleContextual.units_for_fields()
    contextual_schema_definition = get_contextual_schema_definition().get("definition", {})
    for key, field in contextual_schema_definition.get("Field", {}).items():
        if field in DataImporter.amd_ontologies:
            field += '_id'
        elif field == 'sample_id':
            field = 'id'
        field_definitions[field] = contextual_schema_definition.get("Field_Definition", {}).get(key)
        am_environment = contextual_schema_definition.get("AM_enviro", {}).get(key).lstrip().rstrip()
        am_environment_lookup = dict((t[1], t[0]) for t in make_environment_lookup().items())
        am_environment_id = am_environment_lookup.get(am_environment, "")
        if am_environment_id:
            classifications[field] = am_environment_id


    # TODO Note TS: I don't understand why do we group columns together by their type.
    # Why can't we just got through them once and map them to the definitions?

    # group together columns by their type. note special case
    # handling for our ontology linkage columns
    for column in SampleContext.__table__.columns:
        if columns_subset and not column.name in columns_subset:
            continue
        if column.name == 'id':
            continue
        if hasattr(column, "ontology_class"):
            ty = '_ontology'
            ontology_classes[column.name] = column.ontology_class
        else:
            ty = str(column.type)
        fields_by_type[ty].append(column.name)

    def make_defn(typ, name, **kwargs):
        r = kwargs.copy()
        r.update({
            'type': typ,
            'name': name,
            'environment': classifications.get(name),
            'display_name': SampleContext.display_name(name),
            'units': field_units.get(name),
            'definition': field_definitions.get(name),
        })
        return r

    with OntologyInfo() as info:
        fields_with_values = [
            (field_name, info.get_values_filtered(ontology_classes[field_name], field_name))
            for field_name in fields_by_type['_ontology']]

    definitions = (
        ([make_defn('sample_id', 'id', display_name='Sample ID', values=get_sample_ids())] if include_sample_id else [])
        + [make_defn('date', field_name) for field_name in fields_by_type['DATE']]
        + [make_defn('time', field_name) for field_name in fields_by_type['TIME']]
        + [make_defn('float', field_name) for field_name in fields_by_type['FLOAT']]
        + [make_defn('string', field_name) for field_name in fields_by_type['CITEXT']]
        + [make_defn('ontology', field_name, values=values) for field_name, values in fields_with_values]
    )

    definitions.sort(key=lambda a: a['display_name'].lower())

    return definitions

def get_contextual_schema_definition(cache_duration=CACHE_7DAYS, force_cache=False):
    cache = caches['contextual_schema_definition_results']
    key = make_cache_key('contextual_schema_definition_query')
    result = None
    if not force_cache:
        result = cache.get(key)
    if result is None:
        result = contextual_schema_definition_query()
        cache.set(key, result, cache_duration)
    return result


def contextual_schema_definition_query():
    try:
        with SampleSchemaDefinition() as query:
            for path in query.get_schema_definition_url():
                download_url = str(path)

        # search the file for the "Schema_" sheet with the highest version number
        schema_prefix = 'Schema_'
        sheet_names = pd.ExcelFile(download_url).sheet_names
        schema_sheet_names = list(filter(lambda k: schema_prefix in k, sheet_names))
        sort_fn = lambda s: list(map(int, s.replace(schema_prefix, '').split('.')))
        schema_sheet_names.sort(key=sort_fn, reverse=True)

        df_definition = pd.read_excel(download_url, sheet_name=schema_sheet_names[0])
        df_definition = df_definition.fillna(value="")
    except IndexError as e:
        logger.error(f"No sheet names match '{schema_prefix}'; sheet_names={sheet_names}; ({e})")
        download_url = ""
        df_definition = pd.DataFrame()
    except Exception as e:
        logger.error(f"Link {download_url} doesn't exist. {e}")
        download_url = ""
        df_definition = pd.DataFrame()
    return {
        'download_url': download_url,
        'definition': df_definition.to_dict(),
    }

def make_environment_lookup():
    with OntologyInfo() as info:
        return dict(info.get_values(Environment))
