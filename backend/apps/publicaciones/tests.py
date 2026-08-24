from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from apps.usuarios.models import Usuario
from apps.hermanos.models import Hermano
from .models import Publicacion


class PublicacionTestCase(TestCase):

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
            usuario=self.usuario_hermano, nombre='Luis', apellidos='Pérez',
            numero_hermano=2, estado_cuota='PAGADO', caracter='NAZARENO'
        )

        self.publicacion = Publicacion.objects.create(
            hermano=self.hermano_admin,
            titular='Noticia de prueba',
            descripcion='Descripción de la noticia de prueba.',
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


class TestPublicaciones(PublicacionTestCase):

    def test_listar_publicaciones_autenticado(self):
        """Cualquier usuario autenticado puede ver publicaciones."""
        self._auth_hermano()
        res = self.client.get('/api/publicaciones/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(res.data), 1)

    def test_listar_publicaciones_sin_auth(self):
        """Sin autenticar devuelve 401."""
        res = self.client.get('/api/publicaciones/')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_crear_publicacion_admin(self):
        """Admin con perfil hermano puede crear una publicación."""
        self._auth_admin()
        res = self.client.post('/api/publicaciones/', {
            'titular':     'Nueva noticia',
            'descripcion': 'Contenido de la nueva noticia.',
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(
            Publicacion.objects.filter(titular='Nueva noticia').exists())

    def test_crear_publicacion_hermano(self):
        """Hermano no admin no puede crear publicaciones — 403."""
        self._auth_hermano()
        res = self.client.post('/api/publicaciones/', {
            'titular':     'Intento no autorizado',
            'descripcion': 'No debería crearse.',
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_editar_publicacion(self):
        """Admin puede editar el titular de una publicación."""
        self._auth_admin()
        res = self.client.patch(f'/api/publicaciones/{self.publicacion.id}/', {
            'titular': 'Titular editado'
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.publicacion.refresh_from_db()
        self.assertEqual(self.publicacion.titular, 'Titular editado')

    def test_eliminar_publicacion(self):
        """Admin puede eliminar una publicación."""
        self._auth_admin()
        res = self.client.delete(f'/api/publicaciones/{self.publicacion.id}/')
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(
            Publicacion.objects.filter(id=self.publicacion.id).exists())

    def test_detalle_publicacion(self):
        """Cualquier usuario autenticado puede 
        ver el detalle de una publicación."""
        self._auth_hermano()
        res = self.client.get(f'/api/publicaciones/{self.publicacion.id}/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['titular'], 'Noticia de prueba')