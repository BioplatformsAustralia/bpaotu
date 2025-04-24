
from django.core.management.base import BaseCommand
from ...importer import DataImporter


class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument('base_dir', type=str)
        parser.add_argument('revision_date', type=str)
        parser.add_argument('--use-sql-context', action='store_true')
        parser.add_argument('--no-force-fetch', action='store_false')

    def handle(self, *args, **kwargs):
        importer = DataImporter(kwargs['base_dir'], kwargs['revision_date'], kwargs['use_sql_context'], kwargs['no_force_fetch'])
        importer.run()
