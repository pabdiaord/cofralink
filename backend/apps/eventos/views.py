from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Evento, Inscripcion
from .serializers import EventoSerializer, InscripcionSerializer
from apps.hermanos.models import Hermano

class EsAdminOSoloLectura(permissions.BasePermission):
    """Admin puede todo; hermanos solo lectura."""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_staff

class EventoViewSet(viewsets.ModelViewSet):
    queryset           = Evento.objects.all().order_by('fecha')
    serializer_class   = EventoSerializer
    permission_classes = [EsAdminOSoloLectura]

    def perform_create(self, serializer):
        serializer.save()

    # Endpoint extra: POST /eventos/{id}/inscribirse/
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def inscribirse(self, request, pk=None):
        evento = self.get_object()
        try:
            hermano = request.user.hermano
        except Hermano.DoesNotExist:
            return Response({'error': 'El usuario no tiene perfil de hermano.'}, status=400)

        inscripcion, creada = Inscripcion.objects.get_or_create(
            hermano=hermano, evento=evento,
            defaults={'estado': 'confirmada'}
        )
        if not creada:
            return Response({'error': 'Ya estás inscrito en este evento.'}, status=400)

        return Response(InscripcionSerializer(inscripcion).data, status=201)

    # Endpoint extra: GET /eventos/{id}/inscritos/  (solo admin)
    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAdminUser])
    def inscritos(self, request, pk=None):
        evento        = self.get_object()
        inscripciones = evento.inscripciones.filter(estado='confirmada')
        return Response(InscripcionSerializer(inscripciones, many=True).data)