from django.db import models
from apps.usuarios.models import Usuario

class EstadoCuota(models.TextChoices):
    PAGADO     = 'PAGADO',     'Pagado'
    NO_PAGADO  = 'NO_PAGADO',  'No pagado'

class CaracterHermano(models.TextChoices):
    NAZARENO      = 'NAZARENO',      'Nazareno'
    COSTALERO     = 'COSTALERO',     'Costalero'
    MIEMBRO_JUNTA = 'MIEMBRO_JUNTA', 'Miembro de Junta'

class Hermano(models.Model):
    usuario        = models.OneToOneField(
                         Usuario, on_delete=models.CASCADE, related_name='hermano'
                     )
    nombre         = models.CharField(max_length=100)
    apellidos      = models.CharField(max_length=150)
    direccion      = models.CharField(max_length=255, blank=True)
    telefono       = models.CharField(max_length=20, blank=True)
    fecha_ingreso  = models.DateField(null=True, blank=True)
    numero_hermano = models.PositiveIntegerField(unique=True)
    estado_cuota   = models.CharField(
                         max_length=20,
                         choices=EstadoCuota.choices,
                         default=EstadoCuota.NO_PAGADO
                     )
    caracter       = models.CharField(
                         max_length=20,
                         choices=CaracterHermano.choices,
                         blank=True
                     )

    def __str__(self):
        return f"{self.numero_hermano} – {self.nombre} {self.apellidos}"
