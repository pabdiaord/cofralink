import uuid

from django.conf import settings
from django.db import models
from django.db.models import Q


class TipoHucha(models.TextChoices):
    GENERAL = 'GENERAL', 'Hucha general'
    PROYECTO = 'PROYECTO', 'Proyecto'


class EstadoDonacion(models.TextChoices):
    PENDIENTE = 'PENDIENTE', 'Pendiente'
    PAGADA = 'PAGADA', 'Pagada'
    FALLIDA = 'FALLIDA', 'Fallida'
    CANCELADA = 'CANCELADA', 'Cancelada'
    REEMBOLSADA = 'REEMBOLSADA', 'Reembolsada'


class Hucha(models.Model):
    """Destino de una donación: la hucha principal o un proyecto concreto."""

    nombre = models.CharField(max_length=150)
    descripcion = models.TextField(blank=True)
    tipo = models.CharField(max_length=10, choices=TipoHucha.choices)
    objetivo_centimos = models.PositiveIntegerField(null=True, blank=True)
    activa = models.BooleanField(default=True)
    creada_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name='huchas_creadas',
        null=True,
        blank=True,
    )
    creada_en = models.DateTimeField(auto_now_add=True)
    cerrada_en = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ('tipo', '-creada_en')
        constraints = [
            models.UniqueConstraint(
                fields=('tipo',),
                condition=Q(tipo=TipoHucha.GENERAL),
                name='una_unica_hucha_general',
            ),
        ]

    def __str__(self):
        return self.nombre


class Donacion(models.Model):
    """Intento de donación local, confirmado exclusivamente por un webhook."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    donante = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='donaciones',
    )
    hucha = models.ForeignKey(
        Hucha,
        on_delete=models.PROTECT,
        related_name='donaciones',
    )
    importe_centimos = models.PositiveIntegerField()
    moneda = models.CharField(max_length=3, default='eur')
    estado = models.CharField(
        max_length=15,
        choices=EstadoDonacion.choices,
        default=EstadoDonacion.PENDIENTE,
    )
    stripe_checkout_session_id = models.CharField(
        max_length=255,
        unique=True,
        null=True,
        blank=True,
    )
    stripe_payment_intent_id = models.CharField(
        max_length=255,
        unique=True,
        null=True,
        blank=True,
    )
    error_codigo = models.CharField(max_length=100, blank=True)
    creada_en = models.DateTimeField(auto_now_add=True)
    actualizada_en = models.DateTimeField(auto_now=True)
    pagada_en = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ('-creada_en',)
        constraints = [
            models.CheckConstraint(
                condition=Q(importe_centimos__gte=100),
                name='donacion_importe_minimo_un_euro',
            ),
        ]

    def __str__(self):
        return (
            f'{self.hucha} - {self.importe_centimos} céntimos ({self.estado})'
        )


class EventoStripe(models.Model):
    """Registro idempotente de los eventos recibidos desde Stripe Sandbox."""

    stripe_event_id = models.CharField(max_length=255, unique=True)
    tipo = models.CharField(max_length=100)
    procesado = models.BooleanField(default=False)
    error = models.CharField(max_length=255, blank=True)
    recibido_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ('-recibido_en',)

    def __str__(self):
        return f'{self.tipo} ({self.stripe_event_id})'
