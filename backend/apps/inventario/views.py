from django.shortcuts import render
from rest_framework import viewsets, permissions
from .models import Imagen, Enser, Util
from .serializers import ImagenSerializer, EnserSerializer, UtilSerializer

class SoloAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_staff

class ImagenViewSet(viewsets.ModelViewSet):
    queryset           = Imagen.objects.all()
    serializer_class   = ImagenSerializer
    permission_classes = [SoloAdmin]

class EnserViewSet(viewsets.ModelViewSet):
    queryset           = Enser.objects.all()
    serializer_class   = EnserSerializer
    permission_classes = [SoloAdmin]

class UtilViewSet(viewsets.ModelViewSet):
    queryset           = Util.objects.all()
    serializer_class   = UtilSerializer
    permission_classes = [SoloAdmin]