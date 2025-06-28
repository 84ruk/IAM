#!/bin/bash

# Script de despliegue para PRODUCCIÓN - IAM System
echo "🚀 Iniciando despliegue de PRODUCCIÓN para IAM System..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para mostrar mensajes
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Verificar que estemos en producción
if [ "$NODE_ENV" != "production" ]; then
    print_warning "NODE_ENV no está configurado como 'production'"
    print_info "Configurando NODE_ENV=production..."
    export NODE_ENV=production
fi

# Verificar que Docker esté instalado
if ! command -v docker &> /dev/null; then
    print_error "Docker no está instalado. Por favor, instala Docker primero."
    exit 1
fi

# Verificar que Docker Compose esté instalado
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose no está instalado. Por favor, instala Docker Compose primero."
    exit 1
fi

print_status "🔒 Verificando configuración de seguridad para producción..."

# Verificar variables de entorno críticas
required_vars=("DATABASE_URL" "JWT_SECRET" "FRONTEND_URL")
missing_vars=()

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    print_error "❌ Variables de entorno faltantes: ${missing_vars[*]}"
    print_info "Por favor, configura estas variables antes de continuar:"
    for var in "${missing_vars[@]}"; do
        echo "  export $var='tu_valor'"
    done
    print_warning "🔒 IMPORTANTE: Usa credenciales fuertes y únicas para producción"
    exit 1
fi

# Verificar que las credenciales no sean las de ejemplo
if [[ "$DATABASE_URL" == *"usuario:contraseña"* ]]; then
    print_error "❌ DATABASE_URL contiene credenciales de ejemplo"
    print_warning "Por favor, configura credenciales reales para producción"
    exit 1
fi

if [[ "$JWT_SECRET" == *"tu_clave_secreta"* ]]; then
    print_error "❌ JWT_SECRET contiene valor de ejemplo"
    print_warning "Por favor, genera una clave secreta real para producción"
    print_info "Puedes generar una clave segura con: openssl rand -base64 32"
    exit 1
fi

print_status "🔒 Verificando archivos de configuración seguros..."

# Verificar que no haya credenciales hardcodeadas en archivos
if grep -r "password\|secret\|key" --include="*.ts" --include="*.js" --include="*.json" src/ | grep -v "example\|test" | grep -E "(password|secret|key)" > /dev/null; then
    print_warning "⚠️  Se encontraron posibles credenciales hardcodeadas en el código"
    print_warning "Por favor, revisa y elimina cualquier credencial del código fuente"
fi

print_status "Creando archivo .env para producción..."

# Crear archivo .env para producción (sin credenciales hardcodeadas)
cat > .env.production << EOF
# Configuración de PRODUCCIÓN
NODE_ENV=production

# Base de datos
DATABASE_URL=${DATABASE_URL}

# JWT
JWT_SECRET=${JWT_SECRET}

# Servidor
PORT=3001

# CORS
FRONTEND_URL=${FRONTEND_URL}

# Logging
LOG_LEVEL=info

# Seguridad
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EOF

print_status "Configurando Docker Compose para producción..."

# Crear docker-compose.prod.yml (sin credenciales hardcodeadas)
cat > docker-compose.prod.yml << EOF
version: '3.8'

services:
  # Base de datos PostgreSQL (usar servicio externo en producción)
  postgres:
    image: postgres:15
    container_name: iam_postgres_prod
    environment:
      POSTGRES_DB: iam_db
      POSTGRES_USER: \${POSTGRES_USER}
      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    networks:
      - iam_network
    restart: unless-stopped

  # Backend NestJS
  backend:
    build:
      context: ./iam-backend
      dockerfile: Dockerfile
      args:
        NODE_ENV: production
    container_name: iam_backend_prod
    environment:
      NODE_ENV: production
      DATABASE_URL: \${DATABASE_URL}
      JWT_SECRET: \${JWT_SECRET}
      FRONTEND_URL: \${FRONTEND_URL}
      PORT: 3001
    ports:
      - "3001:3001"
    depends_on:
      - postgres
    networks:
      - iam_network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Frontend Next.js
  frontend:
    build:
      context: ./iam-frontend
      dockerfile: Dockerfile
      args:
        NODE_ENV: production
    container_name: iam_frontend_prod
    environment:
      NODE_ENV: production
      NEXT_PUBLIC_API_URL: \${FRONTEND_URL}
    ports:
      - "3000:3000"
    depends_on:
      - backend
    networks:
      - iam_network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Nginx como reverse proxy
  nginx:
    image: nginx:alpine
    container_name: iam_nginx_prod
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.prod.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - backend
      - frontend
    networks:
      - iam_network
    restart: unless-stopped

volumes:
  postgres_data:

networks:
  iam_network:
    driver: bridge
EOF

print_status "Creando configuración de Nginx..."

# Crear configuración de Nginx para producción
cat > nginx.prod.conf << EOF
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:3001;
    }

    upstream frontend {
        server frontend:3000;
    }

    # Rate limiting
    limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone \$binary_remote_addr zone=web:10m rate=30r/s;

    server {
        listen 80;
        server_name _;

        # Redirect HTTP to HTTPS
        return 301 https://\$server_name\$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name _;

        # SSL Configuration (ajustar según tu certificado)
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;

        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

        # API routes
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://backend;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }

        # Health check
        location /health {
            proxy_pass http://backend;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }

        # Frontend routes
        location / {
            limit_req zone=web burst=50 nodelay;
            proxy_pass http://frontend;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }
    }
}
EOF

print_status "🔒 Verificando permisos de archivos sensibles..."

# Asegurar que los archivos de configuración tengan permisos correctos
chmod 600 .env.production
chmod 644 nginx.prod.conf

print_status "Deteniendo servicios existentes..."
docker-compose -f docker-compose.prod.yml down

print_status "Construyendo imágenes para producción..."
docker-compose -f docker-compose.prod.yml build --no-cache

print_status "Iniciando servicios de producción..."
docker-compose -f docker-compose.prod.yml up -d

print_status "Esperando que los servicios estén listos..."
sleep 45

print_status "Ejecutando migraciones de la base de datos..."
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy

print_status "Generando cliente de Prisma..."
docker-compose -f docker-compose.prod.yml exec backend npx prisma generate

print_status "Verificando estado de los servicios..."

# Verificar que el backend esté funcionando
if curl -f https://localhost/health > /dev/null 2>&1; then
    print_status "✅ Backend funcionando correctamente"
else
    print_warning "⚠️  Backend no responde en HTTPS, verificando HTTP..."
    if curl -f http://localhost:3001/health > /dev/null 2>&1; then
        print_status "✅ Backend funcionando en HTTP"
    else
        print_error "❌ Backend no está respondiendo"
    fi
fi

# Verificar que el frontend esté funcionando
if curl -f https://localhost > /dev/null 2>&1; then
    print_status "✅ Frontend funcionando correctamente"
else
    print_warning "⚠️  Frontend no responde en HTTPS, verificando HTTP..."
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        print_status "✅ Frontend funcionando en HTTP"
    else
        print_error "❌ Frontend no está respondiendo"
    fi
fi

print_status "🎉 Despliegue de PRODUCCIÓN completado!"
echo ""
echo "📋 Resumen del despliegue:"
echo "   • Frontend: https://localhost (o http://localhost:3000)"
echo "   • Backend API: https://localhost/api (o http://localhost:3001)"
echo "   • Health Check: https://localhost/health"
echo "   • Base de datos: localhost:5432"
echo ""
echo "🔧 Comandos útiles:"
echo "   • Ver logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "   • Detener: docker-compose -f docker-compose.prod.yml down"
echo "   • Reiniciar: docker-compose -f docker-compose.prod.yml restart"
echo "   • Ver estado: docker-compose -f docker-compose.prod.yml ps"
echo ""
print_warning "🔒 IMPORTANTE: Configura SSL/HTTPS con certificados válidos para producción!"
print_warning "🔒 IMPORTANTE: Cambia las contraseñas por defecto!"
print_warning "🔒 IMPORTANTE: Configura backups automáticos!"
print_warning "🔒 IMPORTANTE: Monitorea logs y acceso al sistema!"
print_warning "🔒 IMPORTANTE: Rota las claves JWT regularmente!" 