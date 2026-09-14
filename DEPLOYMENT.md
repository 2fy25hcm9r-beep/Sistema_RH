# Guía de despliegue - Sistema RH

Esta guía explica cómo desplegar el sistema de encuestas de RH en entornos Windows y Linux.

## Tabla de contenidos

- [Requisitos previos](#requisitos-previos)
- [Instalación en Windows](#instalación-en-windows)
- [Instalación en Linux](#instalación-en-linux)
- [Configuración de la base de datos](#configuración-de-la-base-de-datos)
- [Variables de entorno](#variables-de-entorno)
- [Ejecución del sistema](#ejecución-del-sistema)
- [Despliegue en producción](#despliegue-en-producción)
- [Despliegue con Docker](#despliegue-con-docker)

---

## Requisitos previos

### Software necesario

- **Python 3.11+**
- **Node.js 18+** y npm
- **MySQL 8.0+** o MariaDB 10.5+
- **Git** (opcional, para clonar el repositorio)
- **Docker** y **Docker Compose** (opcional, para despliegue con contenedores)

---

## Instalación en Windows

### 1. Clonar o descargar el proyecto

```bash
git clone <url-del-repositorio>
cd Sistema_RH
```

### 2. Configurar el backend (Django)

#### 2.1. Crear entorno virtual

```bash
cd servidor
python -m venv venv
```

#### 2.2. Activar entorno virtual

```bash
venv\Scripts\activate
```

#### 2.3. Instalar dependencias

```bash
pip install -r requirements.txt
```

#### 2.4. Configurar variables de entorno

Crear archivo `.env` en la carpeta `servidor`:

```env
# Base de datos
DB_NAME=rh_proyect
DB_USER=root
DB_PASSWORD=
DB_HOST=localhost
DB_PORT=3306

# Django
SECRET_KEY=tu-clave-secreta-aqui
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

#### 2.5. Crear la base de datos

Abrir MySQL y ejecutar:

```sql
CREATE DATABASE Sistema_RH CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

O importar el script SQL:

```bash
mysql -u root -p < db/Sistema_RH.sql
```

#### 2.6. Aplicar migraciones

```bash
python manage.py migrate
```

#### 2.7. Crear superusuario (Opcional)

```bash
python manage.py createsuperuser
```

### 3. Configurar el frontend (React + Vite)

#### 3.1. Instalar dependencias

```bash
cd ..\cliente
npm install
```

#### 3.2. Configurar Variables de Entorno (Opcional)

Crear archivo `.env` en la carpeta `cliente`:

```env
VITE_API_URL=http://localhost:8000
```

### 4. Ejecutar el Sistema

Desde la raíz del proyecto:

```bash
python run_all.py
```

Esto iniciará:
- Backend en `http://localhost:8000`
- Frontend en `http://localhost:5173`

---

## Instalación en Linux

### 1. Clonar o descargar el Proyecto

```bash
git clone <url-del-repositorio>
cd Sistema_RH
```

### 2. Configurar el backend (Django)

#### 2.1. Instalar Python y dependencias del sistema

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install python3 python3-pip python3-venv mysql-server

# CentOS/RHEL
sudo yum install python3 python3-pip mysql-server
```

#### 2.2. Crear entorno virtual

```bash
cd servidor
python3 -m venv venv
```

#### 2.3. Activar entorno virtual

```bash
source venv/bin/activate
```

#### 2.4. Instalar dependencias

```bash
pip install -r requirements.txt
```

#### 2.5. Configurar variables de entorno

Crear archivo `.env` en la carpeta `servidor` (basado en `.env.production`):

```env
# Base de datos
DB_NAME=rh_proyect
DB_USER=root
DB_PASSWORD=tu_password
DB_HOST=localhost
DB_PORT=3306

# Django
SECRET_KEY=tu-clave-secreta-generada-aleatoriamente
DEBUG=False
ALLOWED_HOSTS=tu-dominio.com,tu-ip-servidor

# Frontend
FRONTEND_URL=https://tu-dominio.com

# CORS
CORS_ALLOWED_ORIGINS=https://tu-dominio.com

# HTTPS
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
SECURE_SSL_REDIRECT=True
SECURE_HSTS_SECONDS=31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS=True
```

#### 2.6. Crear la base de datos

```bash
sudo mysql -u root -p
```

```sql
CREATE DATABASE rh_proyect CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'rh_user'@'localhost' IDENTIFIED BY 'password_seguro';
GRANT ALL PRIVILEGES ON rh_proyect.* TO 'rh_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

O importar el script SQL:

```bash
mysql -u root -p < db/Sistema_RH.sql
```

#### 2.7. Aplicar migraciones

```bash
python manage.py migrate
```

#### 2.8. Crear superusuario

```bash
python manage.py createsuperuser
```

#### 2.9. Recolectar archivos estáticos (Producción)

```bash
python manage.py collectstatic --noinput
```

### 3. Configurar el frontend (React + Vite)

#### 3.1. Instalar node.js

```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs
```

#### 3.2. Instalar dependencias

```bash
cd ../cliente
npm install
```

#### 3.3. Construir para producción

```bash
npm run build
```

Esto generará los archivos en `cliente/dist/`

### 4. Ejecutar el sistema (Desarrollo)

Desde la raíz del proyecto:

```bash
python run_all.py
```

---

## Configuración de la base de datos

### Estructura de la base de datos

El sistema utiliza las siguientes tablas principales:

- `usuarios_usuario` - Usuarios del sistema
- `usuarios_empleado` - Empleados que responden encuestas
- `usuarios_departamento` - Departamentos de la empresa
- `encuestas_encuesta` - Encuestas creadas
- `encuestas_pregunta` - Preguntas de las encuestas
- `encuestas_opcionrespuesta` - Opciones de respuesta
- `encuestas_respuestaencuesta` - Respuestas completadas
- `encuestas_respuestapregunta` - Respuestas individuales

### Script de base de datos

El archivo `servidor/db/Sistema_RH.sql` contiene la estructura completa de la base de datos.

Para importarlo:

**Windows:**
```bash
mysql -u root -p < servidor\db\Sistema_RH.sql
```

**Linux:**
```bash
mysql -u root -p < servidor/db/Sistema_RH.sql
```

---

## Variables de entorno

### Backend (servidor/.env y servidor/.env.production)

**Desarrollo (servidor/.env):**
```env
# Base de datos
DB_NAME=rh_proyect
DB_USER=root
DB_PASSWORD=
DB_HOST=localhost
DB_PORT=3306

# Django
SECRET_KEY=tu-clave-secreta-aqui
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

**Producción (servidor/.env.production):**
```env
# Django (OBLIGATORIO cambiar)
SECRET_KEY=eU6usUWL-Rsze!@iQfOic1xtPRZ+3Ym^IjMYdeeBhjDs-F7+f_
DEBUG=False
ALLOWED_HOSTS=

# Base de datos MySQL
DB_NAME=rh_proyect
DB_USER=root
DB_PASSWORD=
DB_HOST=localhost
DB_PORT=3306

# Frontend
FRONTEND_URL=

# CORS (dominios de producción)
CORS_ALLOWED_ORIGINS=
CSRF_TRUSTED_ORIGINS=

# HTTPS
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
SECURE_SSL_REDIRECT=True
SECURE_HSTS_SECONDS=31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS=True
```

### Frontend (cliente/.env)

```env
VITE_API_URL=http://localhost:8000
```

---

## Ejecución del sistema

### Modo desarrollo

#### Opción 1: Script automático (Recomendado)

```bash
python run_all.py
```

Este script:
- Verifica/crea la encuesta predeterminada
- Inicia el backend en el puerto 8000
- Inicia el frontend en el puerto 5173

#### Opción 2: Manual

**Terminal 1 - Backend:**
```bash
cd servidor
# Windows
venv\Scripts\activate
# Linux
source venv/bin/activate

python manage.py runserver
```

**Terminal 2 - Frontend:**
```bash
cd cliente
npm run dev
```

### Acceso al sistema

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000
- **Admin Django:** http://localhost:8000/admin
- **Responder Encuesta:** http://localhost:5173/encuesta/{id}/responder

---

## Despliegue en producción

### Opción 1: Servidor Linux con Nginx + Gunicorn

#### 1. Instalar Gunicorn

```bash
cd servidor
source venv/bin/activate
pip install gunicorn
```

#### 2. Crear servicio Systemd para backend

Crear archivo `/etc/systemd/system/rh-backend.service`:

```ini
[Unit]
Description=RH Backend Django
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/ruta/al/proyecto/servidor
Environment="PATH=/ruta/al/proyecto/servidor/venv/bin"
ExecStart=/ruta/al/proyecto/servidor/venv/bin/gunicorn \
    --workers 3 \
    --bind 127.0.0.1:8000 \
    config.wsgi:application

[Install]
WantedBy=multi-user.target
```

Activar el servicio:

```bash
sudo systemctl daemon-reload
sudo systemctl enable rh-backend
sudo systemctl start rh-backend
```

#### 3. Configurar Nginx

Crear archivo `/etc/nginx/sites-available/rh-system`:

```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    # Frontend (archivos estáticos de React)
    location / {
        root /ruta/al/proyecto/cliente/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Admin Django
    location /admin/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Archivos estáticos de Django
    location /static/ {
        alias /ruta/al/proyecto/servidor/staticfiles/;
    }

    # Archivos media
    location /media/ {
        alias /ruta/al/proyecto/servidor/media/;
    }
}
```

Activar el sitio:

```bash
sudo ln -s /etc/nginx/sites-available/Sistema_RH /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 4. Configurar SSL con Let's Encrypt (Opcional)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d tu-dominio.com
```

### Opción 2: Servidor Windows con IIS

#### 1. Instalar IIS y Módulos

- Habilitar IIS desde "Características de Windows"
- Instalar [HttpPlatformHandler](https://www.iis.net/downloads/microsoft/httpplatformhandler)

#### 2. Configurar backend como aplicación IIS

Crear archivo `web.config` en la carpeta `servidor`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <handlers>
      <add name="httpPlatformHandler" path="*" verb="*" 
           modules="httpPlatformHandler" resourceType="Unspecified" />
    </handlers>
    <httpPlatform processPath="C:\ruta\al\proyecto\servidor\venv\Scripts\python.exe"
                  arguments="manage.py runserver 127.0.0.1:8000"
                  startupTimeLimit="60"
                  stdoutLogEnabled="true"
                  stdoutLogFile=".\logs\stdout.log">
    </httpPlatform>
  </system.webServer>
</configuration>
```

#### 3. Configurar frontend

Copiar los archivos de `cliente/dist/` a la carpeta raíz del sitio IIS.

### Opción 3: Docker (Multiplataforma)

El proyecto incluye Dockerfiles optimizados para producción:

- **Backend (`servidor/Dockerfile`)**: Build multi-etapa con Python 3.11-slim, usuario no-root (`app`), healthcheck en `/api/health/`, y `entrypoint.sh`.
- **Frontend (`cliente/Dockerfile`)**: Build multi-etapa con Node 20-alpine, nginx Alpine, healthcheck en `http://localhost:80`, y configuración personalizada de nginx para SPA.

Crear `docker-compose.yml` para orquestar ambos servicios:

```yaml
version: '3.8'

services:
  db:
    image: mysql:8.0
    environment:
      MYSQL_DATABASE: rh_proyect
      MYSQL_ROOT_PASSWORD: ${DB_PASSWORD:-password}
    volumes:
      - mysql_data:/var/lib/mysql
    ports:
      - "3306:3306"

  backend:
    build:
      context: ./servidor
      dockerfile: Dockerfile
    container_name: rh_backend
    restart: always
    env_file:
      - ./servidor/.env.production
    volumes:
      - ./servidor/interface/static/images/profiles:/app/interface/static/images/profiles
    ports:
      - "8000:8000"
    depends_on:
      - db

  frontend:
    build:
      context: ./cliente
      dockerfile: Dockerfile
    container_name: rh_frontend
    restart: always
    volumes:
      - ./cliente/dist:/usr/share/nginx/html:ro
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  mysql_data:
```

Ejecutar:

```bash
docker-compose up -d --build
```

Para producción con HTTPS, colocar detrás de un proxy inverso (Traefik, Nginx Proxy Manager) y configurar certificados SSL.

---

## Solución de problemas

### Error de conexión a base de datos

**Síntoma:** `django.db.utils.OperationalError: (2003, "Can't connect to MySQL server")`

**Solución:**
1. Verificar que MySQL esté ejecutándose
2. Verificar credenciales en `.env`
3. Verificar que el usuario tenga permisos

### Error de CORS

**Síntoma:** `Access to XMLHttpRequest has been blocked by CORS policy`

**Solución:**
1. Verificar `CORS_ALLOWED_ORIGINS` en `servidor/.env`
2. Agregar el origen del frontend (ej: `http://localhost:5173`)

### Error de migraciones

**Síntoma:** `django.db.migrations.exceptions.InconsistentMigrationHistory`

**Solución:**
```bash
python manage.py migrate --fake
```

### Puerto en uso

**Síntoma:** `Error: That port is already in use`

**Solución Windows:**
```bash
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

**Solución Linux:**
```bash
lsof -ti:8000 | xargs kill -9
```

---

## Mantenimiento

### Backup de base de datos

**Windows:**
```bash
mysqldump -u root -p rh_proyect > backup_%date:~-4,4%%date:~-7,2%%date:~-10,2%.sql
```

**Linux:**
```bash
mysqldump -u root -p rh_proyect > backup_$(date +%Y%m%d).sql
```

### Actualizar dependencias

**Backend:**
```bash
cd servidor
source venv/bin/activate  # Linux
venv\Scripts\activate     # Windows
pip install --upgrade -r requirements.txt
```

**Frontend:**
```bash
cd cliente
npm update
```

### Logs

**Backend (Django):**
- Logs en consola durante desarrollo
- Configurar logging en `servidor/config/settings.py` para producción
- En Docker: \`docker logs rh_backend\`
- Healthcheck en \`http://localhost:8000/api/health/\`

**Frontend (React + Vite):**
- Logs en consola del navegador
- Logs de build en terminal
- En Docker: \`docker logs rh_frontend\`
- Healthcheck en \`http://localhost:80\`

---

## Contacto y soporte

Para reportar problemas o solicitar ayuda, contactar al equipo de desarrollo.

---

**Última actualización:** Agosto 2026
