from django.conf import settings
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .models import Usuario
from .serializers import RegistroSerializer, UsuarioSerializer
from .throttles import (
    LoginEmailThrottle,
    LoginIPThrottle,
    PasswordResetConfirmThrottle,
    PasswordResetEmailThrottle,
    PasswordResetIPThrottle,
    TokenRefreshThrottle,
)


def password_reset_url(usuario):
    """Construye una URL de restablecimiento desde configuración de confianza."""
    token = PasswordResetTokenGenerator().make_token(usuario)
    uid = urlsafe_base64_encode(force_bytes(usuario.pk))
    return f'{settings.FRONTEND_URL}/cambiar-password/{uid}/{token}/'


def send_password_reset_email(usuario):
    """Envía el enlace de activación/restablecimiento sin registrar el token."""
    enlace = password_reset_url(usuario)
    send_mail(
        subject='CofraLink — Cambio de contraseña',
        message=(
            'Hola,\n\n'
            'Hemos recibido una solicitud para establecer la contraseña de tu cuenta en CofraLink.\n\n'
            'Usa el siguiente enlace para continuar:\n\n'
            f'{enlace}\n\n'
            'Este enlace es válido durante 24 horas.\n\n'
            'Si no esperabas este mensaje, puedes ignorarlo.\n\n'
            'Hermandad del Santísimo Cristo del Perdón\n'
            'CofraLink — Plataforma de Gestión Cofrade'
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[usuario.email],
        fail_silently=False,
    )


class LoginView(TokenObtainPairView):
    """Login con límites independientes por IP y por cuenta."""

    throttle_classes = [LoginIPThrottle, LoginEmailThrottle]


class RefreshTokenView(TokenRefreshView):
    """Evita que un token de refresh robado se pruebe de forma masiva."""

    throttle_classes = [TokenRefreshThrottle]


class RegistroView(generics.CreateAPIView):
    queryset = Usuario.objects.all()
    serializer_class = RegistroSerializer
    permission_classes = [permissions.IsAdminUser]


class PerfilView(generics.RetrieveUpdateAPIView):
    serializer_class = UsuarioSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class SolicitarCambioPasswordView(APIView):
    """Envía un enlace sin revelar si un correo está registrado."""

    permission_classes = [permissions.AllowAny]
    throttle_classes = [PasswordResetIPThrottle, PasswordResetEmailThrottle]

    def post(self, request):
        email = request.data.get('email', '').strip()
        if not email:
            return Response({'error': 'El email es obligatorio.'}, status=400)

        mensaje = {
            'mensaje': 'Si el correo está registrado, recibirás un enlace en breve.'
        }

        try:
            usuario = Usuario.objects.get(email=email, is_active=True)
        except Usuario.DoesNotExist:
            return Response(mensaje)

        send_password_reset_email(usuario)
        return Response(mensaje)


class ConfirmarCambioPasswordView(APIView):
    """Valida el token y aplica los validadores de contraseña de Django."""

    permission_classes = [permissions.AllowAny]
    throttle_classes = [PasswordResetConfirmThrottle]

    def post(self, request):
        uid = request.data.get('uid', '')
        token = request.data.get('token', '')
        password1 = request.data.get('password1', '')
        password2 = request.data.get('password2', '')

        if not uid or not token:
            return Response({'error': 'Enlace inválido.'}, status=400)

        if password1 != password2:
            return Response({'error': 'Las contraseñas no coinciden.'}, status=400)

        try:
            pk = force_str(urlsafe_base64_decode(uid))
            usuario = Usuario.objects.get(pk=pk)
        except (TypeError, ValueError, OverflowError, Usuario.DoesNotExist):
            return Response({'error': 'Enlace inválido o expirado.'}, status=400)

        if not usuario.is_active or not PasswordResetTokenGenerator().check_token(usuario, token):
            return Response({'error': 'El enlace ha expirado. Solicita uno nuevo.'}, status=400)

        try:
            validate_password(password1, user=usuario)
        except ValidationError as exc:
            return Response({'password1': list(exc.messages)}, status=400)

        usuario.set_password(password1)
        usuario.save(update_fields=['password'])
        return Response({'mensaje': 'Contraseña cambiada correctamente. Ya puedes iniciar sesión.'})
