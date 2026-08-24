from rest_framework import serializers
from .models import Papeleta

class PapeletaSerializer(serializers.ModelSerializer):
    usuario_email = serializers.EmailField(source='usuario.email', read_only=True)

    class Meta:
        model  = Papeleta
        fields = ('id', 'usuario', 'usuario_email', 'paso', 'fecha', 'tramo', 'estado')
        # El solicitante nunca decide el resultado de su propia papeleta.
        read_only_fields = ('usuario', 'estado')


class PapeletaAdminSerializer(PapeletaSerializer):
    """Serializer de gestión reservado para la Junta de Gobierno."""

    class Meta(PapeletaSerializer.Meta):
        read_only_fields = ('usuario',)
