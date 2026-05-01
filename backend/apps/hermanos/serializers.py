from rest_framework import serializers
from .models import Hermano

class HermanoSerializer(serializers.ModelSerializer):
    usuario_email = serializers.EmailField(source='usuario.email', read_only=True)

    class Meta:
        model  = Hermano
        fields = (
            'id', 'usuario', 'usuario_email',
            'nombre', 'apellidos', 'direccion',
            'fecha_ingreso', 'numero_hermano',
            'estado_cuota', 'caracter',
        )
        read_only_fields = ('usuario',)