from django.db import models

class NonDenoisedDataRequest(models.Model):
    match_sequence = models.TextField(null=False)
    taxonomy_string = models.TextField(null=False)
    amplicon = models.TextField(null=False)
    email = models.TextField(null=False)
    selected_samples = models.TextField(null=False)

class MetagenomeRequest(models.Model):
    sample_ids = models.TextField() # \n separated
    file_types = models.TextField() # \n separated
    created = models.DateTimeField(auto_now_add=True)
    email = models.EmailField()
