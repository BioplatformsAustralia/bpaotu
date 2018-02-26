
from django.core.management.base import BaseCommand
from ...importer import DataImporter


class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument('base_dir', type=str)

    def handle(self, *args, **kwargs):
        importer = DataImporter(kwargs['base_dir'])
        importer.load_soil_contextual_metadata()
        quit('-----exiting here')
        importer.load_marine_contextual_metadata()
        otu_lookup = importer.load_taxonomies()
        importer.load_otu(otu_lookup)
