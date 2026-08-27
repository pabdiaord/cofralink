from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    CrearCheckoutView,
    DonacionesAdminListView,
    HuchaViewSet,
    MiDonacionDetailView,
    MisDonacionesListView,
    StripeWebhookView,
)

router = DefaultRouter()
router.register(r'huchas', HuchaViewSet, basename='hucha')

urlpatterns = [
    path('checkout/', CrearCheckoutView.as_view(), name='donacion-checkout'),
    path('mis-donaciones/', MisDonacionesListView.as_view(),
         name='mis-donaciones'),
    path('mis-donaciones/<uuid:id>/', MiDonacionDetailView.as_view(),
         name='mi-donacion'),
    path('admin/donaciones/', DonacionesAdminListView.as_view(),
         name='donaciones-admin'),
    path('stripe/webhook/', StripeWebhookView.as_view(),
         name='stripe-webhook'),
    path('', include(router.urls)),
]
