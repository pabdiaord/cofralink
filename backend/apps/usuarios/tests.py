from django.test import TestCase, override_settings
from django.core.cache import cache
# from django.urls import reverse
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework.test import APIClient
from rest_framework import status
from .models import Usuario
from .throttles import LoginIPThrottle


class UsuarioTestCase(TestCase):
    """Fixture compartido: crea un admin y un hermano para todos los tests."""

    def setUp(self):
        self.client = APIClient()

        self.admin = Usuario.objects.create_superuser(
            username='admin',
            email='admin@cofralink.com',
            password='Admin123!'
        )
        self.hermano = Usuario.objects.create_user(
            username='hermano1',
            email='hermano1@cofralink.com',
            password='Cofralink123!'
        )

    def _token(self, email, password):
        """Obtiene el JWT access token para un usuario."""
        res = self.client.post('/api/auth/login/', {
            'email': email, 'password': password
        }, format='json')
        return res.data.get('access')

    def _auth(self, email, password):
        """Autentica el cliente con JWT."""
        token = self._token(email, password)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')


class TestLogin(UsuarioTestCase):

    def test_login_correcto(self):
        """Login con credenciales válidas devuelve access y refresh."""
        res = self.client.post('/api/auth/login/', {
            'email': 'admin@cofralink.com',
            'password': 'Admin123!'
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('access', res.data)
        self.assertIn('refresh', res.data)

    def test_login_incorrecto(self):
        """Login con contraseña incorrecta devuelve 401."""
        res = self.client.post('/api/auth/login/', {
            'email': 'admin@cofralink.com',
            'password': 'incorrecta'
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_sin_email(self):
        """Login sin email devuelve 400."""
        res = self.client.post('/api/auth/login/', {
            'password': 'Admin123!'
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)


class TestRateLimiting(TestCase):

    def setUp(self):
        cache.clear()

    def test_login_throttle_admite_intervalos_de_quince_minutos(self):
        throttle = LoginIPThrottle()
        requests, seconds = throttle.parse_rate('5/15minute')
        self.assertEqual(requests, 5)
        self.assertEqual(seconds, 15 * 60)


class TestPerfil(UsuarioTestCase):

    def test_perfil_autenticado(self):
        """GET /perfil/ devuelve los datos del usuario autenticado."""
        self._auth('admin@cofralink.com', 'Admin123!')
        res = self.client.get('/api/auth/perfil/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['email'], 'admin@cofralink.com')

    def test_perfil_sin_token(self):
        """GET /perfil/ sin token devuelve 401."""
        res = self.client.get('/api/auth/perfil/')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


class TestCambioPassword(UsuarioTestCase):

    @override_settings(
            EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend')
    def test_solicitar_cambio_password(self):
        """Solicitar cambio de contraseña 
        devuelve 200 independientemente del email."""
        res = self.client.post('/api/auth/solicitar-cambio-password/', {
            'email': 'hermano1@cofralink.com'
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('mensaje', res.data)

    @override_settings(
            EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend')
    def test_solicitar_cambio_password_email_inexistente(self):
        """Solicitar cambio con email no registrado 
        también devuelve 200 (seguridad)."""
        res = self.client.post('/api/auth/solicitar-cambio-password/', {
            'email': 'noexiste@cofralink.com'
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_confirmar_cambio_password_ok(self):
        """Token válido permite cambiar la contraseña."""
        generator = PasswordResetTokenGenerator()
        token = generator.make_token(self.hermano)
        uid = urlsafe_base64_encode(force_bytes(self.hermano.pk))

        res = self.client.post('/api/auth/confirmar-cambio-password/', {
            'uid':       uid,
            'token':     token,
            'password1': 'NuevaPass123!',
            'password2': 'NuevaPass123!',
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        # Verificar que la nueva contraseña funciona
        self.hermano.refresh_from_db()
        self.assertTrue(self.hermano.check_password('NuevaPass123!'))

    def test_confirmar_cambio_password_no_coinciden(self):
        """Si las contraseñas no coinciden devuelve 400."""
        generator = PasswordResetTokenGenerator()
        token = generator.make_token(self.hermano)
        uid = urlsafe_base64_encode(force_bytes(self.hermano.pk))

        res = self.client.post('/api/auth/confirmar-cambio-password/', {
            'uid':       uid,
            'token':     token,
            'password1': 'NuevaPass123!',
            'password2': 'Diferente456!',
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_confirmar_cambio_password_token_invalido(self):
        """Token falso devuelve 400."""
        uid = urlsafe_base64_encode(force_bytes(self.hermano.pk))
        res = self.client.post('/api/auth/confirmar-cambio-password/', {
            'uid':       uid,
            'token':     'token-falso-invalido',
            'password1': 'NuevaPass123!',
            'password2': 'NuevaPass123!',
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_confirmar_cambio_password_corta(self):
        """Contraseña menor de 8 caracteres devuelve 400."""
        generator = PasswordResetTokenGenerator()
        token = generator.make_token(self.hermano)
        uid = urlsafe_base64_encode(force_bytes(self.hermano.pk))

        res = self.client.post('/api/auth/confirmar-cambio-password/', {
            'uid':       uid,
            'token':     token,
            'password1': 'corta',
            'password2': 'corta',
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)


class TestRegistroSerializer(UsuarioTestCase):

    def test_registro_solo_admin(self):
        """El endpoint de registro solo es accesible para admins."""
        # Intento sin autenticar
        res = self.client.post('/api/auth/registro/', {
            'username':  'nuevo',
            'email':     'nuevo@cofralink.com',
            'password':  'Passphrase#2026!',
            'password2': 'Passphrase#2026!',
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_registro_hermano_no_puede_registrar(self):
        """Un hermano no puede usar el endpoint de registro — 403."""
        self._auth('hermano1@cofralink.com', 'Cofralink123!')
        res = self.client.post('/api/auth/registro/', {
            'username':  'nuevo',
            'email':     'nuevo@cofralink.com',
            'password':  'Passphrase#2026!',
            'password2': 'Pass1234!',
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_registro_admin_puede_crear_usuario(self):
        """Admin puede crear un usuario a través del endpoint de registro."""
        self._auth('admin@cofralink.com', 'Admin123!')
        res = self.client.post('/api/auth/registro/', {
            'username':  'nuevousuario',
            'email':     'nuevousuario@cofralink.com',
            'password':  'Passphrase#2026!',
            'password2': 'Passphrase#2026!',
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Usuario.objects.filter(
            email='nuevousuario@cofralink.com').exists())

    def test_registro_contrasenas_no_coinciden(self):
        """Admin intenta crear usuario con contraseñas distintas — 400."""
        self._auth('admin@cofralink.com', 'Admin123!')
        res = self.client.post('/api/auth/registro/', {
            'username':  'fallido',
            'email':     'fallido@cofralink.com',
            'password':  'Pass1234!',
            'password2': 'Diferente99!',
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(Usuario.objects.filter(
            email='fallido@cofralink.com').exists())

    def test_registro_email_duplicado(self):
        """Admin intenta registrar un email ya existente — 400."""
        self._auth('admin@cofralink.com', 'Admin123!')
        res = self.client.post('/api/auth/registro/', {
            'username':  'duplicado',
            'email':     'hermano1@cofralink.com',  # ya existe
            'password':  'Pass1234!',
            'password2': 'Pass1234!',
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_perfil_actualizar_email(self):
        """Usuario autenticado puede actualizar su email desde el perfil."""
        self._auth('hermano1@cofralink.com', 'Cofralink123!')
        res = self.client.patch('/api/auth/perfil/', {
            'email': 'actualizado@cofralink.com'
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.hermano.refresh_from_db()
        self.assertEqual(self.hermano.email, 'actualizado@cofralink.com')
