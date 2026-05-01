from django.contrib import admin
from .models import Hermano

@admin.register(Hermano)
class HermanoAdmin(admin.ModelAdmin):
    list_display  = ('numero_hermano', 'nombre', 'apellidos', 'caracter', 'estado_cuota')
    list_filter   = ('estado_cuota', 'caracter')
    search_fields = ('nombre', 'apellidos', 'numero_hermano')
    ordering      = ('numero_hermano',)
