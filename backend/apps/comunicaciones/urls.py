from rest_framework.routers import DefaultRouter
from .views import MensajeViewSet

router = DefaultRouter()
router.register(r'mensajes', MensajeViewSet, basename='mensaje')

urlpatterns = router.urls