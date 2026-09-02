"""Carga el contenido inicial no destructivo de CofraLink.

El comando está pensado para una instalación nueva, pero se puede ejecutar en
una base de datos ya utilizada: nunca actualiza ni elimina datos reales ya
existentes. Las cuentas creadas aquí son ficticias y usan el dominio reservado
``.test``; el comando puede migrar sus propios números demo entre versiones.
"""

import os
from datetime import date, datetime, time, timedelta

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from apps.comunicaciones.models import (
    Conversacion,
    MensajeGeneral,
    MensajePrivado,
    ReaccionMensaje,
)
from apps.eventos.models import Evento, Inscripcion
from apps.hermanos.models import CaracterHermano, EstadoCuota, Hermano
from apps.inventario.models import Enser, Imagen, Util
from apps.procesional.models import Papeleta
from apps.publicaciones.models import Publicacion
from apps.usuarios.models import Usuario


DEMO_PASSWORD_ENV = 'SEED_DEMO_PASSWORD'
SEED_ENABLED_ENV = 'SEED_INITIAL_ENABLED'


# Todos los nombres, correos y direcciones de este bloque son ficticios. Los
# números se asignan exclusivamente entre 200 y 300, sin colisionar con los
# hermanos reales que ya existan en la base de datos.
DEMO_HERMANOS = (
    ('Alberto', 'Campos', True, CaracterHermano.MIEMBRO_JUNTA),
    ('Elena', 'Torres', True, CaracterHermano.MIEMBRO_JUNTA),
    ('Daniel', 'Márquez', True, CaracterHermano.MIEMBRO_JUNTA),
    ('Marta', 'López', False, CaracterHermano.NAZARENO),
    ('Javier', 'Santos', False, CaracterHermano.COSTALERO),
    ('Lucía', 'Romero', False, CaracterHermano.NAZARENO),
    ('Francisco', 'Vega', False, CaracterHermano.COSTALERO),
    ('Carmen', 'Ríos', False, CaracterHermano.NAZARENO),
    ('Antonio', 'Delgado', False, CaracterHermano.COSTALERO),
    ('Isabel', 'Navarro', False, CaracterHermano.NAZARENO),
    ('José Manuel', 'Cruz', False, CaracterHermano.COSTALERO),
    ('Ana', 'Beltrán', False, CaracterHermano.NAZARENO),
    ('Rafael', 'Molina', False, CaracterHermano.COSTALERO),
    ('Teresa', 'Lara', False, CaracterHermano.NAZARENO),
    ('Manuel', 'Ortega', False, CaracterHermano.COSTALERO),
    ('Pilar', 'Serrano', False, CaracterHermano.NAZARENO),
    ('Carlos', 'Benítez', False, CaracterHermano.COSTALERO),
    ('Rocío', 'Gómez', False, CaracterHermano.NAZARENO),
    ('Miguel', 'Herrera', False, CaracterHermano.COSTALERO),
    ('Beatriz', 'Núñez', False, CaracterHermano.NAZARENO),
    ('Álvaro', 'Prieto', False, CaracterHermano.COSTALERO),
    ('Inmaculada', 'Paredes', False, CaracterHermano.NAZARENO),
    ('Sergio', 'Castillo', False, CaracterHermano.COSTALERO),
    ('Victoria', 'Fuentes', False, CaracterHermano.NAZARENO),
    ('Joaquín', 'Bravo', False, CaracterHermano.COSTALERO),
    ('Sara', 'Montes', False, CaracterHermano.NAZARENO),
    ('Emilio', 'Domínguez', False, CaracterHermano.COSTALERO),
    ('Nuria', 'Valdés', False, CaracterHermano.NAZARENO),
    ('Diego', 'Carmona', False, CaracterHermano.COSTALERO),
    ('Macarena', 'Blanco', False, CaracterHermano.NAZARENO),
    ('Fernando', 'Acosta', False, CaracterHermano.COSTALERO),
    ('Claudia', 'Pastor', False, CaracterHermano.NAZARENO),
    ('Ángel', 'Marín', False, CaracterHermano.COSTALERO),
    ('Eva', 'Solís', False, CaracterHermano.NAZARENO),
    ('Tomás', 'Aguilar', False, CaracterHermano.COSTALERO),
    ('Paula', 'Cordero', False, CaracterHermano.NAZARENO),
    ('Adrián', 'Ferrer', False, CaracterHermano.COSTALERO),
    ('Noelia', 'Varela', False, CaracterHermano.NAZARENO),
    ('Ricardo', 'Bravo', False, CaracterHermano.COSTALERO),
    ('Lourdes', 'Mena', False, CaracterHermano.NAZARENO),
    ('Guillermo', 'Parra', False, CaracterHermano.COSTALERO),
    ('Silvia', 'Zamora', False, CaracterHermano.NAZARENO),
    ('Héctor', 'Lozano', False, CaracterHermano.COSTALERO),
    ('Marina', 'Suárez', False, CaracterHermano.NAZARENO),
    ('Rubén', 'Calvo', False, CaracterHermano.COSTALERO),
    ('Cristina', 'Ledesma', False, CaracterHermano.NAZARENO),
    ('Ignacio', 'Valero', False, CaracterHermano.COSTALERO),
    ('Patricia', 'Rosales', False, CaracterHermano.NAZARENO),
    ('Óscar', 'Iglesias', False, CaracterHermano.COSTALERO),
    ('Verónica', 'Luque', False, CaracterHermano.NAZARENO),
)


EVENTOS = (
    (
        'Misa de Hermandad', 'CULTO', 10,
        'Parroquia de la Inmaculada Concepción',
        'Convocatoria orientativa de la instalación inicial. La Hermandad confirmará el horario definitivo.',
    ),
    (
        'Jornada de priostía y preparación de enseres', 'PRIOSTIA', 17,
        'Dependencias de la Hermandad',
        'Trabajo de organización y preparación del patrimonio para los próximos cultos y actos.',
    ),
    (
        'Cabildo General Ordinario', 'REUNION', 24,
        'Casa de Hermandad',
        'Sesión informativa para hermanos. Consulta la convocatoria oficial antes de asistir.',
    ),
    (
        'Ensayo de costaleros — paso del Cristo', 'ENSAYO', 31,
        'Punto de encuentro comunicado por la cuadrilla',
        'Ensayo preparatorio del paso del Santísimo Cristo del Perdón.',
    ),
    (
        'Ensayo de costaleros — paso de palio', 'ENSAYO', 38,
        'Punto de encuentro comunicado por la cuadrilla',
        'Ensayo preparatorio del paso de Nuestra Señora de las Angustias.',
    ),
    (
        'Encuentro de formación franciscana', 'REUNION', 45,
        'Casa de Hermandad',
        'Espacio de formación y convivencia inspirado en los valores de San Francisco y Santa Clara.',
    ),
    (
        'Acción solidaria de la Bolsa de Caridad', 'REUNION', 60,
        'Casa de Hermandad',
        'Jornada de preparación de la campaña solidaria. Se detallarán las necesidades en el canal de la Hermandad.',
    ),
    (
        'Reunión de Diputación Mayor de Gobierno', 'REUNION', 70,
        'Casa de Hermandad',
        'Coordinación interna del cortejo y de las tareas organizativas.',
    ),
    (
        'Eucaristía de acción de gracias', 'CULTO', -18,
        'Parroquia de la Inmaculada Concepción',
        'Celebración de agradecimiento por la actividad reciente de la Hermandad.',
    ),
    (
        'Revisión del desarrollo de la Estación de Penitencia', 'REUNION', -45,
        'Casa de Hermandad',
        'Reunión de evaluación y propuestas de mejora para próximos años.',
    ),
)


PUBLICACIONES = (
    (
        'CofraLink: el espacio digital de la Hermandad', -2,
        'Bienvenido al espacio de información y gestión de la Hermandad. Aquí encontrarás convocatorias, comunicaciones y recursos para los hermanos.',
    ),
    (
        'Actualización del calendario de convocatorias', -5,
        'El calendario reúne cultos, reuniones, ensayos y tareas de priostía. Comprueba siempre la convocatoria oficial ante cualquier cambio.',
    ),
    (
        'Preparación de enseres y patrimonio', -12,
        'La priostía continúa el trabajo de preparación y revisión ordinaria de los enseres para las actividades de la Hermandad.',
    ),
    (
        'La Bolsa de Caridad, un compromiso compartido', -20,
        'La acción social forma parte esencial de la vida de Hermandad. Próximamente se comunicarán las necesidades y la forma de colaborar.',
    ),
    (
        'Información para el cuerpo de nazarenos y costaleros', -32,
        'Las comunicaciones relativas a papeletas de sitio, ensayos y organización del cortejo se publicarán por los canales habituales.',
    ),
    (
        'Caminar juntos en torno al Perdón', -48,
        'La Hermandad invita a todos sus hermanos a participar de sus cultos, actividades formativas y espacios de convivencia.',
    ),
)


IMAGENES = (
    ('Santísimo Cristo del Perdón', 'Parroquia de la Inmaculada Concepción'),
    ('Nuestra Señora de las Angustias', 'Parroquia de la Inmaculada Concepción'),
    ('Santa Clara de Asís', ''),
    ('San Juan Evangelista', ''),
    ('Inmaculada Concepción', 'Parroquia de la Inmaculada Concepción'),
)

ENSERES = (
    ('Paso del Santísimo Cristo del Perdón', 'Revisión ordinaria', 'Dependencias de la Hermandad'),
    ('Palio de Nuestra Señora de las Angustias', 'Revisión ordinaria', 'Dependencias de la Hermandad'),
    ('Cruz de Guía', 'Buen estado', 'Dependencias de la Hermandad'),
    ('Estandarte Corporativo', 'Buen estado', 'Dependencias de la Hermandad'),
    ('Libro de Reglas', 'Buen estado', 'Secretaría'),
)

UTILES = (
    ('Cirios para el cortejo', 'Almacén de priostía', 120),
    ('Juegos de varas', 'Almacén de priostía', 8),
    ('Costales de ensayo', 'Almacén de priostía', 30),
    ('Alfileres de priostía', 'Almacén de priostía', 200),
    ('Protectores para enseres', 'Almacén de priostía', 12),
)


class Command(BaseCommand):
    help = (
        'Añade contenido inicial de CofraLink sin modificar ni eliminar '
        'los datos reales existentes.'
    )

    def handle(self, *args, **options):
        self._validar_entorno()
        password = os.environ.get(DEMO_PASSWORD_ENV)
        if not password:
            raise CommandError(
                f'Configura {DEMO_PASSWORD_ENV} como secreto de entorno antes '
                'de crear las cuentas de demostración.'
            )

        with transaction.atomic():
            hermanos = self._crear_hermanos(password)
            autor_junta = hermanos[0]
            eventos = self._crear_eventos()
            self._crear_inscripciones(hermanos, eventos)
            self._crear_publicaciones(autor_junta)
            self._crear_inventario()
            self._crear_papeletas(hermanos)
            self._crear_comunicaciones(hermanos)

        self.stdout.write(self.style.SUCCESS(
            'Carga inicial terminada. Los usuarios, hermanos, huchas y '
            'donaciones reales que ya existían no se han modificado.'
        ))

    def _validar_entorno(self):
        habilitado = os.environ.get(SEED_ENABLED_ENV, '').strip().lower()
        if settings.DEBUG or habilitado in {'1', 'true', 'yes', 'on'}:
            return
        raise CommandError(
            'La carga inicial fuera de desarrollo requiere '
            f'{SEED_ENABLED_ENV}=true como autorización explícita.'
        )

    def _crear_hermanos(self, password):
        self._comprobar_conflictos_usuarios()
        numeros = self._obtener_numeros_demo()
        self._renumerar_perfiles_demo(numeros)
        hermanos = []
        for indice, (nombre, apellidos, es_junta, caracter) in enumerate(
            DEMO_HERMANOS, start=1
        ):
            numero = numeros[indice - 1]
            email = f'hermano.demo{indice:02d}@cofralink.test'
            username = f'perdon_demo_{indice:02d}'
            usuario, creado = Usuario.objects.get_or_create(
                email=email,
                defaults={
                    'username': username,
                    'is_staff': es_junta,
                    'is_active': True,
                },
            )
            if creado:
                usuario.set_password(password)
                usuario.save(update_fields=('password',))

            try:
                hermano = usuario.hermano
            except Hermano.DoesNotExist:
                if not creado:
                    raise CommandError(
                        f'La cuenta existente {email} no tiene perfil de hermano. '
                        'No se ha alterado por seguridad.'
                    )
                hermano = Hermano.objects.create(
                    usuario=usuario,
                    nombre=nombre,
                    apellidos=apellidos,
                    direccion=(
                        f'C/ CofraLink, {indice} — Alcalá de Guadaíra '
                        '(dato de demostración)'
                    ),
                    fecha_ingreso=date(
                        2014 + (indice % 10), (indice % 12) + 1, 1),
                    numero_hermano=numero,
                    estado_cuota=(
                        EstadoCuota.PAGADO
                        if indice % 5 else EstadoCuota.NO_PAGADO
                    ),
                    caracter=caracter,
                )
            hermanos.append(hermano)
        return hermanos

    def _comprobar_conflictos_usuarios(self):
        emails = self._emails_demo()
        usernames = {
            f'perdon_demo_{indice:02d}'
            for indice in range(1, len(DEMO_HERMANOS) + 1)
        }

        usuario_conflictivo = Usuario.objects.exclude(email__in=emails).filter(
            username__in=usernames
        ).values_list('username', flat=True).first()
        if usuario_conflictivo:
            raise CommandError(
                f'El nombre de usuario reservado {usuario_conflictivo} ya existe. '
                'No se ha modificado ningún dato.'
            )

    def _emails_demo(self):
        return {
            f'hermano.demo{indice:02d}@cofralink.test'
            for indice in range(1, len(DEMO_HERMANOS) + 1)
        }

    def _obtener_numeros_demo(self):
        ocupados = set(Hermano.objects.exclude(
            usuario__email__in=self._emails_demo()
        ).filter(numero_hermano__range=(200, 300)).values_list(
            'numero_hermano', flat=True
        ))
        disponibles = [
            numero for numero in range(200, 301)
            if numero not in ocupados
        ]
        if len(disponibles) < len(DEMO_HERMANOS):
            raise CommandError(
                'No hay suficientes números libres entre 200 y 300 para crear '
                'los 50 hermanos de demostración. No se ha modificado ningún dato.'
            )
        return disponibles[:len(DEMO_HERMANOS)]

    def _renumerar_perfiles_demo(self, numeros):
        """Migra solo perfiles demo de versiones anteriores al rango actual."""
        perfiles = list(Hermano.objects.select_related('usuario').filter(
            usuario__email__in=self._emails_demo()
        ).order_by('pk'))
        if not perfiles:
            return

        numeros_por_email = {
            f'hermano.demo{indice:02d}@cofralink.test': numero
            for indice, numero in enumerate(numeros, start=1)
        }
        ocupados = set(Hermano.objects.values_list('numero_hermano', flat=True))
        temporales = []
        candidato = 100_000
        while len(temporales) < len(perfiles):
            if candidato not in ocupados:
                temporales.append(candidato)
                ocupados.add(candidato)
            candidato += 1

        for perfil, temporal in zip(perfiles, temporales):
            perfil.numero_hermano = temporal
            perfil.save(update_fields=('numero_hermano',))

        for perfil in perfiles:
            perfil.numero_hermano = numeros_por_email[perfil.usuario.email]
            perfil.save(update_fields=('numero_hermano',))

    def _crear_eventos(self):
        hoy = timezone.localdate()
        eventos = {}
        for nombre, tipo, dias, lugar, descripcion in EVENTOS:
            coincidencias = Evento.objects.filter(nombre_evento=nombre)
            evento = coincidencias.filter(
                tipo_evento=tipo,
                lugar=lugar,
                descripcion=descripcion,
            ).order_by('pk').first()
            if evento is None:
                if coincidencias.exists():
                    self.stdout.write(self.style.WARNING(
                        f'Se omite el evento «{nombre}» porque ya existe otro '
                        'con ese título y datos distintos.'
                    ))
                    continue
                fecha_local = hoy + timedelta(days=dias)
                evento = Evento.objects.create(
                    nombre_evento=nombre,
                    tipo_evento=tipo,
                    fecha=timezone.make_aware(
                        datetime.combine(fecha_local, time(20, 30))
                    ),
                    lugar=lugar,
                    descripcion=descripcion,
                )
            eventos[nombre] = evento
        return eventos

    def _crear_inscripciones(self, hermanos, eventos):
        if not eventos:
            return
        nombres_eventos = list(eventos)
        for indice, hermano in enumerate(hermanos[:12]):
            evento = eventos[nombres_eventos[indice % len(nombres_eventos)]]
            Inscripcion.objects.get_or_create(
                hermano=hermano,
                evento=evento,
                defaults={'estado': 'confirmada'},
            )

    def _crear_publicaciones(self, autor):
        hoy = timezone.localdate()
        for titular, dias, descripcion in PUBLICACIONES:
            if Publicacion.objects.filter(titular=titular).exists():
                continue
            publicacion = Publicacion.objects.create(
                hermano=autor,
                titular=titular,
                descripcion=descripcion,
            )
            Publicacion.objects.filter(pk=publicacion.pk).update(
                fecha=hoy + timedelta(days=dias)
            )

    def _crear_inventario(self):
        for nombre, lugar_culto in IMAGENES:
            if not Imagen.objects.filter(nombre=nombre).exists():
                Imagen.objects.create(
                    nombre=nombre,
                    tipo_objeto='IMAGEN',
                    conservacion='Revisión ordinaria',
                    lugar_culto=lugar_culto,
                )

        for nombre, conservacion, ubicacion in ENSERES:
            if not Enser.objects.filter(nombre=nombre).exists():
                Enser.objects.create(
                    nombre=nombre,
                    tipo_objeto='ENSER',
                    conservacion=conservacion,
                    ubicacion=ubicacion,
                )

        for nombre, ubicacion, cantidad in UTILES:
            if not Util.objects.filter(nombre=nombre).exists():
                Util.objects.create(
                    nombre=nombre,
                    tipo_objeto='UTIL',
                    ubicacion=ubicacion,
                    cantidad=cantidad,
                )

    def _crear_papeletas(self, hermanos):
        hoy = timezone.localdate()
        configuracion = (
            ('Paso del Santísimo Cristo del Perdón',
             'Tramo 2 — Nazarenos', 'aprobada'),
            ('Paso de Nuestra Señora de las Angustias',
             'Tramo 3 — Nazarenos', 'pendiente'),
            ('Paso del Santísimo Cristo del Perdón',
             'Tramo 4 — Nazarenos', 'aprobada'),
            ('Paso de Nuestra Señora de las Angustias',
             'Tramo 1 — Nazarenos', 'rechazada'),
            ('Paso del Santísimo Cristo del Perdón',
             'Tramo 5 — Nazarenos', 'pendiente'),
            ('Paso de Nuestra Señora de las Angustias',
             'Tramo 4 — Nazarenos', 'aprobada'),
        )
        fecha = hoy + timedelta(days=210)
        for hermano, (paso, tramo, estado) in zip(hermanos[3:9], configuracion):
            if not Papeleta.objects.filter(
                usuario=hermano.usuario, paso=paso, tramo=tramo
            ).exists():
                Papeleta.objects.create(
                    usuario=hermano.usuario,
                    paso=paso,
                    tramo=tramo,
                    fecha=fecha,
                    estado=estado,
                )

    def _crear_comunicaciones(self, hermanos):
        junta = hermanos[0].usuario
        hoy = timezone.now()
        mensajes_generales = (
            'Bienvenidos al canal general de la Hermandad. Aquí se compartirán los avisos de interés para todos los hermanos.',
            'Ya está disponible el calendario inicial de cultos, reuniones, ensayos y tareas de priostía.',
            'Recordamos que las fechas y horarios deben confirmarse siempre mediante la convocatoria oficial de la Hermandad.',
        )
        for indice, contenido in enumerate(mensajes_generales):
            coincidencias = MensajeGeneral.objects.filter(contenido=contenido)
            mensaje = coincidencias.filter(autor=junta).first()
            if mensaje is None:
                if coincidencias.exists():
                    self.stdout.write(self.style.WARNING(
                        'Se omite un mensaje general con contenido coincidente '
                        'para no alterar un mensaje ya existente.'
                    ))
                    continue
                mensaje = MensajeGeneral.objects.create(autor=junta, 
                                                        contenido=contenido)
                MensajeGeneral.objects.filter(pk=mensaje.pk).update(
                    fecha=hoy - timedelta(days=3 - indice)
                )
            for hermano in hermanos[indice + 3:indice + 6]:
                ReaccionMensaje.objects.get_or_create(
                    mensaje=mensaje,
                    usuario=hermano.usuario,
                    defaults={'emoji': '🙏' if indice != 1 else '👍'},
                )

        for indice, hermano in enumerate(hermanos[3:6], start=1):
            conversacion, _ = Conversacion.objects.get_or_create(
                hermano=hermano.usuario
            )
            consulta = (
                f'Consulta de demostración {indice}: ¿podéis confirmar la información de la próxima convocatoria?'
            )
            respuesta = (
                'Gracias por escribirnos. La Junta publicará la convocatoria definitiva por los canales habituales.'
            )
            if not MensajePrivado.objects.filter(
                conversacion=conversacion, contenido=consulta
            ).exists():
                MensajePrivado.objects.create(
                    conversacion=conversacion,
                    remitente=hermano.usuario,
                    contenido=consulta,
                )
            if not MensajePrivado.objects.filter(
                conversacion=conversacion, contenido=respuesta
            ).exists():
                MensajePrivado.objects.create(
                    conversacion=conversacion,
                    remitente=junta,
                    contenido=respuesta,
                    leido=True,
                )
