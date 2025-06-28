#!/bin/bash

# Script de despliegue para IAM System
echo "🚀 Iniciando despliegue de IAM System..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

print_status "Verificando archivos de configuración..."

# Verificar que existan los Dockerfiles
if [ ! -f "iam-backend/Dockerfile" ]; then
    print_error "Dockerfile del backend no encontrado en iam-backend/"
    exit 1
fi

if [ ! -f "iam-frontend/Dockerfile" ]; then
    print_error "Dockerfile del frontend no encontrado en iam-frontend/"
    exit 1
fi

print_status "Configurando variables de entorno..."

# Verificar si existe el archivo .env
if [ ! -f ".env" ]; then
    print_warning "Archivo .env no encontrado."
    print_info "Creando archivo .env desde env.example..."
    
    if [ -f "env.example" ]; then
        cp env.example .env
        print_warning "Archivo .env creado desde env.example."
        print_warning "⚠️  IMPORTANTE: Edita el archivo .env con tus credenciales reales antes de continuar."
        print_warning "⚠️  NUNCA commitees el archivo .env con credenciales reales."
        exit 1
    else
        print_error "Archivo env.example no encontrado. Por favor, crea tu archivo .env manualmente."
        exit 1
    fi
fi

# Verificar variables críticas
if ! grep -q "DATABASE_URL=" .env || grep -q "postgresql://usuario:contraseña" .env; then
    print_error "❌ DATABASE_URL no está configurada correctamente en .env"
    print_warning "Por favor, edita el archivo .env con tus credenciales reales."
    exit 1
fi

if ! grep -q "JWT_SECRET=" .env || grep -q "tu_clave_secreta" .env; then
    print_error "❌ JWT_SECRET no está configurada correctamente en .env"
    print_warning "Por favor, edita el archivo .env con una clave secreta real."
    exit 1
fi

print_status "Deteniendo contenedores existentes..."
docker-compose down

print_status "Construyendo imágenes..."
docker-compose build --no-cache

print_status "Iniciando servicios..."
docker-compose up -d

print_status "Esperando que los servicios estén listos..."
sleep 30

print_status "Ejecutando migraciones de la base de datos..."
docker-compose exec backend npx prisma migrate deploy

print_status "Generando cliente de Prisma..."
docker-compose exec backend npx prisma generate

print_status "Verificando estado de los servicios..."

# Verificar que el backend esté funcionando
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    print_status "✅ Backend funcionando correctamente en http://localhost:3001"
else
    print_error "❌ Backend no está respondiendo"
fi

# Verificar que el frontend esté funcionando
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    print_status "✅ Frontend funcionando correctamente en http://localhost:3000"
else
    print_error "❌ Frontend no está respondiendo"
fi

print_status "🎉 Despliegue completado!"
echo ""
echo "📋 Resumen del despliegue:"
echo "   • Frontend: http://localhost:3000"
echo "   • Backend API: http://localhost:3001"
echo "   • Base de datos: localhost:5432"
echo ""
echo "🔧 Comandos útiles:"
echo "   • Ver logs: docker-compose logs -f"
echo "   • Detener: docker-compose down"
echo "   • Reiniciar: docker-compose restart"
echo "   • Ver estado: docker-compose ps"
echo ""
print_warning "🔒 IMPORTANTE: Asegúrate de que tu archivo .env esté en .gitignore"
print_warning "🔒 IMPORTANTE: Nunca commitees credenciales reales al repositorio"
print_warning "🔒 IMPORTANTE: Cambia las contraseñas por defecto en producción!" 