from django.db import models
from apps.hermanos.models import Hermano

class Mensaje(models.Model):
    ESTADO_CHOICES = [
        ('enviado',    'Enviado'),
        ('leido',      'Leído'),
        ('respondido', 'Respondido'),
    ]
    hermano   = models.ForeignKey(
                    Hermano, on_delete=models.CASCADE,
                    related_name='mensajes'
                )
    asunto    = models.CharField(max_length=255)
    fecha     = models.DateTimeField(auto_now_add=True)
    contenido = models.TextField()
    estado    = models.CharField(
                    max_length=20,
                    choices=ESTADO_CHOICES,
                    default='enviado'
                )

    class Meta:
        ordering = ['-fecha']

    def __str__(self):
        return f"{self.hermano} – {self.asunto}"