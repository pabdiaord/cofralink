from django.shortcuts import render
from rest_framework import generics, permissions
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import RegistroSerializer, UsuarioSerializer
from .models import Usuario

# Registro público (no requiere estar autenticado)
class RegistroView(generics.CreateAPIView):
    queryset         = Usuario.objects.all()
    serializer_class = RegistroSerializer
    permission_classes = [permissions.AllowAny]

# Perfil del usuario autenticado
class PerfilView(generics.RetrieveUpdateAPIView):
    serializer_class   = UsuarioSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user