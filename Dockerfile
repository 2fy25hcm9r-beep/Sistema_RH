FROM python:3.11-slim

# ============================================================
# Dependencias del sistema
# Necesarias para mysqlclient
# ============================================================
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    default-libmysqlclient-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# ============================================================
# Directorio de trabajo
# ============================================================
WORKDIR /app

# ============================================================
# Instalar dependencias de Python
# ============================================================
COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# ============================================================
# Copiar todo el proyecto
# ============================================================
COPY . .

# ============================================================
# Configuración de Python
# ============================================================
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# ============================================================
# Puerto de Railway
# ============================================================
EXPOSE 8000

# ============================================================
# Iniciar Django con Gunicorn
#
# El proyecto Django está dentro de /app/servidor
# y config está dentro de /app/servidor/config
# ============================================================
CMD ["gunicorn", "--chdir", "servidor", "config.wsgi:application", "--bind", "0.0.0.0:8000"]
