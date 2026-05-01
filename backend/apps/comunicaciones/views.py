from django.shortcuts import render
from rest_framework import viewsets, permissions
from .models import Mensaje
from .serializers import MensajeSerializer
from apps.hermanos.models import Hermano

class MensajeViewSet(viewsets.ModelViewSet):
    serializer_class   = MensajeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Admin ve todos los mensajes; hermano solo los suyos
        if user.is_staff:
            return Mensaje.objects.all()
        try:
            return Mensaje.objects.filter(hermano=user.hermano)
        except:
            return Mensaje.objects.none()

    def perform_create(self, serializer):
        hermano = Hermano.objects.get(usuario=self.request.user)
        serializer.save(hermano=hermano)