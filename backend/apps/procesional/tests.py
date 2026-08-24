from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from apps.usuarios.models import Usuario
from apps.hermanos.models import Hermano
from .models import Papeleta


class PapeletaTestCase(TestCase):

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
            usuario=self.usuario_hermano, nombre='Carlos', apellidos='Ruiz',
            numero_hermano=2, estado_cuota='PAGADO', caracter='NAZARENO'
        )

        self.papeleta = Papeleta.objects.create(
            usuario=self.usuario_hermano,
            paso='Paso del Cristo',
            fecha='2027-03-23',
            tramo='Tramo 5',
            estado='pendiente',
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


class TestPapeletas(PapeletaTestCase):

    def test_solicitar_papeleta(self):
        """Hermano puede solicitar una papeleta — 201 con estado pendiente."""
        self._auth_hermano()
        res = self.client.post('/api/papeletas/', {
            'paso':  'Paso de Palio',
            'fecha': '2027-03-23',
            'tramo': 'Tramo 1',
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['estado'], 'pendiente')

    def test_listar_papeletas_admin(self):
        """Admin ve todas las papeletas."""
        self._auth_admin()
        res = self.client.get('/api/papeletas/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(res.data), 1)

    def test_listar_papeletas_hermano(self):
        """Hermano solo ve sus propias papeletas."""
        # Crear papeleta de otro hermano
        otro = Usuario.objects.create_user(
            username='otro', email='otro@cofralink.com', 
            password='Cofralink123!'
        )
        Hermano.objects.create(
            usuario=otro, nombre='Otro', apellidos='Hermano',
            numero_hermano=99, estado_cuota='NO_PAGADO', caracter='COSTALERO'
        )
        Papeleta.objects.create(
            usuario=otro, paso='Otro paso',
            fecha='2027-03-23', tramo='Tramo 9',
        )
        self._auth_hermano()
        res = self.client.get('/api/papeletas/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        emails = [p['usuario_email'] for p in res.data]
        self.assertTrue(all(e == 'hermano1@cofralink.com' for e in emails))

    def test_aprobar_papeleta(self):
        """Admin puede aprobar una papeleta."""
        self._auth_admin()
        res = self.client.patch(f'/api/papeletas/{self.papeleta.id}/', {
            'estado': 'aprobada'
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.papeleta.refresh_from_db()
        self.assertEqual(self.papeleta.estado, 'aprobada')

    def test_rechazar_papeleta(self):
        """Admin puede rechazar una papeleta."""
        self._auth_admin()
        res = self.client.patch(f'/api/papeletas/{self.papeleta.id}/', {
            'estado': 'rechazada'
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.papeleta.refresh_from_db()
        self.assertEqual(self.papeleta.estado, 'rechazada')

    def test_eliminar_papeleta(self):
        """Admin puede eliminar una papeleta."""
        self._auth_admin()
        res = self.client.delete(f'/api/papeletas/{self.papeleta.id}/')
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Papeleta.objects.filter(id=self.papeleta.id).exists())

    def test_papeleta_sin_auth(self):
        """Sin autenticar devuelve 401."""
        res = self.client.get('/api/papeletas/')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
