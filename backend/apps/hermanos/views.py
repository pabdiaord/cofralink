from django.shortcuts import render
from rest_framework import viewsets, permissions
from .models import Hermano
from .serializers import HermanoSerializer

class EsAdmin(permissions.BasePermission):
    """Solo el staff (Junta de Gobierno) puede acceder."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_staff

class HermanoViewSet(viewsets.ModelViewSet):
    queryset           = Hermano.objects.select_related('usuario').all()
    serializer_class   = HermanoSerializer
    permission_classes = [EsAdmin]

    def get_queryset(self):
        qs = super().get_queryset()
        # Filtro opcional por nombre o número
        nombre = self.request.query_params.get('nombre')
        numero = self.request.query_params.get('numero')
        if nombre:
            qs = qs.filter(nombre__icontains=nombre)
        if numero:
            qs = qs.filter(numero_hermano=numero)
        return qs
