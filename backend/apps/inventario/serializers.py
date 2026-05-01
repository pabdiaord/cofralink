from rest_framework import serializers
from .models import Imagen, Enser, Util

class ImagenSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Imagen
        fields = (
            'id', 'nombre', 'tipo_objeto',
            'fecha_realizacion', 'fecha_ultima_restauracion',
            'conservacion', 'lugar_culto',
        )

class EnserSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Enser
        fields = (
            'id', 'nombre', 'tipo_objeto',
            'fecha_realizacion', 'fecha_ultima_restauracion',
            'conservacion', 'ubicacion',
        )

class UtilSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Util
        fields = ('id', 'nombre', 'tipo_objeto', 'ubicacion', 'cantidad')