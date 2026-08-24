"""Throttles específicos para los endpoints sensibles de autenticación."""

import re

from django.utils.crypto import salted_hmac
from rest_framework.permissions import SAFE_METHODS
from rest_framework.throttling import AnonRateThrottle, SimpleRateThrottle, UserRateThrottle


class ExtendedPeriodRateThrottle:
    """Permite intervalos explícitos, por ejemplo ``5/15minute``."""

    def parse_rate(self, rate):
        if rate:
            num_requests, period = rate.split('/')
            match = re.fullmatch(r'(\d+)(second|minute|hour|day)s?', period)
            if match:
                multiplier, unit = match.groups()
                durations = {
                    'second': 1,
                    'minute': 60,
                    'hour': 60 * 60,
                    'day': 24 * 60 * 60,
                }
                return int(num_requests), int(multiplier) * durations[unit]
        return super().parse_rate(rate)


class EmailRateThrottle(ExtendedPeriodRateThrottle, SimpleRateThrottle):
    """Limita por correo sin guardar el correo en texto plano en la caché."""

    email_field = 'email'

    def get_cache_key(self, request, view):
        email = str(request.data.get(self.email_field, '')).strip().casefold()
        # También se limita una petición sin correo para evitar que se eluda la
        # cuota enviando cuerpos inválidos.
        identifier = salted_hmac(f'throttle:{self.scope}', email or '<missing>').hexdigest()
        return self.cache_format % {'scope': self.scope, 'ident': identifier}


class LoginIPThrottle(ExtendedPeriodRateThrottle, AnonRateThrottle):
    scope = 'login_ip'


class LoginEmailThrottle(EmailRateThrottle):
    scope = 'login_email'


class PasswordResetIPThrottle(AnonRateThrottle):
    scope = 'password_reset_ip'


class PasswordResetEmailThrottle(EmailRateThrottle):
    scope = 'password_reset_email'


class PasswordResetConfirmThrottle(AnonRateThrottle):
    scope = 'password_reset_confirm'


class TokenRefreshThrottle(AnonRateThrottle):
    scope = 'token_refresh'


class WriteRateThrottle(UserRateThrottle):
    """Aplica cuota por usuario/IP únicamente a métodos que cambian datos."""

    scope = 'write'

    def allow_request(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return super().allow_request(request, view)
