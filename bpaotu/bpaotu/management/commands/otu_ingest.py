
from django.core.management.base import BaseCommand
from ...importer import DataImporter


class Command(BaseCommand):
    def handle(self, *args, **kwargs):
        importer = DataImporter('/data/otu')
        importer.load_soil_contextual_metadata()
        importer.load_marine_contextual_metadata()
        importer.load_taxonomies()
        importer.load_otu()
