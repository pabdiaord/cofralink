from rest_framework import serializers
from .models import Publicacion

class PublicacionSerializer(serializers.ModelSerializer):
    hermano_nombre = serializers.CharField(source='hermano.nombre', read_only=True)

    class Meta:
        model  = Publicacion
        fields = ('id', 'titular', 'descripcion', 'imagen', 'fecha', 'hermano', 'hermano_nombre')
        read_only_fields = ('hermano', 'fecha')