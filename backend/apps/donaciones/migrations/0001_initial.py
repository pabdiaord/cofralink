# Generated manually for CofraLink's Stripe Sandbox donations module.

import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models
from django.db.models import Q


def crear_hucha_general(apps, schema_editor):
    Hucha = apps.get_model('donaciones', 'Hucha')
    Hucha.objects.get_or_create(
        tipo='GENERAL',
        defaults={
            'nombre': 'Hucha General de la Hermandad',
            'descripcion': (
                'Donaciones simuladas destinadas a la actividad ordinaria de la Hermandad.'
            ),
            'activa': True,
        },
    )


def eliminar_hucha_general(apps, schema_editor):
    # Se conserva al revertir para no eliminar por accidente un historial de TFG.
    pass


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='EventoStripe',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('stripe_event_id', models.CharField(max_length=255, unique=True)),
                ('tipo', models.CharField(max_length=100)),
                ('procesado', models.BooleanField(default=False)),
                ('error', models.CharField(blank=True, max_length=255)),
                ('recibido_en', models.DateTimeField(auto_now_add=True)),
            ],
            options={'ordering': ('-recibido_en',)},
        ),
        migrations.CreateModel(
            name='Hucha',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nombre', models.CharField(max_length=150)),
                ('descripcion', models.TextField(blank=True)),
                ('tipo', models.CharField(choices=[('GENERAL', 'Hucha general'), ('PROYECTO', 'Proyecto')], max_length=10)),
                ('objetivo_centimos', models.PositiveIntegerField(blank=True, null=True)),
                ('activa', models.BooleanField(default=True)),
                ('creada_en', models.DateTimeField(auto_now_add=True)),
                ('cerrada_en', models.DateTimeField(blank=True, null=True)),
                ('creada_por', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='huchas_creadas', to=settings.AUTH_USER_MODEL)),
            ],
            options={'ordering': ('tipo', '-creada_en')},
        ),
        migrations.CreateModel(
            name='Donacion',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('importe_centimos', models.PositiveIntegerField()),
                ('moneda', models.CharField(default='eur', max_length=3)),
                ('estado', models.CharField(choices=[('PENDIENTE', 'Pendiente'), ('PAGADA', 'Pagada'), ('FALLIDA', 'Fallida'), ('CANCELADA', 'Cancelada'), ('REEMBOLSADA', 'Reembolsada')], default='PENDIENTE', max_length=15)),
                ('stripe_checkout_session_id', models.CharField(blank=True, max_length=255, null=True, unique=True)),
                ('stripe_payment_intent_id', models.CharField(blank=True, max_length=255, null=True, unique=True)),
                ('error_codigo', models.CharField(blank=True, max_length=100)),
                ('creada_en', models.DateTimeField(auto_now_add=True)),
                ('actualizada_en', models.DateTimeField(auto_now=True)),
                ('pagada_en', models.DateTimeField(blank=True, null=True)),
                ('donante', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='donaciones', to=settings.AUTH_USER_MODEL)),
                ('hucha', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='donaciones', to='donaciones.hucha')),
            ],
            options={'ordering': ('-creada_en',)},
        ),
        migrations.AddConstraint(
            model_name='hucha',
            constraint=models.UniqueConstraint(condition=Q(('tipo', 'GENERAL')), fields=('tipo',), name='una_unica_hucha_general'),
        ),
        migrations.AddConstraint(
            model_name='donacion',
            constraint=models.CheckConstraint(condition=Q(('importe_centimos__gte', 100)), name='donacion_importe_minimo_un_euro'),
        ),
        migrations.RunPython(crear_hucha_general, eliminar_hucha_general),
    ]
