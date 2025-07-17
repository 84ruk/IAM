#!/bin/bash

# Script de deploy mejorado para Fly.io
# Ejecutar: ./scripts/deploy.sh

set -e  # Salir en caso de error

echo "🚀 Iniciando deploy a Fly.io..."
echo "=================================="

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir con colores
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 1. Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ] || [ ! -f "fly.toml" ]; then
    print_error "No se encontraron package.json o fly.toml. Asegúrate de estar en el directorio del backend."
    exit 1
fi

print_success "Directorio correcto detectado"

# 2. Verificar que fly CLI está instalado
if ! command -v fly &> /dev/null; then
    print_error "Fly CLI no está instalado. Instálalo desde https://fly.io/docs/hands-on/install-flyctl/"
    exit 1
fi

print_success "Fly CLI detectado"

# 3. Verificar login en Fly
print_status "Verificando login en Fly.io..."
if ! fly auth whoami &> /dev/null; then
    print_error "No estás logueado en Fly.io. Ejecuta 'fly auth login' primero."
    exit 1
fi

print_success "Login en Fly.io verificado"

# 4. Verificar configuración de deployment
print_status "Verificando configuración..."
node scripts/check-deployment.js

# 5. Verificar variables de entorno
print_status "Verificando variables de entorno..."
node scripts/check-env.js

# 6. Instalar dependencias
print_status "Instalando dependencias..."
npm ci

# 7. Generar cliente de Prisma
print_status "Generando cliente de Prisma..."
npx prisma generate

# 8. Compilar la aplicación
print_status "Compilando la aplicación..."
npm run build

# 9. Verificar que la compilación fue exitosa
if [ ! -f "dist/main.js" ]; then
    print_error "La compilación falló. No se encontró dist/main.js"
    exit 1
fi

print_success "Compilación exitosa"

# 10. Probar inicio local (opcional)
read -p "¿Deseas probar el inicio local antes del deploy? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Probando inicio local..."
    if node scripts/test-startup.js; then
        print_success "Prueba de inicio exitosa"
    else
        print_warning "Prueba de inicio falló, pero continuando con el deploy..."
    fi
fi

# 11. Deploy a Fly
print_status "Iniciando deploy a Fly.io..."
fly deploy

# 12. Verificar el deploy
print_status "Verificando el deploy..."
sleep 10  # Esperar a que la aplicación inicie

# Verificar health check
if curl -f http://localhost:8080/health &> /dev/null; then
    print_success "Health check exitoso"
else
    print_warning "Health check falló, pero la aplicación puede estar iniciando..."
fi

# 13. Mostrar logs recientes
print_status "Mostrando logs recientes..."
fly logs --app iam-backend-baruk --limit 20

print_success "Deploy completado!"
echo ""
echo "🌐 URL de la aplicación: https://iam-backend-baruk.fly.dev"
echo "📊 Dashboard: https://fly.io/apps/iam-backend-baruk"
echo "📝 Logs: fly logs --app iam-backend-baruk"
echo ""
echo "💡 Comandos útiles:"
echo "  - Ver logs: fly logs --app iam-backend-baruk"
echo "  - Escalar: fly scale count 1 --app iam-backend-baruk"
echo "  - Variables de entorno: fly secrets list --app iam-backend-baruk" 