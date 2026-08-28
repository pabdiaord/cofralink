import importlib

from django.contrib import admin
from django.test import RequestFactory, TestCase

from apps.usuarios.models import Usuario
from .admin import DonacionAdmin, EventoStripeAdmin
from .models import Donacion, EstadoDonacion, EventoStripe, Hucha, TipoHucha
from .serializers import HuchaAdminSerializer, HuchaSerializer


class DonacionesModelosSerializadoresYAdminTests(TestCase):
    def setUp(self):
        self.usuario = Usuario.objects.create_user(
            username='hermano-modelos', email='modelos@example.test',
            password='Password-de-prueba-123'
        )
        self.hucha = Hucha.objects.get(tipo=TipoHucha.GENERAL)

    def test_representaciones_textuales(self):
        donacion = Donacion.objects.create(
            donante=self.usuario, hucha=self.hucha, importe_centimos=1234
        )
        evento = EventoStripe.objects.create(
            stripe_event_id='evt_texto', tipo='checkout.session.completed'
        )

        self.assertEqual(str(self.hucha), 'Hucha General de la Hermandad')
        self.assertIn('1234', str(donacion))
        self.assertEqual(str(evento), 'checkout.session.completed (evt_texto)')

    def test_serializador_calcula_recaudacion_sin_anotaciones(self):
        Donacion.objects.create(
            donante=self.usuario, hucha=self.hucha, importe_centimos=1500,
            estado=EstadoDonacion.PAGADA
        )
        Donacion.objects.create(
            donante=self.usuario, hucha=self.hucha, importe_centimos=2000,
            estado=EstadoDonacion.FALLIDA
        )
        self.hucha.objetivo_centimos = 1500
        self.hucha.save(update_fields=('objetivo_centimos',))

        data = HuchaSerializer(self.hucha).data

        self.assertEqual(data['recaudado_centimos'], 1500)
        self.assertEqual(data['numero_donaciones'], 1)
        self.assertTrue(data['objetivo_alcanzado'])

    def test_serializador_indica_objetivo_no_configurado(self):
        self.assertFalse(
            HuchaSerializer(self.hucha).data['objetivo_alcanzado'])

    def test_serializador_admin_valida_objetivo_y_crea_proyecto(self):
        invalido = HuchaAdminSerializer(data={
            'nombre': 'Objetivo inválido', 'descripcion': '',
            'objetivo_centimos': 99,
        })
        self.assertFalse(invalido.is_valid())
        self.assertIn('objetivo_centimos', invalido.errors)

        valido = HuchaAdminSerializer(data={
            'nombre': 'Proyecto serializado', 'descripcion': 'Descripción',
            'objetivo_centimos': 100,
        })
        self.assertTrue(valido.is_valid(), valido.errors)
        proyecto = valido.save()
        self.assertEqual(proyecto.tipo, TipoHucha.PROYECTO)

    def test_permisos_de_admin_son_solo_lectura_donde_corresponde(self):
        request = RequestFactory().get('/admin/')
        donacion_admin = DonacionAdmin(Donacion, admin.site)
        evento_admin = EventoStripeAdmin(EventoStripe, admin.site)

        self.assertFalse(donacion_admin.has_add_permission(request))
        self.assertFalse(donacion_admin.has_delete_permission(request))
        self.assertFalse(evento_admin.has_add_permission(request))
        self.assertFalse(evento_admin.has_change_permission(request))
        self.assertFalse(evento_admin.has_delete_permission(request))

    def test_reversion_de_migracion_no_borra_hucha_general(self):
        migration = importlib.import_module(
            'apps.donaciones.migrations.0001_initial')
        migration.eliminar_hucha_general(None, None)
        self.assertTrue(Hucha.objects.filter(tipo=TipoHucha.GENERAL).exists())

    def test_migracion_crea_la_hucha_general_con_los_valores_esperados(self):
        migration = importlib.import_module(
            'apps.donaciones.migrations.0001_initial')

        class ManagerFicticio:
            def get_or_create(self, **kwargs):
                self.kwargs = kwargs
                return object(), True

        class HuchaFicticia:
            objects = ManagerFicticio()

        class AppsFicticias:
            def get_model(self, app_label, model_name):
                self.app_label = app_label
                self.model_name = model_name
                return HuchaFicticia

        apps = AppsFicticias()
        migration.crear_hucha_general(apps, None)

        self.assertEqual(apps.app_label, 'donaciones')
        self.assertEqual(apps.model_name, 'Hucha')
        self.assertEqual(HuchaFicticia.objects.kwargs['tipo'], 'GENERAL')
        self.assertEqual(
            HuchaFicticia.objects.kwargs['defaults']['nombre'],
            'Hucha General de la Hermandad'
        )
