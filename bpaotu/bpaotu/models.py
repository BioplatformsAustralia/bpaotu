from django.db import models

import logging
logger = logging.getLogger("rainbow")


class NonDenoisedDataRequest(models.Model):
    match_sequence = models.TextField(null=False)
    taxonomy_string = models.TextField(null=False)
    amplicon = models.TextField(null=False)
    email = models.TextField(null=False)
    selected_samples = models.TextField(null=False)
