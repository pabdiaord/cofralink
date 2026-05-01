from django.db import models
from apps.hermanos.models import Hermano

class Papeleta(models.Model):
    usuario = models.ForeignKey(
                  'usuarios.Usuario',
                  on_delete=models.CASCADE,
                  related_name='papeletas'
              )
    paso    = models.CharField(max_length=100)
    fecha   = models.DateField()
    tramo   = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.usuario} – {self.paso} ({self.fecha})"
