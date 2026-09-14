"""
Script para ejecutar frontend y backend simultaneamente.
"""

import subprocess
import sys
import os
import platform

# Rutas relativas a los directorios del frontend y backend
FRONTEND_DIR = os.path.join(os.path.dirname(__file__), 'cliente')
BACKEND_DIR = os.path.join(os.path.dirname(__file__), 'servidor')

# Detectar Python del entorno virtual si existe
def get_backend_python():
    venv_dir = os.path.join(BACKEND_DIR, 'venv')
    if platform.system() == 'Windows':
        python_path = os.path.join(venv_dir, 'Scripts', 'python.exe')
    else:
        python_path = os.path.join(venv_dir, 'bin', 'python')
    return python_path if os.path.exists(python_path) else sys.executable

FRONTEND_CMD = ['npm', 'run', 'dev']
BACKEND_PYTHON = get_backend_python()
BACKEND_CMD = [BACKEND_PYTHON, 'manage.py', 'runserver']

def run_process(cmd, cwd):
    """Ejecuta un proceso en la carpeta especificada."""
    if cmd[0] == 'npm':
        return subprocess.Popen(' '.join(cmd), cwd=cwd, shell=True)
    else:
        return subprocess.Popen(cmd, cwd=cwd)

def main():
    # Ejecutar scripts de creación de cuestionarios
    for nombre, script in [('Cuestionario 1', 'cuestionario1.py'), ('Cuestionario 2', 'cuestionario2.py'), ('Cuestionario 3', 'cuestionario3.py')]:
        print(f'Verificando {nombre}...')
        script_path = os.path.join(BACKEND_DIR, 'scripts', script)
        try:
            result = subprocess.run(
                [BACKEND_PYTHON, script_path],
                cwd=BACKEND_DIR,
                capture_output=True,
                text=True,
                timeout=30
            )
            if result.returncode == 0:
                print(f'[OK] {nombre} verificado/creado exitosamente')
            else:
                print(f'[ADVERTENCIA] Error: {result.stderr}')
        except Exception as e:
            print(f'[ADVERTENCIA] Error: {e}')
    
    # Iniciar servidores
    print('\nIniciando backend (Django)...')
    backend_proc = run_process(BACKEND_CMD, BACKEND_DIR)
    
    print('Iniciando frontend (Vite/React)...')
    frontend_proc = run_process(FRONTEND_CMD, FRONTEND_DIR)
    
    print('\n' + '='*50)
    print('Servidores iniciados. Presione Ctrl+C para detenerlos.')
    print('='*50)
    print('Frontend (React/Vite):  http://localhost:5173')
    print('Backend (Django API):   http://localhost:8000')
    print('='*50 + '\n')
    
    try:
        backend_proc.wait()
        frontend_proc.wait()
    except KeyboardInterrupt:
        print('\nDeteniendo servidores...')
        backend_proc.terminate()
        frontend_proc.terminate()
        print('Servidores detenidos.')

if __name__ == '__main__':
    main()
