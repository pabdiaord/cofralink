"""Crea una copia local de PostgreSQL y de los archivos de media.

Uso desde la raíz del repositorio:
    python backend/backup_local.py RUTA_DE_CARPETA

La carpeta de destino debe estar fuera del repositorio. Las credenciales se
leen de backend/.env y no se muestran ni se incluyen en los argumentos de
pg_dump.
"""

import os
import subprocess
import sys
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

from dotenv import dotenv_values


BACKEND_DIR = Path(__file__).resolve().parent
REPO_DIR = BACKEND_DIR.parent


def main():
    if len(sys.argv) != 2:
        print('Uso: python backend/backup_local.py RUTA_DE_CARPETA')
        return 2

    destino = Path(sys.argv[1]).expanduser().resolve()
    if destino == REPO_DIR or REPO_DIR in destino.parents:
        print('La carpeta de respaldo debe estar fuera del repositorio.')
        return 2

    configuracion = dotenv_values(BACKEND_DIR / '.env')
    obligatorias = ('DB_NAME', 'DB_USER', 'DB_PASSWORD')
    faltantes = [nombre for nombre in obligatorias if not configuracion.get(nombre)]
    if faltantes:
        print('Faltan variables en backend/.env: ' + ', '.join(faltantes))
        return 2

    media = BACKEND_DIR / 'media'
    if not media.is_dir():
        print('No existe la carpeta backend/media.')
        return 2

    if os.name == 'nt':
        binario = Path(os.environ.get('ProgramFiles', r'C:\Program Files')) / 'PostgreSQL' / '18' / 'bin'
        pg_dump = binario / 'pg_dump.exe'
        pg_restore = binario / 'pg_restore.exe'
    else:
        from shutil import which

        pg_dump = Path(which('pg_dump') or '')
        pg_restore = Path(which('pg_restore') or '')

    if not pg_dump.is_file() or not pg_restore.is_file():
        print('No se encuentran pg_dump y pg_restore de PostgreSQL 18.')
        return 2

    destino.mkdir(parents=True, exist_ok=True)
    volcado = destino / 'cofralink.dump'
    imagenes = destino / 'media.zip'
    temporal_volcado = destino / 'cofralink.dump.partial'
    temporal_imagenes = destino / 'media.zip.partial'
    if any(ruta.exists() for ruta in (volcado, imagenes, temporal_volcado, temporal_imagenes)):
        print('La carpeta ya contiene un respaldo o una copia parcial. Usa una carpeta nueva.')
        return 2

    entorno = os.environ.copy()
    entorno['PGPASSWORD'] = configuracion['DB_PASSWORD']
    entorno['PGSSLMODE'] = configuracion.get('DB_SSLMODE') or 'prefer'

    comando = [
        str(pg_dump),
        '--host', configuracion.get('DB_HOST') or 'localhost',
        '--port', configuracion.get('DB_PORT') or '5432',
        '--username', configuracion['DB_USER'],
        '--dbname', configuracion['DB_NAME'],
        '--format=custom',
        '--file', str(temporal_volcado),
    ]

    try:
        subprocess.run(comando, env=entorno, check=True)
        if temporal_volcado.stat().st_size == 0:
            raise RuntimeError('El volcado de PostgreSQL está vacío.')
        subprocess.run(
            [str(pg_restore), '--list', str(temporal_volcado)],
            stdout=subprocess.DEVNULL,
            check=True,
        )

        archivos = [ruta for ruta in media.rglob('*') if ruta.is_file()]
        with ZipFile(temporal_imagenes, 'x', compression=ZIP_DEFLATED) as zip_media:
            for archivo in archivos:
                zip_media.write(archivo, arcname=archivo.relative_to(BACKEND_DIR))
        with ZipFile(temporal_imagenes) as zip_media:
            if zip_media.testzip() is not None:
                raise RuntimeError('La copia de media no se puede leer correctamente.')

        temporal_volcado.rename(volcado)
        temporal_imagenes.rename(imagenes)
    except (OSError, RuntimeError, subprocess.CalledProcessError) as error:
        temporal_volcado.unlink(missing_ok=True)
        temporal_imagenes.unlink(missing_ok=True)
        print(f'No se completó el respaldo: {error}')
        return 1

    print(f'Respaldo completo en: {destino}')
    print(f'PostgreSQL: {volcado.name} ({volcado.stat().st_size} bytes)')
    print(f'Imágenes: {imagenes.name} ({len(archivos)} archivos)')
    return 0


if __name__ == '__main__':
    sys.exit(main())
