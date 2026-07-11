from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db import transaction
from apps.usuarios.models import Usuario
from .models import Hermano
from .serializers import HermanoSerializer

class EsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_staff

class HermanoViewSet(viewsets.ModelViewSet):
    queryset           = Hermano.objects.select_related('usuario').all()
    serializer_class   = HermanoSerializer
    permission_classes = [EsAdmin]

    def get_queryset(self):
        qs = super().get_queryset()
        nombre = self.request.query_params.get('nombre')
        numero = self.request.query_params.get('numero')
        if nombre:
            qs = qs.filter(nombre__icontains=nombre)
        if numero:
            qs = qs.filter(numero_hermano=numero)
        return qs

# ── Nuevo endpoint: crea usuario + hermano en una sola petición ──────
class CrearHermanoCompletoView(APIView):
    permission_classes = [EsAdmin]

    @transaction.atomic
    def post(self, request):
        data = request.data

        # Validaciones básicas
        numero = data.get('numero_hermano')
        nombre = data.get('nombre', '').lower().replace(' ', '')

        if not numero or not nombre:
            return Response(
                {'error': 'nombre y numero_hermano son obligatorios.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Generar credenciales automáticas
        username = f"{nombre}{numero}"
        email    = f"hermano{numero}@cofralink.com"
        password = 'Cofralink123!'

        # Comprobar si el email ya existe
        if Usuario.objects.filter(email=email).exists():
            return Response(
                {'error': f'Ya existe un hermano con número {numero}.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Crear usuario
        usuario = Usuario.objects.create_user(
            username=username,
            email=email,
            password=password,
        )

        # Crear hermano vinculado al usuario
        hermano = Hermano.objects.create(
            usuario        = usuario,
            nombre         = data.get('nombre', ''),
            apellidos      = data.get('apellidos', ''),
            direccion      = data.get('direccion', ''),
            numero_hermano = numero,
            estado_cuota   = data.get('estado_cuota', 'NO_PAGADO'),
            caracter       = data.get('caracter', 'NAZARENO'),
        )

        return Response(
            HermanoSerializer(hermano).data,
            status=status.HTTP_201_CREATED
        )
