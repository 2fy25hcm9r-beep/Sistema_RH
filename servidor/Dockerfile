FROM python:3.11-slim-bookworm

# Dependencias necesarias para mysqlclient
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    default-libmysqlclient-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Instalar dependencias de Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el backend Django
COPY . .

# Permisos para el entrypoint
RUN chmod +x /entrypoint.sh

# Puerto utilizado por Railway
EXPOSE 8000

# Iniciar migraciones, archivos estáticos y Gunicorn
ENTRYPOINT ["/entrypoint.sh"]
