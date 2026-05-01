from rest_framework.routers import DefaultRouter
from .views import ImagenViewSet, EnserViewSet, UtilViewSet

router = DefaultRouter()
router.register(r'imagenes', ImagenViewSet, basename='imagen')
router.register(r'enseres',  EnserViewSet,  basename='enser')
router.register(r'utiles',   UtilViewSet,   basename='util')

urlpatterns = router.urls