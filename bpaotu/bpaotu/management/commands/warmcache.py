
from django.core.management.base import BaseCommand
from ...query import TaxonomyOptions, OntologyInfo, OTUQueryParams, CACHE_FOREVER, ContextualFilter, TaxonomyFilter
from ...spatial import spatial_query
from ...views import get_contextual_schema_definition
from ...otu import OTUKingdom, OTUAmplicon
from collections import OrderedDict
from django.conf import settings


class Command(BaseCommand):

    @classmethod
    def make_is(cls, v):
        if v is None:
            return v
        return OrderedDict([('operator', 'is'), ('value', v)])

    def warm_taxonomies(self):
        print("Warming taxonomy query cache")
        with TaxonomyOptions() as q:
            for amplicon_id in self.amplicon_possibilities:
                for kingdom_id in self.kingdom_possibilities:
                    q.possibilities(
                        TaxonomyFilter(
                            self.make_is(amplicon_id),
                            [self.make_is(kingdom_id), None, None, None, None, None, None]), force_cache=True)
        print("Complete")

    def warm_map(self):
        print("Warming spatial cache")
        default_amplicon = None
        with OntologyInfo() as info:
            default_amplicon = self.make_is(info.value_to_id(OTUAmplicon, settings.DEFAULT_AMPLICON))
        params = OTUQueryParams(
            contextual_filter=ContextualFilter('and', None),
            taxonomy_filter=TaxonomyFilter(default_amplicon, [None, None, None, None, None, None, None]))
        spatial_query(params, cache_duration=CACHE_FOREVER, force_cache=True)
        print("Complete")

    def warm_schema_definitions(self):
        print("Warming schema definitions")
        get_contextual_schema_definition(cache_duration=CACHE_FOREVER, force_cache=True)
        print("Complete")

    def handle(self, *args, **kwargs):
        self.kingdom_possibilities = [None]
        self.amplicon_possibilities = [None]

        with OntologyInfo() as info:
            self.amplicon_possibilities = [None] + [t for (t, _) in info.get_values(OTUAmplicon)]
            self.kingdom_possibilities = [None] + [t for (t, _) in info.get_values(OTUKingdom)]

        self.warm_schema_definitions()
        self.warm_taxonomies()
        self.warm_map()
