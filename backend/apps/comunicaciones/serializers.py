from rest_framework import serializers
from .models import Mensaje

class MensajeSerializer(serializers.ModelSerializer):
    hermano_nombre = serializers.CharField(source='hermano.nombre', read_only=True)

    class Meta:
        model  = Mensaje
        fields = ('id', 'hermano', 'hermano_nombre', 'asunto', 'contenido', 'estado', 'fecha')
        read_only_fields = ('hermano', 'fecha')