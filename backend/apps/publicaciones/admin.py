from django.contrib import admin
from .models import Publicacion

@admin.register(Publicacion)
class PublicacionAdmin(admin.ModelAdmin):
    list_display  = ('titular', 'hermano', 'fecha')
    search_fields = ('titular',)
    ordering      = ('-fecha',)