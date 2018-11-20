
import datetime
import uuid
from django.core.management.base import BaseCommand
from ...importer import DataImporter
from ...models import ImportMetadata


class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument('base_dir', type=str)

    def handle(self, *args, **kwargs):
        ImportMetadata.objects.all().delete()
        # hard-coded for now, FIXME
        meta = ImportMetadata(
            methodology='v1',
            revision_date=datetime.date(2018, 11, 19),
            imported_at=datetime.date.today(),
            uuid=str(uuid.uuid4()))
        meta.save()
        importer = DataImporter(kwargs['base_dir'])
        importer.load_contextual_metadata()
        otu_lookup = importer.load_taxonomies()
        importer.load_otu_abundance(otu_lookup)
        importer.complete()
