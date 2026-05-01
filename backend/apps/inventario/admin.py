from django.contrib import admin
from .models import Imagen, Enser, Util

@admin.register(Imagen)
class ImagenAdmin(admin.ModelAdmin):
    list_display  = ('nombre', 'conservacion', 'lugar_culto', 'fecha_realizacion')
    search_fields = ('nombre',)

@admin.register(Enser)
class EnserAdmin(admin.ModelAdmin):
    list_display  = ('nombre', 'conservacion', 'ubicacion', 'fecha_realizacion')
    search_fields = ('nombre',)

@admin.register(Util)
class UtilAdmin(admin.ModelAdmin):
    list_display  = ('nombre', 'ubicacion', 'cantidad')
    search_fields = ('nombre',)