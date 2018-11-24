
from django.core.management.base import BaseCommand
from ...importer import DataImporter


class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument('base_dir', type=str)
        parser.add_argument('revision_date', type=str)

    def handle(self, *args, **kwargs):
        importer = DataImporter(kwargs['base_dir'], kwargs['revision_date'])
        importer.load_contextual_metadata()
        otu_lookup = importer.load_taxonomies()
        importer.load_otu_abundance(otu_lookup)
        importer.complete()
