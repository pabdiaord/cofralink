from django.db import models
from apps.usuarios.models import Usuario


class Conversacion(models.Model):
    """Una conversación privada entre un hermano y la junta."""
    hermano = models.OneToOneField(
        Usuario, on_delete=models.CASCADE, related_name='conversacion'
    )
    creada_en = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Conversación con {self.hermano.email}"


class MensajePrivado(models.Model):
    """Mensaje dentro de una conversación privada."""
    conversacion = models.ForeignKey(
        Conversacion, on_delete=models.CASCADE, related_name='mensajes'
    )
    remitente = models.ForeignKey(
        Usuario, on_delete=models.CASCADE, related_name='mensajes_privados'
    )
    contenido = models.TextField()
    fecha = models.DateTimeField(auto_now_add=True)
    leido = models.BooleanField(default=False)

    class Meta:
        ordering = ['fecha']


class MensajeGeneral(models.Model):
    """Mensaje del chat general visible para todos los hermanos."""
    autor = models.ForeignKey(
        Usuario, on_delete=models.CASCADE, related_name='mensajes_generales'
    )
    contenido = models.TextField()
    fecha = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['fecha']

    def __str__(self):
        return f"{self.autor.email}: {self.contenido[:40]}"


class ReaccionMensaje(models.Model):
    mensaje  = models.ForeignKey(
        MensajeGeneral, on_delete=models.CASCADE, related_name='reacciones'
    )
    usuario  = models.ForeignKey(
        Usuario, on_delete=models.CASCADE, related_name='reacciones'
    )
    emoji    = models.CharField(max_length=10)

    class Meta:
        unique_together = ('mensaje', 'usuario')  # una reacción por usuario y mensaje

    def __str__(self):
        return f"{self.usuario.email} → {self.emoji} en msg {self.mensaje.id}"