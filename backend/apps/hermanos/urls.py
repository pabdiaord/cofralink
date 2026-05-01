from rest_framework.routers import DefaultRouter
from .views import HermanoViewSet

router = DefaultRouter()
router.register(r'hermanos', HermanoViewSet, basename='hermano')

urlpatterns = router.urls