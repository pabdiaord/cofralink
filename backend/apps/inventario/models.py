from django.db import models

class TipoObjeto(models.TextChoices):
    IMAGEN = 'IMAGEN', 'Imagen devocional'
    ENSER  = 'ENSER',  'Enser'
    UTIL   = 'UTIL',   'Útil'

class Objeto(models.Model):
    nombre      = models.CharField(max_length=200)
    tipo_objeto = models.CharField(max_length=10, choices=TipoObjeto.choices)

    class Meta:
        abstract = True  # ← herencia abstracta: no genera tabla propia

    def __str__(self):
        return f"[{self.tipo_objeto}] {self.nombre}"

class Imagen(Objeto):
    fecha_realizacion        = models.DateField(null=True, blank=True)
    fecha_ultima_restauracion = models.DateField(null=True, blank=True)
    conservacion             = models.CharField(max_length=255, blank=True)
    lugar_culto              = models.CharField(max_length=255, blank=True)

class Enser(Objeto):
    fecha_realizacion        = models.DateField(null=True, blank=True)
    fecha_ultima_restauracion = models.DateField(null=True, blank=True)
    conservacion             = models.CharField(max_length=255, blank=True)
    ubicacion                = models.CharField(max_length=255, blank=True)

class Util(Objeto):
    ubicacion = models.CharField(max_length=255, blank=True)
    cantidad  = models.PositiveIntegerField(default=1)