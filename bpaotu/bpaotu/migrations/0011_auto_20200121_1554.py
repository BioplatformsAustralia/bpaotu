# Generated by Django 2.2.8 on 2020-01-21 07:54

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('bpaotu', '0010_importsamplesmissingmetadatalog_reason'),
    ]

    operations = [
        migrations.RenameField(
            model_name='importsamplesmissingmetadatalog',
            old_name='samples_without_metadata',
            new_name='samples',
        ),
    ]
