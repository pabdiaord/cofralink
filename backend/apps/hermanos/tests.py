from django.test import TestCase, override_settings
from rest_framework.test import APIClient
from rest_framework import status
from apps.usuarios.models import Usuario
from .models import Hermano


class HermanoTestCase(TestCase):

    def setUp(self):
        self.client = APIClient()

        self.admin = Usuario.objects.create_superuser(
            username='admin', email='admin@cofralink.com', password='Admin123!'
        )
        # Perfil hermano para el admin (necesario para publicaciones)
        self.hermano_admin = Hermano.objects.create(
            usuario=self.admin, nombre='Admin', apellidos='Cofralink',
            numero_hermano=1, estado_cuota='PAGADO', caracter='MIEMBRO_JUNTA'
        )

        self.usuario_hermano = Usuario.objects.create_user(
            username='hermano2', email='hermano2@cofralink.com', 
            password='Cofralink123!'
        )
        self.hermano2 = Hermano.objects.create(
            usuario=self.usuario_hermano, nombre='Juan', apellidos='García',
            numero_hermano=2, estado_cuota='NO_PAGADO', caracter='NAZARENO'
        )

    def _auth_admin(self):
        res = self.client.post('/api/auth/login/', {
            'email': 'admin@cofralink.com', 'password': 'Admin123!'
        }, format='json')
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {res.data['access']}")

    def _auth_hermano(self):
        res = self.client.post('/api/auth/login/', {
            'email': 'hermano2@cofralink.com', 'password': 'Cofralink123!'
        }, format='json')
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {res.data['access']}")


@override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend')
class TestCrearHermanoCompleto(HermanoTestCase):

    def test_crear_hermano_completo_admin(self):
        """Admin puede crear un hermano completo con su usuario."""
        self._auth_admin()
        res = self.client.post('/api/hermanos/crear-completo/', {
            'nombre':         'Pedro',
            'apellidos':      'Martínez',
            'email':          'pedro@cofralink.com',
            'numero_hermano': 10,
            'estado_cuota':   'NO_PAGADO',
            'caracter':       'COSTALERO',
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Usuario.objects.filter(
            email='pedro@cofralink.com').exists())
        self.assertTrue(Hermano.objects.filter(numero_hermano=10).exists())
        usuario = Usuario.objects.get(email='pedro@cofralink.com')
        self.assertFalse(usuario.has_usable_password())

    def test_crear_hermano_completo_sin_admin(self):
        """Un hermano no puede crear otro hermano — debe recibir 403."""
        self._auth_hermano()
        res = self.client.post('/api/hermanos/crear-completo/', {
            'nombre': 'Pedro', 'apellidos': 'Martínez',
            'email': 'pedro@cofralink.com', 'numero_hermano': 10,
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_crear_hermano_email_duplicado(self):
        """Email ya registrado devuelve 400."""
        self._auth_admin()
        res = self.client.post('/api/hermanos/crear-completo/', {
            'nombre': 'Copia', 'apellidos': 'Duplicado',
            'email': 'hermano2@cofralink.com',
            'numero_hermano': 99,
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', res.data)

    def test_crear_hermano_sin_email(self):
        """Falta el email → 400."""
        self._auth_admin()
        res = self.client.post('/api/hermanos/crear-completo/', {
            'nombre': 'Sin', 'apellidos': 'Email',
            'numero_hermano': 99,
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_crear_hermano_sin_nombre(self):
        """Falta el nombre → 400."""
        self._auth_admin()
        res = self.client.post('/api/hermanos/crear-completo/', {
            'email': 'nuevo@cofralink.com',
            'numero_hermano': 99,
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)


class TestListarHermanos(HermanoTestCase):

    def test_listar_hermanos_admin(self):
        """Admin puede listar todos los hermanos."""
        self._auth_admin()
        res = self.client.get('/api/hermanos/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(res.data), 2)

    def test_listar_hermanos_no_admin(self):
        """Hermano no admin no puede listar hermanos — 403."""
        self._auth_hermano()
        res = self.client.get('/api/hermanos/')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_listar_hermanos_sin_auth(self):
        """Sin autenticar devuelve 401."""
        res = self.client.get('/api/hermanos/')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


class TestEditarBajaHermano(HermanoTestCase):

    def test_editar_hermano(self):
        """Admin puede editar el estado de cuota de un hermano."""
        self._auth_admin()
        res = self.client.patch(f'/api/hermanos/{self.hermano2.id}/', {
            'estado_cuota': 'PAGADO'
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.hermano2.refresh_from_db()
        self.assertEqual(self.hermano2.estado_cuota, 'PAGADO')

    def test_baja_hermano(self):
        """Admin da de baja a un hermano: se elimina hermano y su usuario."""
        self._auth_admin()
        hermano_id = self.hermano2.id
        usuario_id = self.usuario_hermano.id
        res = self.client.delete(f'/api/hermanos/{hermano_id}/')
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Hermano.objects.filter(id=hermano_id).exists())
        self.assertFalse(Usuario.objects.filter(id=usuario_id).exists())


class TestMiPerfil(HermanoTestCase):

    def test_mi_perfil_hermano(self):
        """Hermano puede consultar su propio perfil."""
        self._auth_hermano()
        res = self.client.get('/api/mi-perfil/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['nombre'], 'Juan')

    def test_mi_perfil_admin_sin_hermano(self):
        """Admin sin perfil hermano 
        independiente devuelve sus datos de hermano."""
        self._auth_admin()
        res = self.client.get('/api/mi-perfil/')
        # El admin sí tiene perfil hermano (creado en setUp)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
       

class TestFiltrosHermanos(HermanoTestCase):

    def test_buscar_hermano_por_nombre(self):
        """Admin puede filtrar hermanos por nombre."""
        self._auth_admin()
        res = self.client.get('/api/hermanos/?nombre=Juan')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(all(
            'Juan' in h['nombre'] for h in res.data
        ))

    def test_buscar_hermano_por_numero(self):
        """Admin puede filtrar hermanos por número de hermano."""
        self._auth_admin()
        res = self.client.get('/api/hermanos/?numero=2')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]['numero_hermano'], 2)

    def test_buscar_hermano_sin_resultados(self):
        """Búsqueda sin coincidencias devuelve lista vacía."""
        self._auth_admin()
        res = self.client.get('/api/hermanos/?nombre=Inexistente')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 0)


class TestMiPerfilEdicion(HermanoTestCase):

    def test_editar_mi_perfil_direccion(self):
        """Hermano puede actualizar su dirección."""
        self._auth_hermano()
        res = self.client.patch('/api/mi-perfil/', {
            'direccion': 'Calle Nueva 42, Sevilla'
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.hermano2.refresh_from_db()
        self.assertEqual(self.hermano2.direccion, 'Calle Nueva 42, Sevilla')

    def test_editar_mi_perfil_email(self):
        """Hermano puede actualizar su email."""
        self._auth_hermano()
        res = self.client.patch('/api/mi-perfil/', {
            'email': 'nuevo@cofralink.com'
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.usuario_hermano.refresh_from_db()
        self.assertEqual(self.usuario_hermano.email, 'nuevo@cofralink.com')

    def test_editar_mi_perfil_sin_auth(self):
        """Sin autenticar no se puede editar el perfil — 401."""
        res = self.client.patch('/api/mi-perfil/', {
            'direccion': 'Cualquier calle'
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


class TestBajaAtomicaHermano(HermanoTestCase):

    def test_baja_hermano_elimina_usuario_asociado(self):
        """Al dar de baja un hermano se elimina 
        también su usuario de forma atómica."""
        self._auth_admin()
        # Crear un hermano extra para borrar
        nuevo_usuario = Usuario.objects.create_user(
            username='borrar', email='borrar@cofralink.com', 
            password='Cofralink123!'
        )
        nuevo_hermano = Hermano.objects.create(
            usuario=nuevo_usuario, nombre='Borrar', apellidos='Este',
            numero_hermano=50, estado_cuota='NO_PAGADO', caracter='NAZARENO'
        )
        hermano_id = nuevo_hermano.id
        usuario_id = nuevo_usuario.id

        res = self.client.delete(f'/api/hermanos/{hermano_id}/')
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Hermano.objects.filter(id=hermano_id).exists())
        self.assertFalse(Usuario.objects.filter(id=usuario_id).exists())
