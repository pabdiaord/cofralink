from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import HermanoViewSet, CrearHermanoCompletoView, MiPerfilView

router = DefaultRouter()
router.register(r'hermanos', HermanoViewSet, basename='hermano')

urlpatterns = [
    path('hermanos/crear-completo/', CrearHermanoCompletoView.as_view(), name='crear-hermano-completo'),
    path('mi-perfil/', MiPerfilView.as_view(), name='mi-perfil'),
] + router.urls