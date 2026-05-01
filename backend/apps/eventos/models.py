from django.db import models
from apps.hermanos.models import Hermano

class TipoEvento(models.TextChoices):
    CULTO    = 'CULTO',    'Culto'
    ENSAYO   = 'ENSAYO',   'Ensayo'
    REUNION  = 'REUNION',  'Reunión'
    PRIOSTIA = 'PRIOSTIA', 'Priostía'

class Evento(models.Model):
    nombre_evento = models.CharField(max_length=200)
    tipo_evento   = models.CharField(max_length=20, choices=TipoEvento.choices)
    fecha         = models.DateTimeField()
    lugar         = models.CharField(max_length=255)
    descripcion   = models.TextField(blank=True)

    def __str__(self):
        return f"{self.nombre_evento} ({self.fecha.strftime('%d/%m/%Y')})"

class Inscripcion(models.Model):
    ESTADO_CHOICES = [
        ('confirmada', 'Confirmada'),
        ('cancelada',  'Cancelada'),
        ('pendiente',  'Pendiente'),
    ]
    hermano          = models.ForeignKey(
                           Hermano, on_delete=models.CASCADE,
                           related_name='inscripciones'
                       )
    evento           = models.ForeignKey(
                           Evento, on_delete=models.CASCADE,
                           related_name='inscripciones'
                       )
    estado           = models.CharField(
                           max_length=20,
                           choices=ESTADO_CHOICES,
                           default='pendiente'
                       )
    fecha_inscripcion = models.DateField(auto_now_add=True)

    class Meta:
        unique_together = ('hermano', 'evento')

    def __str__(self):
        return f"{self.hermano} → {self.evento}"