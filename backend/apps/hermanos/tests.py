from django.test import TestCase
from apps.usuarios.models import Usuario
from .models import Hermano
from .views import HermanoViewSet


class HermanoDeletionTests(TestCase):
	def test_deleting_hermano_deletes_assigned_usuario(self):
		usuario = Usuario.objects.create_user(
			username='hermano1',
			email='hermano1@example.com',
			password='password123',
		)
		hermano = Hermano.objects.create(
			usuario=usuario,
			nombre='Juan',
			apellidos='Pérez',
			numero_hermano=1,
		)

		HermanoViewSet().perform_destroy(hermano)

		self.assertFalse(Hermano.objects.filter(pk=hermano.pk).exists())
		self.assertFalse(Usuario.objects.filter(pk=usuario.pk).exists())
