"""Configuración de Django para CofraLink.

Los valores secretos se inyectan mediante variables de entorno. El archivo
``.env`` solo sirve para desarrollo local y nunca debe copiarse a producción.
"""

import os
import sys
from datetime import timedelta
from pathlib import Path

from django.core.exceptions import ImproperlyConfigured
from dotenv import load_dotenv


BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / '.env')


def env_bool(name, default=False):
    """Obtiene un booleano de entorno sin aceptar valores ambiguos."""
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {'1', 'true', 'yes', 'on'}


def env_list(name, default=()):
    value = os.getenv(name, '')
    if not value:
        return list(default)
    return [item.strip() for item in value.split(',') if item.strip()]


def required_env(name):
    value = os.getenv(name)
    if not value:
        raise ImproperlyConfigured(f'La variable de entorno {name} es obligatoria.')
    return value


DEBUG = env_bool('DEBUG', False)
SECRET_KEY = required_env('SECRET_KEY')

if DEBUG:
    ALLOWED_HOSTS = env_list('ALLOWED_HOSTS', ('localhost', '127.0.0.1'))
    FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5173').rstrip('/')
else:
    ALLOWED_HOSTS = env_list('ALLOWED_HOSTS')
    FRONTEND_URL = required_env('FRONTEND_URL').rstrip('/')
    if not ALLOWED_HOSTS:
        raise ImproperlyConfigured('ALLOWED_HOSTS no puede estar vacío en producción.')
    if not FRONTEND_URL.startswith('https://'):
        raise ImproperlyConfigured('FRONTEND_URL debe utilizar HTTPS en producción.')


INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Terceros
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',

    # Apps propias
    'apps.usuarios',
    'apps.hermanos',
    'apps.eventos',
    'apps.publicaciones',
    'apps.inventario',
    'apps.procesional',
    'apps.comunicaciones',
    'apps.donaciones',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'cofralink_backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'cofralink_backend.wsgi.application'
ASGI_APPLICATION = 'cofralink_backend.asgi.application'


DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': required_env('DB_NAME'),
        'USER': required_env('DB_USER'),
        'PASSWORD': required_env('DB_PASSWORD'),
        'HOST': os.getenv('DB_HOST', 'localhost'),
        'PORT': os.getenv('DB_PORT', '5432'),
        # Render usa certificados autofirmados en su red interna: allí se
        # configura DB_SSLMODE=require. Otros proveedores pueden usar
        # verify-full con una CA de confianza.
        'OPTIONS': {
            'sslmode': os.getenv('DB_SSLMODE', 'prefer' if DEBUG else 'verify-full'),
        },
    }
}

AUTH_USER_MODEL = 'usuarios.Usuario'

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': (
            'django.contrib.auth.password_validation.'
            'UserAttributeSimilarityValidator'
        ),
    },
    {
        'NAME': (
            'django.contrib.auth.password_validation.'
            'MinimumLengthValidator'
        ),
        'OPTIONS': {'min_length': 12},
    },
    {
        'NAME': (
            'django.contrib.auth.password_validation.CommonPasswordValidator'
        ),
    },
    {
        'NAME': (
            'django.contrib.auth.password_validation.NumericPasswordValidator'
        ),
    },
]


# El limitador usa la caché. En producción Redis es obligatorio: LocMemCache no
# se comparte entre procesos y no es suficiente para limitar ataques reales.
REDIS_URL = os.getenv('REDIS_URL')
if REDIS_URL:
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.redis.RedisCache',
            'LOCATION': REDIS_URL,
            'OPTIONS': {'socket_connect_timeout': 2, 'socket_timeout': 2},
        }
    }
elif DEBUG:
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
            'LOCATION': 'cofralink-development-cache',
        }
    }
else:
    raise ImproperlyConfigured('REDIS_URL es obligatoria en producción para rate limiting.')

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_THROTTLE_CLASSES': (
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
        'apps.usuarios.throttles.WriteRateThrottle',
    ),
    'DEFAULT_THROTTLE_RATES': {
        'anon': '120/hour',
        'user': '1000/hour',
        'write': '30/minute',
        'login_ip': '10/15minute',
        'login_email': '5/15minute',
        'password_reset_ip': '10/hour',
        'password_reset_email': '3/hour',
        'password_reset_confirm': '10/hour',
        'token_refresh': '30/minute',
    },
}

# La caché se comparte entre casos de Django TestCase y haría que los tests de
# autorización se bloqueasen entre sí. Los límites se ejercitan en integración;
# aquí se desactivan solo para la ejecución explícita de ``manage.py test``.
if 'test' in sys.argv:
    REST_FRAMEWORK['DEFAULT_THROTTLE_RATES'] = {
        scope: '100000/day'
        for scope in REST_FRAMEWORK['DEFAULT_THROTTLE_RATES']
    }
    PASSWORD_HASHERS = ['django.contrib.auth.hashers.MD5PasswordHasher']

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
}

# JWT se transmite en la cabecera Authorization. Si en el futuro se pasan a
# cookies, habrá que activar CORS_ALLOW_CREDENTIALS y protección CSRF explícita.
CORS_ALLOWED_ORIGINS = env_list(
    'CORS_ALLOWED_ORIGINS',
    ('http://localhost:5173',) if DEBUG else (),
)
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOW_CREDENTIALS = False
CSRF_TRUSTED_ORIGINS = env_list('CSRF_TRUSTED_ORIGINS')


LANGUAGE_CODE = 'es-es'
TIME_ZONE = 'Europe/Madrid'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
if not DEBUG:
    STORAGES = {
        'default': {'BACKEND': 'django.core.files.storage.FileSystemStorage'},
        'staticfiles': {
            'BACKEND': 'whitenoise.storage.CompressedManifestStaticFilesStorage',
        },
    }
MEDIA_URL = '/media/'
MEDIA_ROOT = Path(os.getenv('MEDIA_ROOT', BASE_DIR / 'media'))

# Límites de entrada: el proxy debe aplicar límites iguales o más estrictos.
DATA_UPLOAD_MAX_MEMORY_SIZE = 2 * 1024 * 1024
FILE_UPLOAD_MAX_MEMORY_SIZE = 2 * 1024 * 1024
DATA_UPLOAD_MAX_NUMBER_FIELDS = 200

EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = os.getenv('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.getenv('EMAIL_PORT', '587'))
EMAIL_USE_TLS = env_bool('EMAIL_USE_TLS', True)
EMAIL_TIMEOUT = int(os.getenv('EMAIL_TIMEOUT', '10'))
EMAIL_HOST_USER = required_env('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = required_env('EMAIL_HOST_PASSWORD')
DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL', EMAIL_HOST_USER)
PASSWORD_RESET_TIMEOUT = 60 * 60 * 24

# CofraLink se distribuye como TFG: la integración de Stripe está limitada de
# forma deliberada a Sandboxes. El propio proceso no arranca si se intenta usar
# una clave Live, incluso cuando DEBUG=False.
STRIPE_ENVIRONMENT = os.getenv('STRIPE_ENVIRONMENT', 'sandbox').strip().lower()
STRIPE_SECRET_KEY = required_env('STRIPE_SECRET_KEY')
STRIPE_WEBHOOK_SECRET = required_env('STRIPE_WEBHOOK_SECRET')

if STRIPE_ENVIRONMENT != 'sandbox':
    raise ImproperlyConfigured(
        'CofraLink solo permite STRIPE_ENVIRONMENT=sandbox para este TFG.'
    )
if not STRIPE_SECRET_KEY.startswith('sk_test_'):
    raise ImproperlyConfigured(
        'CofraLink solo admite claves Stripe de Sandbox con prefijo sk_test_.'
    )
if not STRIPE_WEBHOOK_SECRET.startswith('whsec_'):
    raise ImproperlyConfigured('STRIPE_WEBHOOK_SECRET debe tener el prefijo whsec_.')

# TRUST_X_FORWARDED_PROTO solo debe activarse cuando el proxy inverso sea de
# confianza y elimine esa cabecera del cliente antes de reenviar la petición.
SECURE_SSL_REDIRECT = not DEBUG
if env_bool('TRUST_X_FORWARDED_PROTO', False):
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_HSTS_SECONDS = 31_536_000 if not DEBUG else 0
SECURE_HSTS_INCLUDE_SUBDOMAINS = not DEBUG
# Solo desactívalo de forma consciente si algún subdominio no puede usar HTTPS.
SECURE_HSTS_PRELOAD = env_bool('SECURE_HSTS_PRELOAD', not DEBUG)
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = 'strict-origin-when-cross-origin'
X_FRAME_OPTIONS = 'DENY'
SESSION_COOKIE_SECURE = not DEBUG
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SAMESITE = 'Lax'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
