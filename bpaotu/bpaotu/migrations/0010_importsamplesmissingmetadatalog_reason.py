# Generated by Django 2.2.8 on 2020-01-21 07:17

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('bpaotu', '0009_auto_20181124_1532'),
    ]

    operations = [
        migrations.AddField(
            model_name='importsamplesmissingmetadatalog',
            name='reason',
            field=models.CharField(default='', max_length=32),
            preserve_default=False,
        ),
    ]