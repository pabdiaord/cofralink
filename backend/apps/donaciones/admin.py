from django.contrib import admin

from .models import Donacion, EventoStripe, Hucha


@admin.register(Hucha)
class HuchaAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'tipo', 'activa', 'objetivo_centimos',
                    'creada_en')
    list_filter = ('tipo', 'activa')
    search_fields = ('nombre', 'descripcion')
    readonly_fields = ('creada_en', 'cerrada_en')


@admin.register(Donacion)
class DonacionAdmin(admin.ModelAdmin):
    list_display = ('id', 'hucha', 'donante', 'importe_centimos', 'estado',
                    'pagada_en')
    list_filter = ('estado', 'moneda', 'hucha')
    search_fields = ('donante__email', 'stripe_checkout_session_id',
                     'stripe_payment_intent_id')
    readonly_fields = (
        'id', 'donante', 'hucha', 'importe_centimos', 'moneda', 'estado',
        'stripe_checkout_session_id', 'stripe_payment_intent_id',
        'error_codigo',
        'creada_en', 'actualizada_en', 'pagada_en',
    )

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(EventoStripe)
class EventoStripeAdmin(admin.ModelAdmin):
    list_display = ('stripe_event_id', 'tipo', 'procesado', 'recibido_en')
    list_filter = ('tipo', 'procesado')
    search_fields = ('stripe_event_id',)
    readonly_fields = ('stripe_event_id', 'tipo', 'procesado', 'error',
                       'recibido_en')

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
