from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0002_roomanchor_associated_asset_id_nullable'),
    ]

    operations = [
        migrations.AddField(
            model_name='roomscan',
            name='panorama_images',
            field=models.JSONField(blank=True, default=list),
        ),
    ]
