from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    RegistroView, PerfilView,
    SolicitarCambioPasswordView, ConfirmarCambioPasswordView,
)

urlpatterns = [
    path('registro/',               RegistroView.as_view(),               name='registro'),
    path('login/',                  TokenObtainPairView.as_view(),         name='login'),
    path('token/refresh/',          TokenRefreshView.as_view(),            name='token_refresh'),
    path('perfil/',                 PerfilView.as_view(),                  name='perfil'),
    path('solicitar-cambio-password/', SolicitarCambioPasswordView.as_view(), name='solicitar-cambio-password'),
    path('confirmar-cambio-password/', ConfirmarCambioPasswordView.as_view(), name='confirmar-cambio-password'),
]