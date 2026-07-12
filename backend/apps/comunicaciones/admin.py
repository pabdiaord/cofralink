from django.contrib import admin
from .models import Conversacion, MensajePrivado, MensajeGeneral

@admin.register(Conversacion)
class ConversacionAdmin(admin.ModelAdmin):
    list_display = ('hermano', 'creada_en')
    search_fields = ('hermano__email',)

@admin.register(MensajePrivado)
class MensajePrivadoAdmin(admin.ModelAdmin):
    list_display = ('conversacion', 'remitente', 'fecha', 'leido')
    list_filter = ('leido',)
    ordering = ('-fecha',)

@admin.register(MensajeGeneral)
class MensajeGeneralAdmin(admin.ModelAdmin):
    list_display = ('autor', 'contenido', 'fecha')
    ordering = ('-fecha',)