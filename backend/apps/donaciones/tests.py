from unittest.mock import Mock, patch

import stripe
from django.db import IntegrityError
from rest_framework import status
from rest_framework.test import APITestCase, APIRequestFactory, force_authenticate

from apps.usuarios.models import Usuario
from .models import Donacion, EstadoDonacion, EventoStripe, Hucha, TipoHucha
from .views import CrearCheckoutView


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

    def _evento_checkout(self, *, event_id, tipo, donacion=None,
                         payment_status='paid', metadata=True,
                         amount_total=None, currency='eur', livemode=False):
        """Construye un evento Stripe Sandbox realista para el webhook."""
        donacion_id = (
            str(donacion.id)
            if donacion
            else '00000000-0000-0000-0000-000000000000'
        )
        return {
            'id': event_id,
            'type': tipo,
            'livemode': livemode,
            'data': {'object': {
                'id': f'cs_test_{event_id}',
                'client_reference_id': donacion_id,
                'amount_total': amount_total if amount_total is not None else (
                    donacion.importe_centimos if donacion else 1000
                ),
                'currency': currency,
                'payment_status': payment_status,
                'payment_intent': f'pi_test_{event_id}',
                'metadata': {'donacion_id': donacion_id} if metadata else {},
            }},
        }

    def _enviar_evento(self, evento, evento_stripe=None):
        with patch(
            'apps.donaciones.views.stripe.Webhook.construct_event'
        ) as construct_event:
            construct_event.return_value = (
                evento if evento_stripe is None else evento_stripe
            )
            return self.client.post(
                '/api/donaciones/stripe/webhook/', b'{}',
                content_type='application/json',
                HTTP_STRIPE_SIGNATURE='firma-de-prueba',
            )

    def test_anonimo_no_puede_listar_huchas(self):
        response = self.client.get('/api/donaciones/huchas/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_junta_crea_cierra_y_no_elimina_proyecto(self):
        self.client.force_authenticate(self.admin)
        crear = self.client.post('/api/donaciones/huchas/', {
            'nombre': 'Restauración del paso',
            'descripcion': 'Proyecto de prueba',
            'objetivo_centimos': 125000,
        }, format='json')

        self.assertEqual(crear.status_code, status.HTTP_201_CREATED)
        proyecto = Hucha.objects.get(pk=crear.data['id'])
        self.assertEqual(proyecto.tipo, TipoHucha.PROYECTO)
        self.assertEqual(proyecto.creada_por, self.admin)

        cerrar = self.client.patch(
            f'/api/donaciones/huchas/{proyecto.id}/', {'activa': False},
            format='json'
        )
        self.assertEqual(cerrar.status_code, status.HTTP_200_OK)
        proyecto.refresh_from_db()
        self.assertFalse(proyecto.activa)
        self.assertIsNotNone(proyecto.cerrada_en)

        eliminar = self.client.delete(f'/api/donaciones/huchas/{proyecto.id}/')
        self.assertEqual(eliminar.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue(Hucha.objects.filter(pk=proyecto.id).exists())

    def test_hermano_solo_ve_huchas_activas(self):
        Hucha.objects.create(
            nombre='Proyecto cerrado', tipo=TipoHucha.PROYECTO, activa=False
        )
        self.client.force_authenticate(self.hermano)

        response = self.client.get('/api/donaciones/huchas/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            [hucha['id'] for hucha in response.data], [self.general.id])

    def test_checkout_rechaza_hucha_inactiva_aun_si_el_serializador_la_recibe(
            self):
        hucha_cerrada = Hucha.objects.create(
            nombre='Proyecto cerrado', tipo=TipoHucha.PROYECTO, activa=False
        )
        serializer = Mock()
        serializer.validated_data = {
            'hucha': hucha_cerrada,
            'importe_centimos': 1000,
        }
        request = APIRequestFactory().post('/api/donaciones/checkout/', {},
                                           format='json')
        force_authenticate(request, user=self.hermano)

        with patch('apps.donaciones.views.CrearCheckoutSerializer',
                   return_value=serializer):
            response = CrearCheckoutView.as_view()(request)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Donacion.objects.count(), 0)

    @patch('apps.donaciones.views.stripe.checkout.Session.create')
    def test_checkout_marca_fallida_la_donacion_si_stripe_falla(self,
                                                                create_session):
        create_session.side_effect = stripe.error.StripeError('fallo simulado')
        self.client.force_authenticate(self.hermano)

        response = self.client.post('/api/donaciones/checkout/', {
            'hucha_id': self.general.id,
            'importe_centimos': 1000,
        }, format='json')

        self.assertEqual(response.status_code, 
                         status.HTTP_503_SERVICE_UNAVAILABLE)
        donacion = Donacion.objects.get()
        self.assertEqual(donacion.estado, EstadoDonacion.FALLIDA)
        self.assertEqual(donacion.error_codigo, 'stripe_session_error')

    def test_listado_y_detalle_solo_muestran_donaciones_propias_a_un_hermano(
            self):
        otro = Usuario.objects.create_user(
            username='otro', email='otro@example.test',
            password='Password-de-prueba-123'
        )
        propia = Donacion.objects.create(
            donante=self.hermano, hucha=self.general, importe_centimos=1000
        )
        ajena = Donacion.objects.create(
            donante=otro, hucha=self.general, importe_centimos=2000
        )
        self.client.force_authenticate(self.hermano)

        listado = self.client.get('/api/donaciones/mis-donaciones/')
        propia_detalle = self.client.get(
            f'/api/donaciones/mis-donaciones/{propia.id}/')
        ajena_detalle = self.client.get(
            f'/api/donaciones/mis-donaciones/{ajena.id}/')

        self.assertEqual(listado.status_code, status.HTTP_200_OK)
        self.assertEqual([item['id'] for item in listado.data],
                         [str(propia.id)])
        self.assertEqual(propia_detalle.status_code, status.HTTP_200_OK)
        self.assertEqual(ajena_detalle.status_code, status.HTTP_404_NOT_FOUND)

    def test_junta_consulta_detalles_ajenos_y_filtra_donaciones(self):
        proyecto = Hucha.objects.create(
            nombre='Proyecto', tipo=TipoHucha.PROYECTO
        )
        pagada = Donacion.objects.create(
            donante=self.hermano, hucha=self.general,
            importe_centimos=1000, estado=EstadoDonacion.PAGADA
        )
        Donacion.objects.create(
            donante=self.hermano, hucha=proyecto,
            importe_centimos=2000, estado=EstadoDonacion.PENDIENTE
        )
        self.client.force_authenticate(self.admin)

        detalle = self.client.get(
            f'/api/donaciones/mis-donaciones/{pagada.id}/')
        filtrado = self.client.get(
            f'/api/donaciones/admin/donaciones/?hucha={
                self.general.id}&estado=PAGADA'
        )
        estado_invalido = self.client.get(
            '/api/donaciones/admin/donaciones/?estado=INVENTADO')

        self.assertEqual(detalle.status_code, status.HTTP_200_OK)
        self.assertEqual([item['id'] for item in filtrado.data],
                         [str(pagada.id)])
        self.assertEqual(len(estado_invalido.data), 2)

    def test_webhook_rechaza_firma_invalida(self):
        with patch('apps.donaciones.views.stripe.Webhook.construct_event',
                   side_effect=ValueError):
            response = self.client.post(
                '/api/donaciones/stripe/webhook/', b'{}',
                content_type='application/json',
                HTTP_STRIPE_SIGNATURE='firma-invalida'
            )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_webhook_convierte_objeto_stripe_y_rechaza_evento_live(self):
        evento = self._evento_checkout(
            event_id='evt_live', tipo='checkout.session.completed',
            livemode=True
        )
        objeto_stripe = Mock()
        objeto_stripe.to_dict.return_value = evento

        response = self._enviar_evento(evento, evento_stripe=objeto_stripe)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        objeto_stripe.to_dict.assert_called_once_with()
        self.assertFalse(EventoStripe.objects.exists())

    def test_webhook_ignora_evento_que_no_es_de_interes(self):
        evento = {
            'id': 'evt_ignorado', 'type': 'charge.succeeded',
            'livemode': False,
            'data': {'object': {}},
        }
        response = self._enviar_evento(evento)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(EventoStripe.objects.exists())

    def test_webhook_registra_evento_sin_donacion(self):
        evento = self._evento_checkout(
            event_id='evt_sin_donacion', tipo='checkout.session.completed',
            metadata=False
        )
        response = self._enviar_evento(evento)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        registro = EventoStripe.objects.get(stripe_event_id='evt_sin_donacion')
        self.assertEqual(registro.error, 'missing_donation_id')
        self.assertFalse(registro.procesado)

    def test_webhook_registra_donacion_desconocida_y_sesion_incoherente(self):
        desconocida = self._evento_checkout(
            event_id='evt_desconocida', tipo='checkout.session.completed'
        )
        primera = self._enviar_evento(desconocida)

        donacion = Donacion.objects.create(
            donante=self.hermano, hucha=self.general, importe_centimos=1000
        )
        incoherente = self._evento_checkout(
            event_id='evt_incoherente', tipo='checkout.session.completed',
            donacion=donacion, amount_total=999
        )
        segunda = self._enviar_evento(incoherente)

        self.assertEqual(primera.status_code, status.HTTP_200_OK)
        self.assertEqual(segunda.status_code, status.HTTP_200_OK)
        self.assertEqual(
            EventoStripe.objects.get(stripe_event_id='evt_desconocida').error,
            'unknown_donation'
        )
        self.assertEqual(
            EventoStripe.objects.get(stripe_event_id='evt_incoherente').error,
            'session_mismatch'
        )
        donacion.refresh_from_db()
        self.assertEqual(donacion.estado, EstadoDonacion.PENDIENTE)

    def test_webhook_ignora_un_evento_ya_recibido(self):
        donacion = Donacion.objects.create(
            donante=self.hermano, hucha=self.general, importe_centimos=1000
        )
        EventoStripe.objects.create(
            stripe_event_id='evt_repetido', tipo='checkout.session.completed'
        )
        evento = self._evento_checkout(
            event_id='evt_repetido', tipo='checkout.session.completed',
            donacion=donacion
        )

        response = self._enviar_evento(evento)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        donacion.refresh_from_db()
        self.assertEqual(donacion.estado, EstadoDonacion.PENDIENTE)

    def test_webhook_reconoce_colision_de_idempotencia(self):
        evento = self._evento_checkout(
            event_id='evt_colision', tipo='checkout.session.completed'
        )
        with patch(
            'apps.donaciones.views.EventoStripe.objects.get_or_create',
            side_effect=IntegrityError,
        ):
            response = self._enviar_evento(evento)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_webhook_actualiza_estados_fallido_y_cancelado(self):
        fallida = Donacion.objects.create(
            donante=self.hermano, hucha=self.general, importe_centimos=1000
        )
        cancelada = Donacion.objects.create(
            donante=self.hermano, hucha=self.general, importe_centimos=2000
        )
        evento_fallido = self._evento_checkout(
            event_id='evt_fallida',
            tipo='checkout.session.async_payment_failed',
            donacion=fallida, payment_status='unpaid'
        )
        evento_expirado = self._evento_checkout(
            event_id='evt_expirada', tipo='checkout.session.expired',
            donacion=cancelada, payment_status='unpaid'
        )

        primera = self._enviar_evento(evento_fallido)
        segunda = self._enviar_evento(evento_expirado)

        self.assertEqual(primera.status_code, status.HTTP_200_OK)
        self.assertEqual(segunda.status_code, status.HTTP_200_OK)
        fallida.refresh_from_db()
        cancelada.refresh_from_db()
        self.assertEqual(fallida.estado, EstadoDonacion.FALLIDA)
        self.assertEqual(fallida.error_codigo, 'payment_failed')
        self.assertEqual(cancelada.estado, EstadoDonacion.CANCELADA)
        self.assertEqual(cancelada.error_codigo, 'checkout_expired')
