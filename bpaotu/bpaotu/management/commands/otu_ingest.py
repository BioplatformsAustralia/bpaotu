
from django.core.management.base import BaseCommand
from glob import glob
from ...otu import DataImporter


class Command(BaseCommand):
    def handle(self, *args, **kwargs):
        print("hello")
        importer = DataImporter('/data/otu')
        importer.load_taxonomies()
