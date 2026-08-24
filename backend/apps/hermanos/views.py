from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db import transaction
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from apps.usuarios.models import Usuario
from apps.usuarios.views import send_password_reset_email
from .models import Hermano
from .serializers import HermanoSerializer

class EsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_staff

class HermanoViewSet(viewsets.ModelViewSet):
    queryset           = Hermano.objects.select_related('usuario').all()
    serializer_class   = HermanoSerializer
    permission_classes = [EsAdmin]

    @transaction.atomic
    def perform_destroy(self, instance):
        usuario_id = instance.usuario_id
        instance.delete()
        Usuario.objects.filter(pk=usuario_id).delete()

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
        data   = request.data
        numero = data.get('numero_hermano')
        nombre = data.get('nombre', '').strip()
        email  = data.get('email', '').strip()

        if not numero or not nombre:
            return Response(
                {'error': 'nombre y numero_hermano son obligatorios.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not email:
            return Response(
                {'error': 'El email del hermano es obligatorio.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            validate_email(email)
        except ValidationError:
            return Response(
                {'error': 'El email no tiene un formato válido.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if Usuario.objects.filter(email=email).exists():
            return Response(
                {'error': 'Ya existe un usuario registrado con ese email.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Username generado automáticamente
        username = (
            nombre.lower()
            .replace(' ', '')
            + str(numero)
        )

        # La cuenta no tiene una contraseña conocida. Solo podrá acceder tras
        # usar el enlace individual de activación enviado a su correo.
        usuario = Usuario(username=username, email=email)
        usuario.set_unusable_password()
        usuario.save()

        hermano = Hermano.objects.create(
            usuario        = usuario,
            nombre         = nombre,
            apellidos      = data.get('apellidos', ''),
            direccion      = data.get('direccion', ''),
            numero_hermano = numero,
            estado_cuota   = data.get('estado_cuota', 'NO_PAGADO'),
            caracter       = data.get('caracter', 'NAZARENO'),
        )

        try:
            send_password_reset_email(usuario)
        except Exception:
            # No dejamos una cuenta sin contraseña cuyo enlace no se entregó.
            transaction.set_rollback(True)
            return Response(
                {'error': 'No se pudo enviar el email de activación. No se ha creado la cuenta.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        return Response(
            HermanoSerializer(hermano).data,
            status=status.HTTP_201_CREATED
        )
class MiPerfilView(APIView):
    """El hermano consulta y edita su propio perfil."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            hermano = request.user.hermano
            return Response(HermanoSerializer(hermano).data)
        except:
            return Response({'detail': 'Sin perfil de hermano.'}, status=404)

    def patch(self, request):
        try:
            hermano = request.user.hermano
        except:
            return Response({'detail': 'Sin perfil de hermano.'}, status=404)

        # Solo puede editar su dirección y email
        campos_permitidos = ['direccion']
        data = {k: v for k, v in request.data.items() if k in campos_permitidos}
        serializer = HermanoSerializer(hermano, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            # Actualizar email si viene
            nuevo_email = request.data.get('email')
            if nuevo_email:
                request.user.email = nuevo_email
                request.user.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)
