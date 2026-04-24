from django.contrib.auth.models import AbstractUser
from django.db import models


class Usuario(AbstractUser):
    ROL_CHOICES = [
        ('hermano', 'Hermano'),
        ('admin',   'Administrador / Junta de Gobierno'),
    ]

    nombre = models.CharField(max_length=100)
    apellidos = models.CharField(max_length=150)
    direccion = models.CharField(max_length=255, blank=True)
    fecha_ingreso = models.DateField(null=True, blank=True)
    numero_hermano = models.PositiveIntegerField(unique=True, 
                                                 null=True, blank=True)
    rol = models.CharField(max_length=10, 
                           choices=ROL_CHOICES, default='hermano')
    activo = models.BooleanField(default=False)  # el admin activa la cuenta

    def __str__(self):
        return f"{self.numero_hermano} – {self.get_full_name()}"
