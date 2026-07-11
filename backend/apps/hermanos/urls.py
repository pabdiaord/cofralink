from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import HermanoViewSet, CrearHermanoCompletoView

router = DefaultRouter()
router.register(r'hermanos', HermanoViewSet, basename='hermano')

urlpatterns = [
    path('hermanos/crear-completo/', CrearHermanoCompletoView.as_view(), name='crear-hermano-completo'),
] + router.urls