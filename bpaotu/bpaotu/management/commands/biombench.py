
import sys
from django.core.management.base import BaseCommand
from ...query import OTUQueryParams, ContextualFilter, OntologyInfo, SampleQuery, TaxonomyFilter
from ...otu import taxonomy_ontology_classes, Environment
from ...biom import generate_biom_file
from collections import OrderedDict

#
# Basic benchmark which we use to track performance of the BIOM
# export longitudinally
#


class Command(BaseCommand):

    @classmethod
    def make_is(cls, v):
        if v is None:
            return v
        return OrderedDict([('operator', 'is'), ('value', v)])

    @classmethod
    def onto_is(cls, taxo_cls, s):
        with OntologyInfo() as info:
            return cls.make_is([i for (i, t) in info.get_values(taxo_cls) if t == s][0])

    def handle(self, *args, **kwargs):
        params = OTUQueryParams(
            contextual_filter=ContextualFilter('and', self.onto_is(Environment, 'Soil')),
            taxonomy_filter=TaxonomyFilter(
                None,
                [self.make_is(1),  # FIXME! magic number taxonomy source
                 self.onto_is(taxonomy_ontology_classes[1], 'Bacteria'),
                 self.onto_is(taxonomy_ontology_classes[2], 'Bacteroidetes'),
                 self.onto_is(taxonomy_ontology_classes[3], 'Ignavibacteria')],
                None),
            sample_integrity_warnings_filter=ContextualFilter('and', self.onto_is(Environment, 'Soil')))

        with SampleQuery(params) as query:
            size = 0
            for data in (s.encode('utf8') for s in generate_biom_file(query)):
                size += len(data)
            print('BIOM output complete, total size={:,}'.format(size), file=sys.stderr)
