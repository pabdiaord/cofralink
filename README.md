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

## Verificación local

```powershell
backend/.venv/Scripts/python.exe backend/manage.py test apps.usuarios apps.hermanos apps.procesional apps.eventos apps.publicaciones apps.inventario apps.comunicaciones --keepdb --noinput
Set-Location frontend
npm audit --package-lock-only
npm run build
```
