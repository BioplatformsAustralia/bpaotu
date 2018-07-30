
from django.core.management.base import BaseCommand
from ...query import TaxonomyOptions, OntologyInfo
from ...otu import OTUKingdom, OTUAmplicon, OTUPhylum
from collections import OrderedDict


class Command(BaseCommand):
    def handle(self, *args, **kwargs):
        kingdom_possibilities = [None]
        amplicon_possibilities = [None]

        def make_is(v):
            if v is None:
                return v
            return OrderedDict([('operator', 'is'), ('value', v)])

        with OntologyInfo() as info:
            amplicon_possibilities = [None] + [t for (t, _) in info.get_values(OTUAmplicon)]
            kingdom_possibilities = [None] + [t for (t, _) in info.get_values(OTUKingdom)]

        print("Warming taxonomy query cache")
        with TaxonomyOptions() as q:
            for amplicon_id in amplicon_possibilities:
                for kingdom_id in kingdom_possibilities:
                    q.possibilities(make_is(amplicon_id), [make_is(kingdom_id), None, None, None, None, None, None])
        print("Complete")
