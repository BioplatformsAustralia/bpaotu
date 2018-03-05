from django.db import models
from django.contrib.postgres.fields import ArrayField

import logging
logger = logging.getLogger("rainbow")


class ImportOntologyLog(models.Model):
    environment = models.CharField(max_length=300)
    ontology_name = models.CharField(max_length=300)
    import_result = ArrayField(models.TextField())

    class Meta:
        ordering = ['environment', 'ontology_name']

    def __str__(self):
        return self.ontology_name


class ImportSamplesMissingMetadataLog(models.Model):
    samples_without_metadata = ArrayField(models.TextField())
