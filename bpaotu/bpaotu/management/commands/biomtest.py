
import sys
from django.core.management.base import BaseCommand
from ...query import (
    OTUQueryParams,
    ContextualFilter,
    OntologyInfo,
    SampleQuery,
    TaxonomyFilter,
    ContextualFilterTermFloat,
    ContextualFilterTermOntology,
    ContextualFilterTermString)
from ...otu import (
    OTUKingdom,
    OTUPhylum,
    OTUClass,
    Environment,
    SampleAustralianSoilClassification)
from ...biom import generate_biom_file
from ...util import make_timestamp
from collections import OrderedDict

#
# An end-to-end test of BIOM export and annotation
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
            return cls.make_is(info.value_to_id(taxo_cls, s))

    def handle(self, *args, **kwargs):
        contextual_filter = ContextualFilter(
            'and', self.onto_is(Environment, 'Soil'))
        with OntologyInfo() as info:
            contextual_filter.add_term(
                ContextualFilterTermOntology(
                    'australian_soil_classification_id',
                    '',
                    info.value_to_id(SampleAustralianSoilClassification, 'Chromosols')))
            contextual_filter.add_term(
                ContextualFilterTermFloat(
                    'ammonium_nitrogen',
                    '',
                    0., 1.))
            contextual_filter.add_term(
                ContextualFilterTermString(
                    'flooding',
                    'complement',
                    'unknown'))
        params = OTUQueryParams(
            contextual_filter=contextual_filter,
            taxonomy_filter=TaxonomyFilter(
                None, [
                    self.make_is(1), # FIXME! magic number taxonomy source
                    self.onto_is(OTUKingdom, 'Bacteria'),
                    self.onto_is(OTUPhylum, 'Bacteroidetes'),
                    self.onto_is(OTUClass, 'Ignavibacteria'),
                    None,
                    None,
                    None,
                    None]))

        timestamp = make_timestamp()
        print(params.filename(timestamp, '.biom.zip'))
        print("******* (start summary):")
        print(params.summary())
        print("******* (end summary):")
        print("******* (start description):")
        print(params.describe())
        print("******* (end description):")

        with SampleQuery(params) as query:
            size = 0
            for data in (s.encode('utf8') for s in generate_biom_file(query)):
                size += len(data)
            print('BIOM output complete, total size={:,}'.format(size), file=sys.stderr)
