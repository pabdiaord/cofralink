# CofraLink

Aplicación de gestión para una hermandad de Semana Santa.

## Despliegue seguro

Antes de publicar el backend, copia [`backend/.env.example`](backend/.env.example)
en el gestor de secretos del proveedor y rellena todos los valores reales. No
subas un `.env` a Git ni uses variables `VITE_` para secretos: esas variables
se incorporan al JavaScript del navegador.

Con `DEBUG=False` la aplicación no inicia si faltan `ALLOWED_HOSTS`,
`FRONTEND_URL` o `REDIS_URL`. Es intencionado: el backend exige HTTPS, Redis
para el rate limiting y TLS validado hacia PostgreSQL.

1. Publica frontend y API en el mismo origen siempre que sea posible. Si no,
   configura `VITE_API_URL`, `CORS_ALLOWED_ORIGINS` y
   `CSRF_TRUSTED_ORIGINS` con los dominios HTTPS exactos.
2. Mantén PostgreSQL y Redis en red privada, con contraseña, TLS y acceso solo
   desde el backend. El rol de aplicación no debe ser propietario ni superusuario.
3. Termina TLS en un proxy de confianza y activa
   `TRUST_X_FORWARDED_PROTO=True` solo si el proxy reemplaza la cabecera
   `X-Forwarded-Proto`. Aplica también en el proxy límite de cuerpo de 2 MB y
   rate limiting para `/admin/login/`.
4. Antes del primer arranque, aplica las migraciones de la blacklist de JWT:

   ```powershell
   backend/.venv/Scripts/python.exe backend/manage.py migrate
   backend/.venv/Scripts/python.exe backend/manage.py check --deploy
   ```

5. Rota `SECRET_KEY`, las credenciales PostgreSQL/Redis/SMTP y cualquier
   contraseña inicial que se hubiese usado antes de esta versión.

Las altas de hermanos ahora envían un enlace individual para establecer la
contraseña; no hay contraseña compartida. Las papeletas solo pueden ser
aprobadas o rechazadas por una cuenta `is_staff`.

## Carga inicial de contenido

La aplicación dispone de un comando idempotente para llenar una instalación
nueva con contenido institucional orientativo, inventario, comunicaciones,
eventos y cuentas ficticias de demostración. No modifica ni elimina usuarios,
hermanos, huchas o donaciones reales existentes; solo puede actualizar las
cuentas demo identificables que el propio comando creó en una versión previa.

Las cuentas de demostración usan correos con el dominio `@cofralink.app` y
números libres entre 200 y 300. Su contraseña nunca se guarda en Git: configura el secreto
`SEED_DEMO_PASSWORD` en `backend/.env` durante desarrollo o en el gestor de
secretos del proveedor. En producción habilita explícitamente el comando:

```env
SEED_INITIAL_ENABLED=true
SEED_DEMO_PASSWORD=elige-una-contraseña-larga-solo-en-el-entorno-de-despliegue
```

Tras las migraciones, ejecútalo en el proceso de despliegue:

```powershell
backend/.venv/Scripts/python.exe backend/manage.py seed_initial
```

En una base de datos de producción nueva, los usuarios, administrador y
donaciones ya existentes en otro entorno deben migrarse mediante el respaldo
seguro de PostgreSQL; no se incluyen en este comando ni en el repositorio.

## Verificación local

```powershell
backend/.venv/Scripts/python.exe backend/manage.py test apps.usuarios apps.hermanos apps.procesional apps.eventos apps.publicaciones apps.inventario apps.comunicaciones apps.donaciones --keepdb --noinput
Set-Location frontend
npm audit --package-lock-only
npm run build
```

## Donaciones simuladas con Stripe Sandbox

El módulo de Donaciones está preparado exclusivamente para el TFG: nunca
acepta claves Live de Stripe, no vincula una cuenta bancaria y las aportaciones
son simulaciones. Para configurarlo:

1. Crea una cuenta de desarrollador en Stripe y, desde el selector de cuenta
   del Dashboard, crea un **Sandbox** llamado por ejemplo `CofraLink TFG`.
   No actives pagos Live ni introduzcas datos bancarios.
2. Dentro de ese Sandbox abre **Developers > API keys** y copia la *Sandbox
   secret key* (`sk_test_...`). No hace falta usar la clave publicable porque
   esta aplicación emplea Checkout alojado por Stripe.
3. Añade al final de `backend/.env`, sin subirlo a Git:

   ```env
   STRIPE_ENVIRONMENT=sandbox
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

4. Aplica la nueva migración. Esta crea la **Hucha General de la Hermandad**:

   ```powershell
   backend/.venv/Scripts/python.exe backend/manage.py migrate
   ```

5. Para recibir webhooks durante el desarrollo local, instala la Stripe CLI,
   ejecuta `stripe login`, selecciona el Sandbox en el navegador y después:

   ```powershell
   stripe listen --events checkout.session.completed,checkout.session.async_payment_succeeded,checkout.session.async_payment_failed,checkout.session.expired --forward-to http://localhost:8000/api/donaciones/stripe/webhook/
   ```

   Copia el secreto `whsec_...` que muestra ese comando en
   `STRIPE_WEBHOOK_SECRET` y reinicia Django. Mantén el listener abierto
   mientras pruebas pagos.

6. Inicia la aplicación y entra en **Donaciones**. Para simular un pago usa
   la tarjeta `4242 4242 4242 4242`, cualquier fecha futura, CVC de tres
   cifras y código postal. Para comprobar el caso de rechazo usa
   `4000 0000 0000 9995`.

Consulta la documentación oficial de [Stripe Sandboxes](https://docs.stripe.com/sandboxes)
y [pruebas con tarjetas](https://docs.stripe.com/testing) si necesitas otros
escenarios de simulación.
