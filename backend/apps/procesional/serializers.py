from rest_framework import serializers
from .models import Papeleta

class PapeletaSerializer(serializers.ModelSerializer):
    usuario_email = serializers.EmailField(source='usuario.email', read_only=True)

    class Meta:
        model  = Papeleta
        fields = ('id', 'usuario', 'usuario_email', 'paso', 'fecha', 'tramo', 'estado')
        read_only_fields = ('usuario',)