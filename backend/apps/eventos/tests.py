from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.utils import timezone
from apps.usuarios.models import Usuario
from apps.hermanos.models import Hermano
from .models import Evento, Inscripcion


class EventoTestCase(TestCase):

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
            usuario=self.usuario_hermano, nombre='Ana', apellidos='López',
            numero_hermano=2, estado_cuota='PAGADO', caracter='NAZARENO'
        )

        self.evento = Evento.objects.create(
            nombre_evento='Culto de Acción de Gracias',
            tipo_evento='CULTO',
            fecha=timezone.now() + timezone.timedelta(days=30),
            lugar='Parroquia de San Juan',
            descripcion='Culto anual de la hermandad.',
        )

    def _auth(self, email, password):
        res = self.client.post('/api/auth/login/', {
            'email': email, 'password': password
        }, format='json')
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {res.data['access']}")

    def _auth_admin(self):   self._auth('admin@cofralink.com', 'Admin123!')
    def _auth_hermano(self): self._auth('hermano1@cofralink.com', 
                                        'Cofralink123!')


class TestListarEventos(EventoTestCase):

    def test_listar_eventos_autenticado(self):
        """Cualquier usuario autenticado puede ver los eventos."""
        self._auth_hermano()
        res = self.client.get('/api/eventos/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(res.data), 1)

    def test_listar_eventos_sin_auth(self):
        """Sin autenticar devuelve 401."""
        res = self.client.get('/api/eventos/')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


class TestCRUDEvento(EventoTestCase):

    def test_crear_evento_admin(self):
        """Admin puede crear un evento."""
        self._auth_admin()
        res = self.client.post('/api/eventos/', {
            'nombre_evento': 'Ensayo de costaleros',
            'tipo_evento':   'ENSAYO',
            'fecha':         '2027-02-15T20:00:00Z',
            'lugar':         'Casa de Hermandad',
            'descripcion':   'Primer ensayo del año.',
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Evento.objects.filter(
            nombre_evento='Ensayo de costaleros').exists())

    def test_crear_evento_hermano(self):
        """Hermano no admin no puede crear eventos — 403."""
        self._auth_hermano()
        res = self.client.post('/api/eventos/', {
            'nombre_evento': 'Evento no autorizado',
            'tipo_evento':   'CULTO',
            'fecha':         '2027-02-15T20:00:00Z',
            'lugar':         'Iglesia',
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_editar_evento(self):
        """Admin puede editar el lugar de un evento."""
        self._auth_admin()
        res = self.client.patch(f'/api/eventos/{self.evento.id}/', {
            'lugar': 'Iglesia Mayor'
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.evento.refresh_from_db()
        self.assertEqual(self.evento.lugar, 'Iglesia Mayor')

    def test_eliminar_evento(self):
        """Admin puede eliminar un evento."""
        self._auth_admin()
        res = self.client.delete(f'/api/eventos/{self.evento.id}/')
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Evento.objects.filter(id=self.evento.id).exists())


class TestInscripciones(EventoTestCase):

    def test_inscribirse_evento(self):
        """Hermano puede inscribirse en un evento — 201."""
        self._auth_hermano()
        res = self.client.post(f'/api/eventos/{self.evento.id}/inscribirse/')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(
            Inscripcion.objects.filter(
                hermano=self.hermano, evento=self.evento
            ).exists()
        )

    def test_inscribirse_dos_veces(self):
        """Segunda inscripción al mismo evento devuelve 400."""
        self._auth_hermano()
        self.client.post(f'/api/eventos/{self.evento.id}/inscribirse/')
        res = self.client.post(f'/api/eventos/{self.evento.id}/inscribirse/')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', res.data)

    def test_inscribirse_sin_perfil_hermano(self):
        """Usuario sin perfil de hermano no puede inscribirse."""
        sin_perfil = Usuario.objects.create_user(
            username='sinperfil', email='sinperfil@cofralink.com', 
            password='Pass1234!'
        )
        res_login = self.client.post('/api/auth/login/', {
            'email': 'sinperfil@cofralink.com', 'password': 'Pass1234!'
        }, format='json')
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {res_login.data['access']}")
        res = self.client.post(f'/api/eventos/{self.evento.id}/inscribirse/')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)