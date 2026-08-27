from unittest.mock import Mock, patch

from rest_framework import status
from rest_framework.test import APITestCase

from apps.usuarios.models import Usuario
from .models import Donacion, EstadoDonacion, Hucha, TipoHucha


class DonacionesAPITests(APITestCase):
    def setUp(self):
        self.hermano = Usuario.objects.create_user(
            username='hermano', email='hermano@example.test',
            password='Password-de-prueba-123'
        )
        self.admin = Usuario.objects.create_user(
            username='junta', email='junta@example.test',
            password='Password-de-prueba-123', is_staff=True
        )
        self.general = Hucha.objects.get(tipo=TipoHucha.GENERAL)

    def test_hucha_general_se_crea_por_migracion(self):
        self.assertTrue(self.general.activa)
        self.assertEqual(Hucha.objects.filter(
            tipo=TipoHucha.GENERAL).count(), 1)

    def test_un_hermano_no_puede_crear_huchas(self):
        self.client.force_authenticate(self.hermano)
        response = self.client.post('/api/donaciones/huchas/', {
            'nombre': 'Proyecto no autorizado',
            'descripcion': '',
            'objetivo_centimos': 5000,
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_no_se_puede_cerrar_la_hucha_general(self):
        self.client.force_authenticate(self.admin)
        response = self.client.patch(
            f'/api/donaciones/huchas/{self.general.id}/', {'activa': False},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.general.refresh_from_db()
        self.assertTrue(self.general.activa)

    @patch('apps.donaciones.views.stripe.checkout.Session.create')
    def test_crear_checkout_deja_donacion_pendiente(self, create_session):
        create_session.return_value = Mock(
            id='cs_test_donacion_1',
            url='https://checkout.stripe.test/cs_test_donacion_1',
        )
        self.client.force_authenticate(self.hermano)

        response = self.client.post('/api/donaciones/checkout/', {
            'hucha_id': self.general.id,
            'importe_centimos': 1000,
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        donacion = Donacion.objects.get(pk=response.data['donacion_id'])
        self.assertEqual(donacion.estado, EstadoDonacion.PENDIENTE)
        self.assertEqual(donacion.stripe_checkout_session_id,
                         'cs_test_donacion_1')
        self.assertEqual(response.data['checkout_url'],
                         'https://checkout.stripe.test/cs_test_donacion_1')

    @patch('apps.donaciones.views.stripe.Webhook.construct_event')
    def test_webhook_confirma_una_vez_y_actualiza_recaudacion(self,
                                                              construct_event):
        donacion = Donacion.objects.create(
            donante=self.hermano,
            hucha=self.general,
            importe_centimos=2500,
            stripe_checkout_session_id='cs_test_donacion_2',
        )
        construct_event.return_value = {
            'id': 'evt_test_donacion_confirmada',
            'type': 'checkout.session.completed',
            'data': {'object': {
                'id': 'cs_test_donacion_2',
                'client_reference_id': str(donacion.id),
                'amount_total': 2500,
                'currency': 'eur',
                'payment_status': 'paid',
                'payment_intent': 'pi_test_donacion_2',
                'metadata': {'donacion_id': str(donacion.id)},
            }},
        }

        headers = {'HTTP_STRIPE_SIGNATURE': 'firma-de-prueba'}
        primera = self.client.post('/api/donaciones/stripe/webhook/', b'{}',
                                   content_type='application/json', **headers)
        segunda = self.client.post('/api/donaciones/stripe/webhook/', b'{}',
                                   content_type='application/json', **headers)

        self.assertEqual(primera.status_code, status.HTTP_200_OK)
        self.assertEqual(segunda.status_code, status.HTTP_200_OK)
        donacion.refresh_from_db()
        self.assertEqual(donacion.estado, EstadoDonacion.PAGADA)
        self.assertEqual(donacion.stripe_payment_intent_id,
                         'pi_test_donacion_2')

        self.client.force_authenticate(self.hermano)
        response = self.client.get('/api/donaciones/huchas/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data[0]['recaudado_centimos'], 2500)

    def test_webhook_sin_firma_es_rechazado(self):
        response = self.client.post(
            '/api/donaciones/stripe/webhook/', b'{}',
            content_type='application/json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
