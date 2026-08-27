import logging

import stripe
from django.conf import settings
from django.db import IntegrityError, transaction
from django.db.models import BigIntegerField, Count, Q, Sum, Value
from django.db.models.functions import Coalesce
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework import generics, permissions, status, viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Donacion, EstadoDonacion, EventoStripe, Hucha, TipoHucha
from .serializers import (
    CrearCheckoutSerializer,
    DonacionSerializer,
    HuchaAdminSerializer,
    HuchaSerializer,
)

logger = logging.getLogger(__name__)


def huchas_con_recaudacion(queryset):
    """Anota exclusivamente donaciones confirmadas por Stripe."""
    return queryset.annotate(
        recaudado_centimos=Coalesce(
            Sum(
                'donaciones__importe_centimos',
                filter=Q(donaciones__estado=EstadoDonacion.PAGADA),
            ),
            Value(0),
            output_field=BigIntegerField(),
        ),
        numero_donaciones=Count(
            'donaciones', filter=Q(donaciones__estado=EstadoDonacion.PAGADA)
        ),
    )


class EsAdminOSoloLectura(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return (
            request.method in permissions.SAFE_METHODS or request.user.is_staff
        )


class HuchaViewSet(viewsets.ModelViewSet):
    permission_classes = [EsAdminOSoloLectura]

    def get_queryset(self):
        queryset = Hucha.objects.all()
        if not self.request.user.is_staff:
            queryset = queryset.filter(activa=True)
        return huchas_con_recaudacion(queryset)

    def get_serializer_class(self):
        if (
            self.request.user.is_staff
            and self.action in {'create', 'update', 'partial_update'}
        ):
            return HuchaAdminSerializer
        return HuchaSerializer

    def perform_create(self, serializer):
        serializer.save(creada_por=self.request.user)

    def perform_update(self, serializer):
        hucha = self.get_object()
        if (
            hucha.tipo == TipoHucha.GENERAL
            and serializer.validated_data.get('activa') is False
        ):
            raise ValidationError('La hucha general debe permanecer activa.')

        activa = serializer.validated_data.get('activa', hucha.activa)
        serializer.save(cerrada_en=None if activa else timezone.now())

    def destroy(self, request, *args, **kwargs):
        raise ValidationError(
            'Huchas no se eliminan para conservar historial. Ciérrala.'
        )


class CrearCheckoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = CrearCheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        hucha = serializer.validated_data['hucha']
        importe_centimos = serializer.validated_data['importe_centimos']

        if not hucha.activa:
            raise ValidationError(
                {'hucha_id': 'Esta hucha ya no admite donaciones.'})

        donacion = Donacion.objects.create(
            donante=request.user,
            hucha=hucha,
            importe_centimos=importe_centimos,
        )

        try:
            # Checkout alojado evita se reciba/almacene datos de tarjeta.
            stripe.api_key = settings.STRIPE_SECRET_KEY
            sesion = stripe.checkout.Session.create(
                mode='payment',
                payment_method_types=['card'],
                submit_type='donate',
                line_items=[{
                    'price_data': {
                        'currency': 'eur',
                        'product_data': {
                            'name': f'Donación simulada · {hucha.nombre}',
                        },
                        'unit_amount': importe_centimos,
                    },
                    'quantity': 1,
                }],
                client_reference_id=str(donacion.id),
                metadata={
                    'donacion_id': str(donacion.id),
                    'entorno': 'TFG_SANDBOX',
                },
                payment_intent_data={
                    'metadata': {'donacion_id': str(donacion.id)},
                },
                success_url=(
                    f'{settings.FRONTEND_URL}/donaciones/resultado'
                    f'?donacion={
                        donacion.id}&session_id={{CHECKOUT_SESSION_ID}}'
                ),
                cancel_url=f'{
                    settings.FRONTEND_URL}/donaciones?hucha={hucha.id}',
                idempotency_key=f'donacion-{donacion.id}',
            )
        except stripe.error.StripeError as exc:
            logger.warning(
                'No se pudo crear la sesión de Stripe para donación %s: %s',
                donacion.id, type(exc).__name__)
            donacion.estado = EstadoDonacion.FALLIDA
            donacion.error_codigo = 'stripe_session_error'
            donacion.save(update_fields=('estado', 'error_codigo',
                                         'actualizada_en'))
            return Response(
                {'detail': 
                 'No se pudo iniciar el pago simulado. Inténtalo de nuevo.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        donacion.stripe_checkout_session_id = sesion.id
        donacion.save(update_fields=('stripe_checkout_session_id',
                                     'actualizada_en'))
        return Response(
            {'donacion_id': str(donacion.id), 'checkout_url': sesion.url},
            status=status.HTTP_201_CREATED,
        )


class MisDonacionesListView(generics.ListAPIView):
    serializer_class = DonacionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Donacion.objects.filter(
            donante=self.request.user).select_related('hucha', 'donante')


class MiDonacionDetailView(generics.RetrieveAPIView):
    serializer_class = DonacionSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'id'

    def get_queryset(self):
        queryset = Donacion.objects.select_related('hucha', 'donante')
        if not self.request.user.is_staff:
            queryset = queryset.filter(donante=self.request.user)
        return queryset


class DonacionesAdminListView(generics.ListAPIView):
    serializer_class = DonacionSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        queryset = Donacion.objects.select_related('hucha', 'donante')
        hucha_id = self.request.query_params.get('hucha')
        estado_param = self.request.query_params.get('estado')

        if hucha_id:
            queryset = queryset.filter(hucha_id=hucha_id)
        if estado_param in EstadoDonacion.values:
            queryset = queryset.filter(estado=estado_param)
        return queryset


@method_decorator(csrf_exempt, name='dispatch')
class StripeWebhookView(APIView):
    """Recibe eventos firmados Stripe Sandbox sin autenticación de usuario"""

    authentication_classes = []
    permission_classes = [permissions.AllowAny]
    throttle_classes = []

    def post(self, request):
        signature = request.headers.get('Stripe-Signature')
        if not signature:
            return Response({'detail': 'Falta la firma de Stripe.'},
                            status=status.HTTP_400_BAD_REQUEST)

        try:
            evento = stripe.Webhook.construct_event(
                request.body,
                signature,
                settings.STRIPE_WEBHOOK_SECRET,
            )
        except (ValueError, stripe.error.SignatureVerificationError):
            return Response(
                {'detail': 'Firma de Stripe inválida.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # stripe-python 15 devuelve un objeto Event (no un dict) y bloquea los
        # accesos de diccionario directos. Se convierte una sola vez para que
        # todas las validaciones posteriores operen sobre datos inmutables.
        if not isinstance(evento, dict):
            evento = evento.to_dict()

        if evento.get('livemode') is True:
            logger.error('Se rechazó un evento Live de Stripe en CofraLink.')
            return Response(
                {'detail': 'CofraLink solo acepta eventos de Stripe Sandbox.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        tipos_interes = {
            'checkout.session.completed',
            'checkout.session.async_payment_succeeded',
            'checkout.session.async_payment_failed',
            'checkout.session.expired',
        }
        if evento['type'] not in tipos_interes:
            return Response(status=status.HTTP_200_OK)

        try:
            with transaction.atomic():
                registro, creado = EventoStripe.objects.get_or_create(
                    stripe_event_id=evento['id'],
                    defaults={'tipo': evento['type']},
                )
                if not creado:
                    return Response(status=status.HTTP_200_OK)

                sesion = evento['data']['object']
                donacion_id = sesion.get('metadata', {}).get('donacion_id')
                if not donacion_id:
                    registro.error = 'missing_donation_id'
                    registro.save(update_fields=('error',))
                    return Response(status=status.HTTP_200_OK)

                try:
                    donacion = Donacion.objects.select_for_update().get(
                        pk=donacion_id)
                except (Donacion.DoesNotExist, ValueError):
                    registro.error = 'unknown_donation'
                    registro.save(update_fields=('error',))
                    return Response(status=status.HTTP_200_OK)

                if not self._sesion_coincide(sesion, donacion):
                    registro.error = 'session_mismatch'
                    registro.save(update_fields=('error',))
                    logger.warning(
                        'Evento Stripe %s no coincide con donación %s.',
                        evento['id'], donacion.id)
                    return Response(status=status.HTTP_200_OK)

                self._actualizar_donacion(evento['type'], sesion, donacion)
                registro.procesado = True
                registro.save(update_fields=('procesado',))
        except IntegrityError:
            # Dos entregas simultáneas del mismo evento compiten
            # por la restricción única;
            #  ambas se reconocen y solo una llega a cambiar la donación.
            return Response(status=status.HTTP_200_OK)

        return Response(status=status.HTTP_200_OK)

    @staticmethod
    def _sesion_coincide(sesion, donacion):
        return (
            sesion.get('client_reference_id') == str(donacion.id)
            and sesion.get('amount_total') == donacion.importe_centimos
            and sesion.get('currency') == donacion.moneda
        )

    @staticmethod
    def _actualizar_donacion(tipo_evento, sesion, donacion):
        if tipo_evento in {
            'checkout.session.completed',
            'checkout.session.async_payment_succeeded',
        } and sesion.get('payment_status') == 'paid':
            if donacion.estado != EstadoDonacion.PAGADA:
                donacion.estado = EstadoDonacion.PAGADA
                donacion.pagada_en = timezone.now()
                donacion.error_codigo = ''
        elif tipo_evento == 'checkout.session.async_payment_failed':
            if donacion.estado != EstadoDonacion.PAGADA:
                donacion.estado = EstadoDonacion.FALLIDA
                donacion.error_codigo = 'payment_failed'
        elif tipo_evento == 'checkout.session.expired':
            if donacion.estado == EstadoDonacion.PENDIENTE:
                donacion.estado = EstadoDonacion.CANCELADA
                donacion.error_codigo = 'checkout_expired'

        donacion.stripe_checkout_session_id = (
            sesion.get('id') or donacion.stripe_checkout_session_id
        )
        donacion.stripe_payment_intent_id = (
            sesion.get('payment_intent') or donacion.stripe_payment_intent_id
        )
        donacion.save()
