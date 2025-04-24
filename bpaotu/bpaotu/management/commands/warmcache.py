
from django.core.management.base import BaseCommand
from ...query import TaxonomyOptions, OntologyInfo, OTUQueryParams, CACHE_FOREVER, ContextualFilter, TaxonomyFilter
from ...spatial import spatial_query
from ...views import get_contextual_schema_definition
from ...otu import  OTUAmplicon, taxonomy_ontology_classes
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
            for taxonomy_source_id in self.taxonomy_source_possibilities:
                for amplicon_id in self.amplicon_possibilities:
                    for rank1_id in self.rank1_possibilities:
                        q.possibilities(
                            TaxonomyFilter(
                                self.make_is(amplicon_id),
                                [self.make_is(taxonomy_source_id), self.make_is(rank1_id)],
                                None), force_cache=True)
        print("Complete")

    def warm_map(self):
        print("Warming spatial cache")
        for taxonomy_source_id in self.taxonomy_source_possibilities:
            for amplicon_id in self.amplicon_possibilities:
                params = OTUQueryParams(
                    contextual_filter=ContextualFilter('and', None),
                    taxonomy_filter=TaxonomyFilter(
                        self.make_is(amplicon_id),
                        [self.make_is(taxonomy_source_id)],
                        None),
                    sample_integrity_warnings_filter=ContextualFilter('and', None))
                spatial_query(params, cache_duration=CACHE_FOREVER, force_cache=True)
        print("Complete")

    def warm_schema_definitions(self):
        print("Warming schema definitions")
        get_contextual_schema_definition(cache_duration=CACHE_FOREVER, force_cache=True)
        print("Complete")

    def handle(self, *args, **kwargs):
        with OntologyInfo() as info:
            self.amplicon_possibilities = [None] + [
                t for (t, _) in info.get_values(OTUAmplicon)]
            self.taxonomy_source_possibilities = [
                t for (t, _) in info.get_values(taxonomy_ontology_classes[0])]
            self.rank1_possibilities = [None] + [
                t for (t, _) in info.get_values(taxonomy_ontology_classes[1])]

        self.warm_schema_definitions()
        self.warm_taxonomies()
        self.warm_map()
