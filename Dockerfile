FROM python:3.11-slim

# Dependencias del sistema necesarias para mysqlclient
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    default-libmysqlclient-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Instalar dependencias Python
COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# Copiar el proyecto
COPY . .

# Configuración de Python
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Railway utiliza el puerto 8000
EXPOSE 8000

# Iniciar Django
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000"]
