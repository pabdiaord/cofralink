from django.shortcuts import render
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.core.mail import send_mail
from django.conf import settings
from .serializers import RegistroSerializer, UsuarioSerializer
from .models import Usuario


class RegistroView(generics.CreateAPIView):
    queryset           = Usuario.objects.all()
    serializer_class   = RegistroSerializer
    permission_classes = [permissions.AllowAny]


class PerfilView(generics.RetrieveUpdateAPIView):
    serializer_class   = UsuarioSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class SolicitarCambioPasswordView(APIView):
    """El usuario introduce su email y recibe un enlace de cambio de contraseña."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip()
        if not email:
            return Response({'error': 'El email es obligatorio.'}, status=400)

        # Respuesta siempre igual por seguridad (no revelar si el email existe)
        mensaje = {'mensaje': 'Si el correo está registrado, recibirás un enlace en breve.'}

        try:
            usuario = Usuario.objects.get(email=email)
        except Usuario.DoesNotExist:
            return Response(mensaje)

        token_generator = PasswordResetTokenGenerator()
        token = token_generator.make_token(usuario)
        uid   = urlsafe_base64_encode(force_bytes(usuario.pk))

        enlace = f"http://localhost:5173/cambiar-password/{uid}/{token}/"

        send_mail(
            subject='CofraLink — Cambio de contraseña',
            message=(
                f'Hola,\n\n'
                f'Hemos recibido una solicitud para cambiar la contraseña de tu cuenta en CofraLink.\n\n'
                f'Haz clic en el siguiente enlace para establecer tu nueva contraseña:\n\n'
                f'{enlace}\n\n'
                f'Este enlace es válido durante 24 horas.\n\n'
                f'Si no has solicitado este cambio, puedes ignorar este correo.\n\n'
                f'Hermandad del Santísimo Cristo del Perdón\n'
                f'CofraLink — Plataforma de Gestión Cofrade'
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False,
        )

        return Response(mensaje)


class ConfirmarCambioPasswordView(APIView):
    """Valida el token y establece la nueva contraseña."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        uid       = request.data.get('uid', '')
        token     = request.data.get('token', '')
        password1 = request.data.get('password1', '')
        password2 = request.data.get('password2', '')

        if not uid or not token:
            return Response({'error': 'Enlace inválido.'}, status=400)

        if password1 != password2:
            return Response({'error': 'Las contraseñas no coinciden.'}, status=400)

        if len(password1) < 8:
            return Response({'error': 'La contraseña debe tener al menos 8 caracteres.'}, status=400)

        try:
            pk      = force_str(urlsafe_base64_decode(uid))
            usuario = Usuario.objects.get(pk=pk)
        except (TypeError, ValueError, OverflowError, Usuario.DoesNotExist):
            return Response({'error': 'Enlace inválido o expirado.'}, status=400)

        token_generator = PasswordResetTokenGenerator()
        if not token_generator.check_token(usuario, token):
            return Response({'error': 'El enlace ha expirado. Solicita uno nuevo.'}, status=400)

        usuario.set_password(password1)
        usuario.save()

        return Response({'mensaje': 'Contraseña cambiada correctamente. Ya puedes iniciar sesión.'})