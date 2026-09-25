from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('hermanos', '0002_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='hermano',
            name='telefono',
            field=models.CharField(blank=True, max_length=20),
        ),
    ]
