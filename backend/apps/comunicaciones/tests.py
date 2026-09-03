from datetime import timedelta

from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
from apps.usuarios.models import Usuario
from apps.hermanos.models import Hermano
from .models import Conversacion, MensajePrivado, MensajeGeneral
from .models import ReaccionMensaje


class ComunicacionesTestCase(TestCase):

    def setUp(self):
        self.client = APIClient()

        self.admin = Usuario.objects.create_superuser(
            username='admin', email='admin@cofralink.com', password='Admin123!'
        )
        self.hermano_admin = Hermano.objects.create(
            usuario=self.admin, nombre='Admin', apellidos='Test',
            numero_hermano=1, estado_cuota='PAGADO', caracter='MIEMBRO_JUNTA'
        )

        self.usuario_hermano = Usuario.objects.create_user(
            username='hermano1', email='hermano1@cofralink.com', 
            password='Cofralink123!'
        )
        self.hermano = Hermano.objects.create(
            usuario=self.usuario_hermano, nombre='María', apellidos='Sánchez',
            numero_hermano=2, estado_cuota='PAGADO', caracter='NAZARENO'
        )

        self.usuario_hermano2 = Usuario.objects.create_user(
            username='hermano2', email='hermano2@cofralink.com', 
            password='Cofralink123!'
        )
        self.hermano2 = Hermano.objects.create(
            usuario=self.usuario_hermano2, nombre='Pedro', apellidos='García',
            numero_hermano=3, estado_cuota='NO_PAGADO', caracter='COSTALERO'
        )

    def _auth(self, email, password):
        res = self.client.post('/api/auth/login/', {
            'email': email, 'password': password
        }, format='json')
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {res.data['access']}")

    def _auth_admin(self):    self._auth('admin@cofralink.com', 'Admin123!')

    def _auth_hermano(self):  self._auth('hermano1@cofralink.com', 
                                         'Cofralink123!')
    def _auth_hermano2(self): self._auth('hermano2@cofralink.com', 
                                         'Cofralink123!')


class TestConversacionPrivada(ComunicacionesTestCase):

    def test_obtener_mi_conversacion(self):
        """Hermano obtiene o crea su conversación privada."""
        self._auth_hermano()
        res = self.client.get('/api/mi-conversacion/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(Conversacion.objects.filter(
            hermano=self.usuario_hermano).exists())

    def test_enviar_mensaje_privado_hermano(self):
        """Hermano puede enviar un mensaje a la junta."""
        self._auth_hermano()
        self.client.get('/api/mi-conversacion/')  # crear conversación
        res = self.client.post('/api/mi-conversacion/', {
            'contenido': 'Hola, tengo una consulta sobre mi cuota.'
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['contenido'], 
                         'Hola, tengo una consulta sobre mi cuota.')

    def test_enviar_mensaje_privado_vacio(self):
        """Mensaje vacío devuelve 400."""
        self._auth_hermano()
        self.client.get('/api/mi-conversacion/')
        res = self.client.post('/api/mi-conversacion/', {
            'contenido': '   '
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_admin_lista_conversaciones(self):
        """Admin puede ver todas las conversaciones."""
        # Crear conversaciones de ambos hermanos
        self._auth_hermano()
        self.client.get('/api/mi-conversacion/')
        self._auth_hermano2()
        self.client.get('/api/mi-conversacion/')

        self._auth_admin()
        res = self.client.get('/api/conversaciones/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(res.data), 2)

    def test_hermano_no_ve_otras_conversaciones(self):
        """Hermano solo ve su propia conversación."""
        self._auth_hermano()
        self.client.get('/api/mi-conversacion/')
        self._auth_hermano2()
        self.client.get('/api/mi-conversacion/')

        self._auth_hermano()
        res = self.client.get('/api/conversaciones/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(
            res.data[0]['hermano_email'], 'hermano1@cofralink.com')

    def test_admin_responde_conversacion(self):
        """Admin puede responder en una conversación privada."""
        self._auth_hermano()
        self.client.get('/api/mi-conversacion/')
        conv = Conversacion.objects.get(hermano=self.usuario_hermano)

        self._auth_admin()
        res = self.client.post(f'/api/conversaciones/{conv.id}/enviar/', {
            'contenido': 'Hola, te respondemos desde la Junta.'
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

    def test_mensajes_de_la_junta_se_muestran_como_propios_para_el_admin(self):
        """El buzón privado es compartido por todos los miembros de Junta."""
        otro_miembro_junta = Usuario.objects.create_user(
            username='secretaria', email='secretaria@cofralink.com',
            password='Secretaria123!', is_staff=True,
        )
        conversacion = Conversacion.objects.create(
            hermano=self.usuario_hermano
        )
        MensajePrivado.objects.create(
            conversacion=conversacion,
            remitente=otro_miembro_junta,
            contenido='Respondemos desde Secretaría.',
        )

        self._auth_admin()
        res = self.client.get(f'/api/conversaciones/{conversacion.id}/mensajes/')

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data[0]['es_mio'])

    def test_admin_lista_conversaciones_por_actividad_mas_reciente(self):
        """La conversación con el último mensaje debe aparecer en primer lugar."""
        conversacion_antigua = Conversacion.objects.create(
            hermano=self.usuario_hermano
        )
        conversacion_reciente = Conversacion.objects.create(
            hermano=self.usuario_hermano2
        )
        mensaje_antiguo = MensajePrivado.objects.create(
            conversacion=conversacion_antigua,
            remitente=self.usuario_hermano,
            contenido='Mensaje antiguo.',
        )
        mensaje_reciente = MensajePrivado.objects.create(
            conversacion=conversacion_reciente,
            remitente=self.usuario_hermano2,
            contenido='Mensaje reciente.',
        )
        MensajePrivado.objects.filter(pk=mensaje_antiguo.pk).update(
            fecha=timezone.now() - timedelta(days=1)
        )
        MensajePrivado.objects.filter(pk=mensaje_reciente.pk).update(
            fecha=timezone.now()
        )

        self._auth_admin()
        res = self.client.get('/api/conversaciones/')

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data[0]['id'], conversacion_reciente.id)

    def test_mensajes_se_marcan_leidos(self):
        """Al leer los mensajes como admin, se marcan como leídos."""
        self._auth_hermano()
        self.client.get('/api/mi-conversacion/')
        self.client.post('/api/mi-conversacion/', {
            'contenido': 'Mensaje sin leer'
        }, format='json')

        conv = Conversacion.objects.get(hermano=self.usuario_hermano)
        self.assertEqual(conv.mensajes.filter(leido=False).count(), 1)

        self._auth_admin()
        self.client.get(f'/api/conversaciones/{conv.id}/mensajes/')
        self.assertEqual(conv.mensajes.filter(leido=False).count(), 0)


class TestCanalGeneral(ComunicacionesTestCase):

    def test_publicar_mensaje_general_admin(self):
        """Admin puede publicar en el canal general."""
        self._auth_admin()
        res = self.client.post('/api/chat-general/', {
            'contenido': 'Comunicado oficial de la Junta.'
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(MensajeGeneral.objects.filter(
            contenido='Comunicado oficial de la Junta.'
        ).exists())

    def test_publicar_mensaje_general_hermano(self):
        """Hermano no puede publicar en el canal general — 403."""
        self._auth_hermano()
        res = self.client.post('/api/chat-general/', {
            'contenido': 'Intento no autorizado'
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_listar_mensajes_generales(self):
        """Cualquier usuario autenticado puede leer el canal general."""
        MensajeGeneral.objects.create(
            autor=self.admin,
            contenido='Mensaje de prueba'
        )
        self._auth_hermano()
        res = self.client.get('/api/chat-general/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(res.data), 1)


class TestReacciones(ComunicacionesTestCase):

    def setUp(self):
        super().setUp()
        self.mensaje = MensajeGeneral.objects.create(
            autor=self.admin,
            contenido='Mensaje con reacciones'
        )

    def test_reaccionar_mensaje(self):
        """Hermano puede reaccionar con un emoji a un mensaje general."""
        self._auth_hermano()
        res = self.client.post(
            f'/api/chat-general/{self.mensaje.id}/reaccionar/',
            {'emoji': '❤️'}, format='json'
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['reaccion'], '❤️')
        self.assertTrue(ReaccionMensaje.objects.filter(
            mensaje=self.mensaje,
            usuario=self.usuario_hermano,
            emoji='❤️'
        ).exists())

    def test_reaccionar_toggle(self):
        """Misma reacción dos veces elimina la reacción (toggle)."""
        self._auth_hermano()
        self.client.post(
            f'/api/chat-general/{self.mensaje.id}/reaccionar/',
            {'emoji': '❤️'}, format='json'
        )
        res = self.client.post(
            f'/api/chat-general/{self.mensaje.id}/reaccionar/',
            {'emoji': '❤️'}, format='json'
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIsNone(res.data['reaccion'])
        self.assertFalse(ReaccionMensaje.objects.filter(
            mensaje=self.mensaje, usuario=self.usuario_hermano
        ).exists())

    def test_cambiar_reaccion(self):
        """Cambiar de emoji actualiza la reacción existente."""
        self._auth_hermano()
        self.client.post(
            f'/api/chat-general/{self.mensaje.id}/reaccionar/',
            {'emoji': '❤️'}, format='json'
        )
        res = self.client.post(
            f'/api/chat-general/{self.mensaje.id}/reaccionar/',
            {'emoji': '👏'}, format='json'
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['reaccion'], '👏')
        reaccion = ReaccionMensaje.objects.get(
            mensaje=self.mensaje, usuario=self.usuario_hermano
        )
        self.assertEqual(reaccion.emoji, '👏')

    def test_reaccionar_sin_emoji(self):
        """Reacción sin emoji devuelve 400."""
        self._auth_hermano()
        res = self.client.post(
            f'/api/chat-general/{self.mensaje.id}/reaccionar/',
            {'emoji': ''}, format='json'
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
