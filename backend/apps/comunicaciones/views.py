from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import F, Max
from .models import Conversacion, MensajePrivado, MensajeGeneral, ReaccionMensaje
from .serializers import (
    ConversacionSerializer, MensajePrivadoSerializer, MensajeGeneralSerializer
)


class ConversacionViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ConversacionSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Conversacion.objects.annotate(
                ultima_actividad=Max('mensajes__fecha')
            ).order_by(
                F('ultima_actividad').desc(nulls_last=True), '-creada_en'
            )
        return Conversacion.objects.filter(hermano=user).annotate(
            ultima_actividad=Max('mensajes__fecha')
        ).order_by(F('ultima_actividad').desc(nulls_last=True), '-creada_en')

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx

    @action(detail=True, methods=['get'])
    def mensajes(self, request, pk=None):
        conv = self.get_object()
        # Marcar como leídos los mensajes del hermano al leerlos el admin
        if request.user.is_staff:
            conv.mensajes.filter(leido=False).exclude(
                remitente=request.user
            ).update(leido=True)
        serializer = MensajePrivadoSerializer(
            conv.mensajes.all(), many=True, context={'request': request}
        )
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def enviar(self, request, pk=None):
        conv = self.get_object()
        contenido = request.data.get('contenido', '').strip()
        if not contenido:
            return Response(
                {'error': 'El mensaje no puede estar vacío.'},
                status=400
            )
        msg = MensajePrivado.objects.create(
            conversacion=conv,
            remitente=request.user,
            contenido=contenido,
        )
        return Response(
            MensajePrivadoSerializer(msg, context={'request': request}).data,
            status=201
        )


class MiConversacionView(APIView):
    """El hermano accede a su conversación privada con la junta."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        conv, _ = Conversacion.objects.get_or_create(hermano=request.user)
        return Response(
            ConversacionSerializer(conv, context={'request': request}).data)

    def post(self, request):
        conv, _ = Conversacion.objects.get_or_create(hermano=request.user)
        contenido = request.data.get('contenido', '').strip()
        if not contenido:
            return Response({'error': 'El mensaje no puede estar vacío.'}, 
                            status=400)
        msg = MensajePrivado.objects.create(
            conversacion=conv,
            remitente=request.user,
            contenido=contenido,
        )
        return Response(
            MensajePrivadoSerializer(msg, context={'request': request}).data,
            status=201
        )


class MensajeGeneralViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = MensajeGeneralSerializer
    queryset = MensajeGeneral.objects.prefetch_related('reacciones').all().order_by('fecha')
    http_method_names = ['get', 'post', 'delete']

    def perform_create(self, serializer):
        serializer.save(autor=self.request.user)

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx

    def create(self, request, *args, **kwargs):
        # Solo el admin puede publicar mensajes generales
        if not request.user.is_staff:
            return Response(
                {'error': 'Solo la Junta de Gobierno puede publicar en el canal general.'},
                status=403
            )
        return super().create(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        msg = self.get_object()
        if msg.autor != request.user and not request.user.is_staff:
            return Response({'error': 'Sin permiso.'}, status=403)
        return super().destroy(request, *args, **kwargs)


class ReaccionView(APIView):
    """Añade, cambia o elimina la reacción del usuario a un mensaje general."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, mensaje_id):
        emoji = request.data.get('emoji', '').strip()
        if not emoji:
            return Response({'error': 'Emoji requerido.'}, status=400)
        try:
            mensaje = MensajeGeneral.objects.get(id=mensaje_id)
        except MensajeGeneral.DoesNotExist:
            return Response({'error': 'Mensaje no encontrado.'}, status=404)

        reaccion, creada = ReaccionMensaje.objects.get_or_create(
            mensaje=mensaje, usuario=request.user,
            defaults={'emoji': emoji}
        )

        if not creada:
            if reaccion.emoji == emoji:
                # Misma reacción → quitarla (toggle)
                reaccion.delete()
                return Response({'reaccion': None}, status=200)
            else:
                # Cambiar emoji
                reaccion.emoji = emoji
                reaccion.save()

        return Response({'reaccion': reaccion.emoji}, status=200)
