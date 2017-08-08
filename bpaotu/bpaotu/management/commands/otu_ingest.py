
from django.core.management.base import BaseCommand
from ...otu import DataImporter


class Command(BaseCommand):
    def handle(self, *args, **kwargs):
        importer = DataImporter('/data/otu')
        importer.load_contextual_metadata()
        importer.load_taxonomies()
