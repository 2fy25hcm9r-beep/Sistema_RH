# Sistema de evaluación de rendimiento RH

Aplicación web integral para medir el rendimiento del área de Recursos Humanos mediante encuestas periódicas, con control de acceso por número de empleado, visualización gráfica avanzada del progreso y una experiencia de usuario moderna y optimizada.

---

## Novedades y mejoras recientes

- **Autenticación JWT**: Sistema seguro de login con tokens de acceso y refresh
- **Encuestas públicas**: Empleados pueden responder encuestas usando solo su número de empleado
- **Dashboard avanzado**: KPIs, gráficas de progreso por período, rendimiento por departamento
- **Reportes detallados**: Análisis por pregunta, participación por encuesta, evaluación de rendimiento
- **Gestión de empleados**: Alta masiva, habilitación/deshabilitación de acceso a encuestas
- **Interfaz moderna**: Diseño limpio con React, TypeScript y CSS Modules
- **Validaciones robustas**: Manejo de errores en frontend y backend
- **Flujo de recuperación de contraseña rediseñado**: Eliminado CAPTCHA y auto-reseteo; ahora el usuario solicita restablecimiento y el admin aprueba y establece una contraseña temporal.
- **Optimización de base de datos**: Queries optimizadas con select_related y prefetch_related

---

## Tecnologías

### Backend (`servidor/`)
- Python 3.12 + Django 6.0
- Django REST Framework + JWT (simplejwt)
- MySQL 8.0
- django-cors-headers, django-filter

### Frontend (`cliente/`)
- Vite + React 18 + TypeScript
- react-router-dom, Axios, Chart.js + react-chartjs-2
- CSS Modules para estilos

---

## Estructura del proyecto

```
rh_proyect/
├── servidor/           # Backend Django
│   ├── config/         # Configuración del proyecto
│   ├── apps/
│   │   ├── usuarios/   # Empleados, Departamentos, Usuarios del sistema
│   │   ├── encuestas/  # Encuestas, Preguntas, Respuestas, Accesos
│   │   └── reportes/   # Endpoints de gráficas y reportes
│   ├── manage.py
│   ├── requirements.txt
│   ├── .env
│   └── venv/           # Entorno virtual
├── cliente/            # Frontend React
│   ├── src/
│   │   ├── pages/      # Login, Dashboard, Empleados, Encuestas, Reportes, Perfil
│   │   ├── components/ # Navbar, PrivateRoute
│   │   ├── context/    # AuthContext (JWT)
│   │   ├── api/        # Axios configurado
│   │   └── types/      # TypeScript interfaces
│   ├── package.json
│   └── vite.config.ts
├── run_all.py          # Script para ejecutar ambos servidores
└── README.md
```

---

## Instalación y configuración

### Requisitos previos
- Python 3.12
- Node.js 18+
- MySQL 8.0+
- Git(opcional)

### 1. Base de datos MySQL

```sql
CREATE DATABASE rh_proyect CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Backend

```bash
cd servidor

# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux/Mac

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
# Crear archivo .env con:
# DB_NAME=rh_proyect
# DB_USER=root
# DB_PASSWORD=tu_contraseña
# DB_HOST=localhost
# DB_PORT=3306
# SECRET_KEY=tu_clave_secreta
# DEBUG=True
# ALLOWED_HOSTS=localhost,127.0.0.1

# Ejecutar migraciones
python manage.py migrate

# Crear superusuario (opcional para admin)
python manage.py createsuperuser
```

### 3. Frontend

```bash
cd cliente

# Instalar dependencias
npm install

# Compilar para producción (opcional)
npm run build
```

### 4. Ejecutar la aplicación

**Opción A: Ejecutar ambos servidores con un script**

```bash
# Desde la raíz del proyecto
python run_all.py
```

Esto iniciará:
- Backend Django en `http://localhost:8000`
- Frontend Vite en `http://localhost:5173`

Abre tu navegador en `http://localhost:5173`

**Opción B: Ejecutar servidores por separado**

Terminal 1 (Backend):
```bash
cd servidor
venv\Scripts\activate
python manage.py runserver
```

Terminal 2 (Frontend):
```bash
cd cliente
npm run dev
```

---

## Credenciales de prueba

Después de ejecutar las migraciones, puedes crear un usuario de prueba:

```bash
cd servidor
python manage.py createsuperuser
```

O usar el endpoint de registro en la aplicación:
- URL: `http://localhost:5173/registro`
- Crea un usuario con rol "RH" o "Administrador"

---

## API Endpoints Principales

### Autenticación
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/token/` | Login → Obtener JWT |
| POST | `/api/token/refresh/` | Renovar access token |
| POST | `/api/usuarios/cuentas/` | Registrar nuevo usuario |
| GET/PATCH | `/api/usuarios/cuentas/me/` | Obtener/actualizar perfil actual |
| POST | `/api/usuarios/cuentas/cambiar-password/` | Cambiar contraseña |

### Empleados
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET/POST | `/api/usuarios/empleados/` | Listar / crear empleados |
| GET/PATCH/DELETE | `/api/usuarios/empleados/{id}/` | Obtener / actualizar / eliminar empleado |
| PATCH | `/api/usuarios/empleados/{id}/toggle-acceso/` | Habilitar/deshabilitar acceso a encuestas |
| POST | `/api/usuarios/empleados/dar-de-alta-masivo/` | Alta masiva por lista de números |

### Encuestas
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET/POST | `/api/encuestas/` | Listar / crear encuestas |
| GET/PATCH/DELETE | `/api/encuestas/{id}/` | Obtener / actualizar / eliminar encuesta |
| POST | `/api/encuestas/{id}/asignar-empleados/` | Asignar empleados por número |
| GET | `/api/encuestas/{id}/empleados-asignados/` | Listar empleados asignados |
| POST | `/api/encuestas/{id}/responder/` | Contestar encuesta (público) |
| GET | `/api/encuestas/{id}/progreso/` | Progreso de la encuesta |

### Reportes
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/reportes/dashboard/` | KPIs generales |
| GET | `/api/reportes/progreso/?periodo=mes` | Gráfica por semana/mes/año |
| GET | `/api/reportes/por-departamento/` | Rendimiento por departamento |
| GET | `/api/reportes/por-pregunta/{encuesta_id}/` | Promedio por pregunta |
| GET | `/api/reportes/participacion/` | Participación por encuesta |

---

## Modelos de datos (Django ORM)

- **Usuario** – Extiende `AbstractUser` con roles (admin, rh, visor)
- **Departamento** – Área de la empresa
- **Empleado** – Identificado por `numero_empleado`, con flag `puede_contestar_encuesta`
- **Encuesta** – Título, fechas, estado (borrador/activa/cerrada)
- **Pregunta** – Tipos: escala 1-5, opción múltiple, sí/no, texto libre
- **OpcionRespuesta** – Opciones para preguntas categóricas con valor numérico
- **AccesoEncuesta** – Control granular de qué empleado puede contestar qué encuesta
- **RespuestaEncuesta** – Registro de respuesta completa con puntaje calculado
- **RespuestaPregunta** – Respuesta individual a cada pregunta

---

## Flujo del sistema

1. **Administrador** inicia sesión con credenciales
2. **Da de alta empleados** con su número de empleado y departamento
3. **Habilita acceso** a encuestas (`puede_contestar_encuesta = True`)
4. **Crea una encuesta** en estado borrador y agrega preguntas
5. **Asigna empleados** a la encuesta por números de empleado
6. **Activa la encuesta** (estado → `activa`)
7. **Empleados contestan** usando su número de empleado como identificación
8. **Dashboard muestra gráficas** de progreso por semana, mes y año
9. **Reportes detallados** con análisis por pregunta y departamento

## Flujo de recuperación de contraseña

1. **Usuario** olvida su contraseña y accede a `/forgot-password`.
2. **Ingresa su nombre de usuario** y envía la solicitud (sin CAPTCHA).
3. **Administrador** ingresa a la sección **Usuarios** y ve la pestaña **Solicitudes de reseteo de contraseña**.
4. **Selecciona una solicitud pendiente** y hace clic en **Restablecer**.
5. **Aparece un modal** donde el admin ingresa una nueva contraseña y confirma.
6. **Al guardar**, la contraseña del usuario se actualiza y la solicitud se marca como atendida.
7. **El usuario** puede ahora iniciar sesión con la nueva contraseña.

---

## Características principales

### Para administradores
- ✅ Gestión completa de empleados (CRUD)
- ✅ Creación y gestión de encuestas
- ✅ Asignación masiva de empleados a encuestas
- ✅ Dashboard con KPIs y gráficas
- ✅ Reportes detallados por pregunta y departamento
- ✅ Control de acceso granular

### Para empleados de RH
- ✅ Gestión completa de empleados (CRUD)
- ✅ Creación y gestión de encuestas
- ✅ Asignación masiva de empleados a encuestas
- ✅ Dashboard con KPIs y gráficas
- ✅ Reportes detallados por encuestas y preguntas

### Solo visualización
- ✅ Visualización de dashboards y reportes
- ✅ Visualización de encuestas y resultados
- ✅ Sin capacidad para crear, modificar o eliminar datos

### Seguridad
- ✅ Autenticación JWT con tokens de acceso y refresh
- ✅ Validación de permisos en backend
- ✅ CORS configurado
- ✅ Contraseñas hasheadas con Django
- ✅ Validación de datos en frontend y backend

---

## Troubleshooting

### Error: "Unknown column 'usuarios_usuario.email'"
- Asegúrate de haber ejecutado las migraciones: `python manage.py migrate`
- El campo email ya no existe en la tabla Empleado ni en Usuario

### Error: "ModuleNotFoundError: No module named 'django'"
- Activa el entorno virtual: `venv\Scripts\activate`
- Instala dependencias: `pip install -r requirements.txt`

### El frontend no se conecta al backend
- Verifica que el backend esté corriendo en `http://localhost:8000`
- Revisa la configuración de CORS en `servidor/config/settings.py`
- Asegúrate que el proxy en `cliente/vite.config.ts` apunta a `http://localhost:8000`

### Puerto 5173 o 8000 ya está en uso
- Cambia el puerto en el comando: `python manage.py runserver 8001`
- O: `npm run dev -- --port 5174`

---

## Desarrollo

### Estructura de carpetas Frontend
```
cliente/src/
├── pages/          # Componentes de página (rutas)
├── components/     # Componentes reutilizables
├── context/        # Context API (autenticación)
├── api/            # Configuración de Axios
├── types/          # Interfaces TypeScript
├── App.tsx         # Componente raíz
└── main.tsx        # Punto de entrada
```

### Estructura de carpetas Backend
```
servidor/
├── config/         # Configuración global
├── apps/
│   ├── usuarios/   # Gestión de usuarios y empleados
│   ├── encuestas/  # Gestión de encuestas
│   └── reportes/   # Endpoints de reportes
└── manage.py       # CLI de Django
```

---

## Licencia

Este proyecto es de uso interno para la empresa.

---

## Contacto y soporte

Para reportar bugs o sugerencias, contacta al equipo de desarrollo.





