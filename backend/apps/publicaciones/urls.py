from rest_framework.routers import DefaultRouter
from .views import PublicacionViewSet

router = DefaultRouter()
router.register(r'publicaciones', PublicacionViewSet, basename='publicacion')

urlpatterns = router.urls