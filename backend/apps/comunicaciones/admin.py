from django.contrib import admin
from .models import Mensaje

@admin.register(Mensaje)
class MensajeAdmin(admin.ModelAdmin):
    list_display  = ('hermano', 'asunto', 'estado', 'fecha')
    list_filter   = ('estado',)
    search_fields = ('hermano__nombre', 'asunto')
    ordering      = ('-fecha',)
