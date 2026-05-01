from django.contrib import admin
from .models import Evento, Inscripcion

@admin.register(Evento)
class EventoAdmin(admin.ModelAdmin):
    list_display  = ('nombre_evento', 'tipo_evento', 'fecha', 'lugar')
    list_filter   = ('tipo_evento',)
    search_fields = ('nombre_evento', 'lugar')
    ordering      = ('-fecha',)

@admin.register(Inscripcion)
class InscripcionAdmin(admin.ModelAdmin):
    list_display  = ('hermano', 'evento', 'estado', 'fecha_inscripcion')
    list_filter   = ('estado',)
    search_fields = ('hermano__nombre', 'evento__nombre_evento')