from django.db import models


class ImportLog(models.Model):
    ontology_name = models.CharField(max_length=300)
    import_result = models.TextField(null=True, blank=True)

    def __str__(self):
        return self.ontology_name

    def get_import_result(self):
        return self.import_result
