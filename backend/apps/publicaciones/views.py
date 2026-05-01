from django.shortcuts import render
from rest_framework import viewsets, permissions
from .models import Publicacion
from .serializers import PublicacionSerializer
from apps.hermanos.models import Hermano

class EsAdminOSoloLectura(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_staff

class PublicacionViewSet(viewsets.ModelViewSet):
    queryset           = Publicacion.objects.all()
    serializer_class   = PublicacionSerializer
    permission_classes = [EsAdminOSoloLectura]

    def perform_create(self, serializer):
        # Asigna automáticamente el hermano del usuario autenticado
        hermano = Hermano.objects.get(usuario=self.request.user)
        serializer.save(hermano=hermano)