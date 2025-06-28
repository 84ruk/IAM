#!/bin/bash

# Script de despliegue para Fly.io (Backend) y Vercel (Frontend)
# Autor: Baruk Ramos
# Fecha: 2025-06-27

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir mensajes con colores
print_message() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

# Verificar que estamos en la rama correcta
check_branch() {
    current_branch=$(git branch --show-current)
    if [ "$current_branch" != "deploy/fly-vercel" ]; then
        print_error "Debes estar en la rama 'deploy/fly-vercel' para desplegar"
        print_message "Ejecuta: git checkout deploy/fly-vercel"
        exit 1
    fi
}

# Verificar que Fly CLI esté instalado
check_fly_cli() {
    if ! command -v fly &> /dev/null; then
        print_error "Fly CLI no está instalado"
        print_message "Instala Fly CLI desde: https://fly.io/docs/hands-on/install-flyctl/"
        exit 1
    fi
}

# Verificar que Vercel CLI esté instalado
check_vercel_cli() {
    if ! command -v vercel &> /dev/null; then
        print_error "Vercel CLI no está instalado"
        print_message "Instala Vercel CLI con: npm i -g vercel"
        exit 1
    fi
}

# Verificar variables de entorno
check_environment() {
    print_header "Verificando variables de entorno"
    
    if [ -z "$DATABASE_URL" ]; then
        print_error "DATABASE_URL no está configurada"
        print_message "Configura la variable DATABASE_URL con tu base de datos PostgreSQL"
        exit 1
    fi
    
    if [ -z "$JWT_SECRET" ]; then
        print_error "JWT_SECRET no está configurada"
        print_message "Configura la variable JWT_SECRET"
        exit 1
    fi
    
    print_message "Variables de entorno verificadas ✓"
}

# Desplegar backend en Fly.io
deploy_backend() {
    print_header "Desplegando Backend en Fly.io"
    
    cd iam-backend
    
    # Verificar si la app ya existe
    if fly apps list | grep -q "iam-backend"; then
        print_message "App iam-backend ya existe, actualizando..."
        fly deploy
    else
        print_message "Creando nueva app iam-backend..."
        fly launch --no-deploy --name iam-backend
        
        # Configurar variables de entorno
        fly secrets set DATABASE_URL="$DATABASE_URL"
        fly secrets set JWT_SECRET="$JWT_SECRET"
        fly secrets set NODE_ENV="production"
        fly secrets set FRONTEND_URL="$FRONTEND_URL"
        
        # Desplegar
        fly deploy
    fi
    
    cd ..
    print_message "Backend desplegado exitosamente ✓"
}

# Desplegar frontend en Vercel
deploy_frontend() {
    print_header "Desplegando Frontend en Vercel"
    
    cd iam-frontend
    
    # Verificar si ya está configurado Vercel
    if [ ! -f ".vercel/project.json" ]; then
        print_message "Configurando Vercel..."
        vercel --yes
    else
        print_message "Actualizando despliegue en Vercel..."
        vercel --prod
    fi
    
    cd ..
    print_message "Frontend desplegado exitosamente ✓"
}

# Función principal
main() {
    print_header "🚀 Despliegue IAM - Fly.io + Vercel"
    
    # Verificaciones previas
    check_branch
    check_fly_cli
    check_vercel_cli
    check_environment
    
    # Desplegar backend
    deploy_backend
    
    # Obtener URL del backend
    BACKEND_URL=$(fly status --app iam-backend | grep "Hostname" | awk '{print $2}')
    print_message "Backend URL: https://$BACKEND_URL"
    
    # Configurar URL del backend para el frontend
    export NEXT_PUBLIC_API_URL="https://$BACKEND_URL"
    
    # Desplegar frontend
    deploy_frontend
    
    print_header "✅ Despliegue completado exitosamente"
    print_message "Backend: https://$BACKEND_URL"
    print_message "Frontend: Se mostrará la URL al finalizar el despliegue"
    print_message ""
    print_message "Recuerda configurar las variables de entorno en Vercel:"
    print_message "- NEXT_PUBLIC_API_URL: https://$BACKEND_URL"
}

# Ejecutar función principal
main "$@" 