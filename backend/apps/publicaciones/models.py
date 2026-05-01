from django.db import models
from apps.hermanos.models import Hermano

class Publicacion(models.Model):
    hermano     = models.ForeignKey(
                      Hermano, on_delete=models.CASCADE,
                      related_name='publicaciones'
                  )
    titular     = models.CharField(max_length=255)
    fecha       = models.DateField(auto_now_add=True)
    descripcion = models.TextField(blank=True)
    imagen      = models.ImageField(upload_to='publicaciones/', blank=True, null=True)

    class Meta:
        ordering = ['-fecha']

    def __str__(self):
        return self.titular