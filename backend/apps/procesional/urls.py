from rest_framework.routers import DefaultRouter
from .views import PapeletaViewSet

router = DefaultRouter()
router.register(r'papeletas', PapeletaViewSet, basename='papeleta')

urlpatterns = router.urls