from rest_framework import serializers
from .models import Evento, Inscripcion

class EventoSerializer(serializers.ModelSerializer):
    total_inscritos = serializers.SerializerMethodField()

    class Meta:
        model  = Evento
        fields = (
            'id', 'nombre_evento', 'tipo_evento',
            'fecha', 'lugar', 'descripcion', 'total_inscritos',
        )

    def get_total_inscritos(self, obj):
        return obj.inscripciones.filter(estado='confirmada').count()

class InscripcionSerializer(serializers.ModelSerializer):
    hermano_nombre = serializers.CharField(source='hermano.nombre', read_only=True)
    evento_nombre  = serializers.CharField(source='evento.nombre_evento', read_only=True)

    class Meta:
        model  = Inscripcion
        fields = ('id', 'hermano', 'hermano_nombre', 'evento', 'evento_nombre', 'estado', 'fecha_inscripcion')
        read_only_fields = ('hermano', 'fecha_inscripcion')