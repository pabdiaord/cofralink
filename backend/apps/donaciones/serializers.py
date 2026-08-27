from django.db.models import Sum
from rest_framework import serializers

from .models import Donacion, EstadoDonacion, Hucha, TipoHucha


class HuchaSerializer(serializers.ModelSerializer):
    recaudado_centimos = serializers.SerializerMethodField()
    numero_donaciones = serializers.SerializerMethodField()
    objetivo_alcanzado = serializers.SerializerMethodField()

    class Meta:
        model = Hucha
        fields = (
            'id', 'nombre', 'descripcion', 'tipo',
            'objetivo_centimos', 'activa',
            'creada_por', 'creada_en', 'cerrada_en', 'recaudado_centimos',
            'numero_donaciones', 'objetivo_alcanzado',
        )
        read_only_fields = (
            'tipo', 'creada_por', 'creada_en',
            'cerrada_en', 'recaudado_centimos',
            'numero_donaciones', 'objetivo_alcanzado',
        )

    def get_recaudado_centimos(self, obj):
        if hasattr(obj, 'recaudado_centimos'):
            return obj.recaudado_centimos or 0
        return obj.donaciones.filter(estado=EstadoDonacion.PAGADA).aggregate(
            total=Sum('importe_centimos')
        )['total'] or 0

    def get_numero_donaciones(self, obj):
        if hasattr(obj, 'numero_donaciones'):
            return obj.numero_donaciones or 0
        return obj.donaciones.filter(estado=EstadoDonacion.PAGADA).count()

    def get_objetivo_alcanzado(self, obj):
        if obj.objetivo_centimos is None:
            return False
        return self.get_recaudado_centimos(obj) >= obj.objetivo_centimos

    def validate_objetivo_centimos(self, value):
        if value is not None and value < 100:
            raise serializers.ValidationError(
                'El objetivo  debe ser de al menos 1,00 €.'
            )
        return value


class HuchaAdminSerializer(HuchaSerializer):
    class Meta(HuchaSerializer.Meta):
        read_only_fields = (
            'tipo', 'creada_por', 'creada_en',
            'cerrada_en', 'recaudado_centimos',
            'numero_donaciones', 'objetivo_alcanzado',
        )

    def create(self, validated_data):
        return Hucha.objects.create(tipo=TipoHucha.PROYECTO, **validated_data)


class CrearCheckoutSerializer(serializers.Serializer):
    hucha_id = serializers.PrimaryKeyRelatedField(
        source='hucha', queryset=Hucha.objects.filter(activa=True)
    )
    importe_centimos = serializers.IntegerField(min_value=100,
                                                max_value=1_000_000)


class DonacionSerializer(serializers.ModelSerializer):
    hucha_nombre = serializers.CharField(source='hucha.nombre', read_only=True)
    donante_email = serializers.EmailField(source='donante.email',
                                           read_only=True)

    class Meta:
        model = Donacion
        fields = (
            'id', 'hucha', 'hucha_nombre', 'importe_centimos',
            'moneda', 'estado',
            'creada_en', 'actualizada_en', 'pagada_en', 'donante_email',
        )
        read_only_fields = fields
