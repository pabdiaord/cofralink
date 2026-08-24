from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from apps.usuarios.models import Usuario
from .models import Imagen, Enser, Util


class InventarioTestCase(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.admin = Usuario.objects.create_superuser(
            username='admin', email='admin@cofralink.com', password='Admin123!'
        )
        self.hermano = Usuario.objects.create_user(
            username='hermano1', email='hermano1@cofralink.com', 
            password='Cofralink123!'
        )
        self.imagen = Imagen.objects.create(
            nombre='Nuestro Padre Jesús',
            tipo_objeto='IMAGEN',
            conservacion='Buena',
            lugar_culto='Capilla Mayor',
        )
        self.enser = Enser.objects.create(
            nombre='Cruz de guía',
            tipo_objeto='ENSER',
            conservacion='Muy buena',
            ubicacion='Almacén principal',
        )
        self.util = Util.objects.create(
            nombre='Carretilla',
            tipo_objeto='UTIL',
            ubicacion='Almacén',
            cantidad=2,
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


class TestInventarioAdmin(InventarioTestCase):

    def test_crear_imagen(self):
        """Admin puede crear una imagen devocional."""
        self._auth_admin()
        res = self.client.post('/api/imagenes/', {
            'nombre':      'Virgen de la Esperanza',
            'tipo_objeto': 'IMAGEN',
            'conservacion': 'Excelente',
            'lugar_culto':  'Presbiterio',
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Imagen.objects.filter(
            nombre='Virgen de la Esperanza').exists())

    def test_crear_enser(self):
        """Admin puede crear un enser."""
        self._auth_admin()
        res = self.client.post('/api/enseres/', {
            'nombre':      'Candelabro procesional',
            'tipo_objeto': 'ENSER',
            'conservacion': 'Buena',
            'ubicacion':    'Almacén principal',
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

    def test_crear_util(self):
        """Admin puede crear un útil."""
        self._auth_admin()
        res = self.client.post('/api/utiles/', {
            'nombre':      'Escalera',
            'tipo_objeto': 'UTIL',
            'ubicacion':   'Almacén',
            'cantidad':    3,
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

    def test_listar_imagenes(self):
        """Admin puede listar imágenes."""
        self._auth_admin()
        res = self.client.get('/api/imagenes/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(res.data), 1)

    def test_editar_imagen(self):
        """Admin puede editar el estado de conservación de una imagen."""
        self._auth_admin()
        res = self.client.patch(f'/api/imagenes/{self.imagen.id}/', {
            'conservacion': 'En restauración'
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.imagen.refresh_from_db()
        self.assertEqual(self.imagen.conservacion, 'En restauración')

    def test_eliminar_util(self):
        """Admin puede eliminar un útil."""
        self._auth_admin()
        res = self.client.delete(f'/api/utiles/{self.util.id}/')
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Util.objects.filter(id=self.util.id).exists())


class TestInventarioPermisos(InventarioTestCase):

    def test_inventario_sin_admin(self):
        """Hermano no admin no puede crear imágenes — 403."""
        self._auth_hermano()
        res = self.client.post('/api/imagenes/', {
            'nombre': 'Intento', 'tipo_objeto': 'IMAGEN',
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_inventario_sin_auth(self):
        """Sin autenticar devuelve 401."""
        res = self.client.get('/api/imagenes/')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_util_cantidad_por_defecto(self):
        """Un útil sin cantidad indicada se crea con cantidad=1."""
        self._auth_admin()
        res = self.client.post('/api/utiles/', {
            'nombre':      'Cuerda',
            'tipo_objeto': 'UTIL',
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['cantidad'], 1)
