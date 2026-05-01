from django.shortcuts import render
from rest_framework import viewsets, permissions
from .models import Papeleta
from .serializers import PapeletaSerializer

class PapeletaViewSet(viewsets.ModelViewSet):
    serializer_class   = PapeletaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Admin ve todas las papeletas; hermano solo la suya
        if user.is_staff:
            return Papeleta.objects.all()
        return Papeleta.objects.filter(usuario=user)

    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)