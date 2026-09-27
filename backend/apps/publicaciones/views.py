from django.core.files.storage import default_storage
from django.http import FileResponse, Http404
from rest_framework import viewsets, permissions
from .models import Publicacion
from .serializers import PublicacionSerializer
from apps.hermanos.models import Hermano


def publicacion_imagen(request, nombre):
    """Sirve únicamente imágenes asociadas a publicaciones existentes."""
    if nombre in {'.', '..'} or '\\' in nombre:
        raise Http404

    ruta = f'publicaciones/{nombre}'
    if not Publicacion.objects.filter(imagen=ruta).exists():
        raise Http404

    try:
        return FileResponse(default_storage.open(ruta, 'rb'))
    except (OSError, ValueError):
        raise Http404 from None

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
