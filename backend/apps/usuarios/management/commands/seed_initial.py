"""Carga el contenido inicial no destructivo de CofraLink.

El comando está pensado para una instalación nueva, pero se puede ejecutar en
una base de datos ya utilizada: nunca actualiza ni elimina datos reales ya
existentes. Las cuentas creadas aquí son ficticias y usan el dominio reservado
``.test``; el comando puede migrar sus propios números demo entre versiones.
"""

import os
import unicodedata
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


DIRECCIONES_HERMANOS = (
    'C/ Gracia Sáenz de Tejada, 8, Alcalá de Guadaíra',
    'C/ Ramón J. Sénder, 11, Alcalá de Guadaíra',
    'C/ Sanlúcar la Mayor, 6, Alcalá de Guadaíra',
    'C/ Atilano de Acevedo, 15, Alcalá de Guadaíra',
    'C/ Telmo Maqueda, 7, Alcalá de Guadaíra',
    'C/ Pérez Galdós, 12, Alcalá de Guadaíra',
    'C/ Gutiérrez de Alba, 4, Alcalá de Guadaíra',
    'C/ Nuestra Señora del Águila, 9, Alcalá de Guadaíra',
    'C/ Herreros, 5, Alcalá de Guadaíra',
    'C/ Alcalá y Ortí, 16, Alcalá de Guadaíra',
    'C/ La Plata, 3, Alcalá de Guadaíra',
    'C/ Barrio Nuevo, 10, Alcalá de Guadaíra',
    'C/ Manuel de Falla, 14, Alcalá de Guadaíra',
    'C/ Cereales, 6, Alcalá de Guadaíra',
    'C/ Centeno, 18, Alcalá de Guadaíra',
    'C/ Trigo, 9, Alcalá de Guadaíra',
    'C/ Silos, 12, Alcalá de Guadaíra',
    'Avda. de la Constitución, 21, Alcalá de Guadaíra',
    'C/ Calderón de la Barca, 8, Alcalá de Guadaíra',
    'C/ Profesora Francisca Laguna, 17, Alcalá de Guadaíra',
    'C/ Ramón y Cajal, 11, Alcalá de Guadaíra',
    'C/ Mairena, 7, Alcalá de Guadaíra',
    'C/ Marchena, 4, Alcalá de Guadaíra',
    'C/ Arahal, 13, Alcalá de Guadaíra',
    'C/ Gandul, 6, Alcalá de Guadaíra',
    'C/ Oromana, 15, Alcalá de Guadaíra',
    'C/ Duquesa de Talavera, 8, Alcalá de Guadaíra',
    'C/ Carmen Amaya, 5, Alcalá de Guadaíra',
    'C/ Aguas, 9, Alcalá de Guadaíra',
    'C/ Castillo, 16, Alcalá de Guadaíra',
    'C/ Santa Clara, 7, Alcalá de Guadaíra',
    'C/ San Francisco, 12, Alcalá de Guadaíra',
    'C/ Concepción, 4, Alcalá de Guadaíra',
    'C/ Martínez Montañés, 10, Alcalá de Guadaíra',
    'C/ Maestro Serrano, 14, Alcalá de Guadaíra',
    'C/ Almazara, 6, Alcalá de Guadaíra',
    'C/ Olivo, 18, Alcalá de Guadaíra',
    'C/ Molino, 3, Alcalá de Guadaíra',
    'C/ Naranjo, 11, Alcalá de Guadaíra',
    'C/ Azahar, 8, Alcalá de Guadaíra',
    'C/ Clavel, 5, Alcalá de Guadaíra',
    'C/ Laurel, 13, Alcalá de Guadaíra',
    'C/ Jazmín, 7, Alcalá de Guadaíra',
    'C/ Romero, 16, Alcalá de Guadaíra',
    'C/ Violeta, 9, Alcalá de Guadaíra',
    'C/ Sevilla, 4, Alcalá de Guadaíra',
    'C/ Málaga, 12, Alcalá de Guadaíra',
    'C/ Córdoba, 6, Alcalá de Guadaíra',
    'C/ Granada, 15, Alcalá de Guadaíra',
    'C/ Huelva, 8, Alcalá de Guadaíra',
)

FECHA_MARTES_SANTO_2026 = date(2026, 3, 31)


EVENTOS = (
    (
        'Misa de Hermandad', 'CULTO', 10,
        'Parroquia de la Inmaculada Concepción',
        'Celebración de la Misa de Hermandad en torno a nuestros Sagrados Titulares.',
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

EVENTOS_LEGADOS = {
    (
        'Misa de Hermandad',
        'Convocatoria orientativa de la instalación inicial. La Hermandad confirmará el horario definitivo.',
    ): 'Celebración de la Misa de Hermandad en torno a nuestros Sagrados Titulares.',
}


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


CONVERSACIONES_PRIVADAS = (
    (
        3,
        (
            (
                'hermano',
                'Buenas tardes. He visto que mi papeleta de sitio para el paso del Santísimo Cristo del Perdón aparece aprobada. ¿Me confirmáis que corresponde al tramo 2 de nazarenos?',
                datetime(2026, 2, 18, 19, 5),
            ),
            (
                'junta',
                'Buenas tardes, Marta. Confirmamos la asignación para el tramo 2 de nazarenos del paso del Santísimo Cristo del Perdón. Te avisaremos cuando se comunique el reparto definitivo.',
                datetime(2026, 2, 19, 12, 20),
            ),
            (
                'hermano',
                'Perfecto, muchas gracias por la información.',
                datetime(2026, 2, 19, 13, 4),
            ),
        ),
    ),
    (
        4,
        (
            (
                'hermano',
                'Buenas noches. Soy Javier Santos, de la cuadrilla de costaleros. ¿Se mantiene el ensayo del paso de palio previsto en el calendario?',
                datetime(2026, 2, 25, 21, 12),
            ),
            (
                'junta',
                'Buenas noches, Javier. El ensayo sigue previsto. La cuadrilla confirmará por el canal habitual la hora de citación y el punto de encuentro.',
                datetime(2026, 2, 26, 10, 15),
            ),
            (
                'hermano',
                'De acuerdo, estaré pendiente. Gracias.',
                datetime(2026, 2, 26, 10, 31),
            ),
        ),
    ),
    (
        5,
        (
            (
                'hermano',
                'Buenas tardes. Quisiera saber cuándo se comunicará el reparto definitivo de papeletas de sitio.',
                datetime(2026, 3, 2, 18, 42),
            ),
            (
                'junta',
                'Buenas tardes, Lucía. La Diputación Mayor de Gobierno informará del reparto una vez cierre el plazo de solicitudes y se revisen las incidencias.',
                datetime(2026, 3, 3, 9, 20),
            ),
            (
                'hermano',
                'Muchas gracias. Quedo pendiente de la comunicación.',
                datetime(2026, 3, 3, 9, 38),
            ),
        ),
    ),
    (
        6,
        (
            (
                'hermano',
                'Hola. Para el próximo ensayo del paso del Cristo, ¿debo llevar ya la ropa de trabajo habitual?',
                datetime(2026, 3, 9, 20, 8),
            ),
            (
                'junta',
                'Hola, Francisco. Sí, te recomendamos acudir con la ropa y el calzado habituales de ensayo. Cualquier indicación adicional se comunicará por la cuadrilla.',
                datetime(2026, 3, 10, 11, 5),
            ),
            (
                'hermano',
                'Muchas gracias, allí estaremos.',
                datetime(2026, 3, 10, 11, 26),
            ),
        ),
    ),
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
        identidades = self._identidades_demo()
        self._migrar_identidades_demo_legadas(identidades)
        self._comprobar_conflictos_usuarios(identidades)
        numeros = self._obtener_numeros_demo()
        self._renumerar_perfiles_demo(numeros)
        self._actualizar_direcciones_demo(identidades)
        hermanos = []
        for indice, (nombre, apellidos, es_junta, caracter) in enumerate(
            DEMO_HERMANOS, start=1
        ):
            numero = numeros[indice - 1]
            username, email = identidades[indice - 1]
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
                    direccion=DIRECCIONES_HERMANOS[indice - 1],
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

    def _comprobar_conflictos_usuarios(self, identidades):
        emails = self._emails_demo()
        usernames = {username for username, _ in identidades}

        usuario_conflictivo = Usuario.objects.exclude(email__in=emails).filter(
            username__in=usernames
        ).values_list('username', flat=True).first()
        if usuario_conflictivo:
            raise CommandError(
                f'El nombre de usuario reservado {usuario_conflictivo} ya existe. '
                'No se ha modificado ningún dato.'
            )

    @staticmethod
    def _normalizar_identidad(valor):
        valor = unicodedata.normalize('NFKD', valor)
        valor = valor.encode('ascii', 'ignore').decode('ascii').lower()
        return '.'.join(valor.split())

    def _identidades_demo(self):
        identidades = []
        for nombre, apellidos, _, _ in DEMO_HERMANOS:
            username = (
                f'{self._normalizar_identidad(nombre)}.'
                f'{self._normalizar_identidad(apellidos)}'
            )
            identidades.append((username, f'{username}@cofralink.app'))
        return tuple(identidades)

    def _emails_demo(self):
        return {email for _, email in self._identidades_demo()}

    def _emails_demo_legado(self):
        return {
            f'hermano.demo{indice:02d}@cofralink.test'
            for indice in range(1, len(DEMO_HERMANOS) + 1)
        }

    def _migrar_identidades_demo_legadas(self, identidades):
        """Reemplaza identificadores visibles de versiones anteriores."""
        for indice, (username, email) in enumerate(identidades, start=1):
            email_legado = f'hermano.demo{indice:02d}@cofralink.test'
            usuario_legado = Usuario.objects.filter(email=email_legado).first()
            if usuario_legado is None:
                continue

            existe_email = Usuario.objects.exclude(pk=usuario_legado.pk).filter(
                email=email
            ).exists()
            existe_username = Usuario.objects.exclude(
                pk=usuario_legado.pk
            ).filter(username=username).exists()
            if existe_email or existe_username:
                raise CommandError(
                    'No se pueden actualizar los identificadores de una cuenta '
                    'de carga inicial porque ya están en uso. No se ha modificado '
                    'ningún dato.'
                )

            usuario_legado.email = email
            usuario_legado.username = username
            usuario_legado.save(update_fields=('email', 'username'))

    def _actualizar_direcciones_demo(self, identidades):
        for (_, email), direccion in zip(identidades, DIRECCIONES_HERMANOS):
            perfil = Hermano.objects.filter(usuario__email=email).first()
            if perfil and perfil.direccion.startswith('C/ CofraLink,'):
                perfil.direccion = direccion
                perfil.save(update_fields=('direccion',))

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
            email: numero
            for (_, email), numero in zip(self._identidades_demo(), numeros)
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
        self._migrar_eventos_legados()
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

    def _migrar_eventos_legados(self):
        for (nombre, descripcion_legada), descripcion_actual in EVENTOS_LEGADOS.items():
            Evento.objects.filter(
                nombre_evento=nombre,
                descripcion=descripcion_legada,
            ).update(descripcion=descripcion_actual)

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
        fecha = FECHA_MARTES_SANTO_2026
        for hermano, (paso, tramo, estado) in zip(hermanos[3:9], configuracion):
            papeleta = Papeleta.objects.filter(
                usuario=hermano.usuario, paso=paso, tramo=tramo
            ).first()
            if papeleta is None:
                Papeleta.objects.create(
                    usuario=hermano.usuario,
                    paso=paso,
                    tramo=tramo,
                    fecha=fecha,
                    estado=estado,
                )
            elif papeleta.fecha != fecha:
                papeleta.fecha = fecha
                papeleta.save(update_fields=('fecha',))

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

        for indice_hermano, mensajes in CONVERSACIONES_PRIVADAS:
            hermano = hermanos[indice_hermano]
            conversacion, _ = Conversacion.objects.get_or_create(
                hermano=hermano.usuario
            )
            self._eliminar_mensajes_privados_legados(conversacion, junta)
            for tipo_remitente, contenido, fecha in mensajes:
                remitente = junta if tipo_remitente == 'junta' else hermano.usuario
                self._crear_mensaje_privado(
                    conversacion=conversacion,
                    remitente=remitente,
                    contenido=contenido,
                    fecha=fecha,
                )

    @staticmethod
    def _eliminar_mensajes_privados_legados(conversacion, junta):
        MensajePrivado.objects.filter(
            conversacion=conversacion,
            contenido__startswith='Consulta de demostración ',
        ).delete()
        MensajePrivado.objects.filter(
            conversacion=conversacion,
            remitente=junta,
            contenido=(
                'Gracias por escribirnos. La Junta publicará la convocatoria '
                'definitiva por los canales habituales.'
            ),
        ).delete()

    @staticmethod
    def _crear_mensaje_privado(conversacion, remitente, contenido, fecha):
        if MensajePrivado.objects.filter(
            conversacion=conversacion,
            remitente=remitente,
            contenido=contenido,
        ).exists():
            return
        mensaje = MensajePrivado.objects.create(
            conversacion=conversacion,
            remitente=remitente,
            contenido=contenido,
            leido=True,
        )
        MensajePrivado.objects.filter(pk=mensaje.pk).update(
            fecha=timezone.make_aware(fecha)
        )
