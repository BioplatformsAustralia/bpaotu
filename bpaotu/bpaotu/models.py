from django.db import models

import logging
logger = logging.getLogger("rainbow")


class ImportOntologyLog(models.Model):
    ontology_filename = models.CharField(max_length=300)
    ontology_name = models.CharField(max_length=300)
    import_result = models.TextField(null=True, blank=True)

    class Meta:
        ordering = ['ontology_filename', 'ontology_name']

    def __str__(self):
        return self.ontology_name

    def get_import_result(self):
        output = self.import_result[1:-1].split(",")
        output = [x.replace("'", "") for x in output]

        return output
