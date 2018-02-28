from django.db import models

import logging
logger = logging.getLogger("rainbow")


class ImportLog(models.Model):
    ontology_name = models.CharField(max_length=300)
    import_result = models.TextField(null=True, blank=True)

    def __str__(self):
        return self.ontology_name

    def get_import_result(self):
        output = self.import_result[1:-1].split(",")
        output = [x.replace("'", "") for x in output]

        return output
