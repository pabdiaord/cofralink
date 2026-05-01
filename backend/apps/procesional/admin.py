from django.contrib import admin
from .models import Papeleta

@admin.register(Papeleta)
class PapeletaAdmin(admin.ModelAdmin):
    list_display  = ('usuario', 'paso', 'tramo', 'fecha')
    search_fields = ('usuario__email', 'paso', 'tramo')
    ordering      = ('-fecha',)
