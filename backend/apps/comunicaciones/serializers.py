from rest_framework import serializers
from .models import Conversacion, MensajePrivado, MensajeGeneral, ReaccionMensaje


class ReaccionSerializer(serializers.ModelSerializer):
    usuario_email = serializers.EmailField(source='usuario.email', read_only=True)

    class Meta:
        model  = ReaccionMensaje
        fields = ('id', 'usuario', 'usuario_email', 'emoji')


class MensajePrivadoSerializer(serializers.ModelSerializer):
    remitente_email = serializers.EmailField(source='remitente.email', 
                                             read_only=True)
    es_mio = serializers.SerializerMethodField()

    class Meta:
        model = MensajePrivado
        fields = ('id', 'conversacion', 'remitente', 'remitente_email',
                  'contenido', 'fecha', 'leido', 'es_mio')
        read_only_fields = ('remitente', 'fecha')

    def get_es_mio(self, obj):
        request = self.context.get('request')
        return request and obj.remitente_id == request.user.id


class ConversacionSerializer(serializers.ModelSerializer):
    hermano_email = serializers.EmailField(source='hermano.email', 
                                           read_only=True)
    hermano_nombre = serializers.SerializerMethodField()
    ultimo_mensaje = serializers.SerializerMethodField()
    no_leidos = serializers.SerializerMethodField()

    class Meta:
        model = Conversacion
        fields = ('id', 'hermano', 'hermano_email', 'hermano_nombre',
                  'creada_en', 'ultimo_mensaje', 'no_leidos')

    def get_hermano_nombre(self, obj):
        try:
            h = obj.hermano.hermano
            return f"{h.nombre} {h.apellidos}"
        except:
            return obj.hermano.email

    def get_ultimo_mensaje(self, obj):
        ultimo = obj.mensajes.last()
        if ultimo:
            return {'contenido': ultimo.contenido[:60], 
                    'fecha': str(ultimo.fecha)}
        return None

    def get_no_leidos(self, obj):
        request = self.context.get('request')
        if request and request.user.is_staff:
            return obj.mensajes.filter(leido=False).exclude(
                remitente=request.user
            ).count()
        return 0


class MensajeGeneralSerializer(serializers.ModelSerializer):
    autor_email   = serializers.EmailField(source='autor.email', read_only=True)
    autor_nombre  = serializers.SerializerMethodField()
    es_mio        = serializers.SerializerMethodField()
    reacciones    = serializers.SerializerMethodField()
    mi_reaccion   = serializers.SerializerMethodField()

    class Meta:
        model  = MensajeGeneral
        fields = ('id', 'autor', 'autor_email', 'autor_nombre',
                  'contenido', 'fecha', 'es_mio', 'reacciones', 'mi_reaccion')
        read_only_fields = ('autor', 'fecha')

    def get_autor_nombre(self, obj):
        try:
            h = obj.autor.hermano
            return f"{h.nombre} {h.apellidos}"
        except:
            return obj.autor.email

    def get_es_mio(self, obj):
        request = self.context.get('request')
        return request and obj.autor_id == request.user.id

    def get_reacciones(self, obj):
        # Agrupa reacciones por emoji: {'❤️': 3, '👏': 1}
        reacciones = {}
        for r in obj.reacciones.all():
            reacciones[r.emoji] = reacciones.get(r.emoji, 0) + 1
        return reacciones

    def get_mi_reaccion(self, obj):
        request = self.context.get('request')
        if not request:
            return None
        r = obj.reacciones.filter(usuario=request.user).first()
        return r.emoji if r else None