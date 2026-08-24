from django.shortcuts import render
from rest_framework import viewsets, permissions
from .models import Papeleta
from .serializers import PapeletaAdminSerializer, PapeletaSerializer

class PapeletaViewSet(viewsets.ModelViewSet):
    serializer_class   = PapeletaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        # Un hermano puede consultar y solicitar; solo la Junta puede cambiar
        # o eliminar una papeleta, incluido su estado.
        if self.action in {'update', 'partial_update', 'destroy'}:
            return [permissions.IsAdminUser()]
        return [permissions.IsAuthenticated()]

    def get_serializer_class(self):
        if self.request.user.is_staff and self.action in {'update', 'partial_update'}:
            return PapeletaAdminSerializer
        return PapeletaSerializer

    def get_queryset(self):
        user = self.request.user
        # Admin ve todas las papeletas; hermano solo la suya
        if user.is_staff:
            return Papeleta.objects.all()
        return Papeleta.objects.filter(usuario=user)

    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)
