from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Conversacion, MensajePrivado, MensajeGeneral
from .serializers import (
    ConversacionSerializer, MensajePrivadoSerializer, MensajeGeneralSerializer
)


class ConversacionViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ConversacionSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Conversacion.objects.all().order_by('-creada_en')
        return Conversacion.objects.filter(hermano=user)

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
    queryset = MensajeGeneral.objects.all().order_by('fecha')
    http_method_names = ['get', 'post', 'delete']

    def perform_create(self, serializer):
        serializer.save(autor=self.request.user)

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx

    def destroy(self, request, *args, **kwargs):
        msg = self.get_object()
        if msg.autor != request.user and not request.user.is_staff:
            return Response({'error': 'Sin permiso.'}, status=403)
        return super().destroy(request, *args, **kwargs)