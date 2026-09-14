#!/usr/bin/env python
"""
Archivo de arranque para tareas administrativas de Django.

Permite ejecutar comandos como migrate, runserver, shell, etc.
Debe usarse para cualquier operación administrativa del backend.
"""
import os
import sys


def main():
    """
    Ejecuta las tareas administrativas de Django.
    Establece el módulo de configuración y ejecuta el comando solicitado.
    """
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "No se pudo importar Django. ¿Estás seguro de que está instalado y "
            "disponible en tu variable de entorno PYTHONPATH? ¿Olvidaste activar un entorno virtual?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()
