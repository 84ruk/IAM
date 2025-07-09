#!/bin/bash

# Script para configurar Google OAuth - IAM System
echo "🔐 Configurador de Google OAuth - IAM System"

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

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

echo ""
print_info "🔐 Configurando Google OAuth para tu aplicación..."
echo ""

print_status "📋 Pasos para configurar Google OAuth:"
echo ""

print_info "1. Crear proyecto en Google Cloud Console:"
echo "   • Ve a: https://console.cloud.google.com/"
echo "   • Crea un nuevo proyecto o selecciona uno existente"
echo ""

print_info "2. Habilitar Google+ API:"
echo "   • Ve a: APIs & Services > Library"
echo "   • Busca 'Google+ API' y habilítala"
echo ""

print_info "3. Crear credenciales OAuth 2.0:"
echo "   • Ve a: APIs & Services > Credentials"
echo "   • Haz clic en 'Create Credentials' > 'OAuth 2.0 Client IDs'"
echo "   • Selecciona 'Web application'"
echo ""

print_info "4. Configurar URIs autorizados:"
echo "   • Authorized JavaScript origins:"
echo "     - http://localhost:3000 (desarrollo)"
echo "     - https://tu-frontend-url.com (producción)"
echo ""

print_info "5. Configurar URIs de redirección:"
echo "   • Authorized redirect URIs:"
echo "     - http://localhost:3001/auth/google/callback (desarrollo)"
echo "     - https://tu-backend-url.com/auth/google/callback (producción)"
echo ""

echo ""
print_warning "⚠️  IMPORTANTE: Guarda el Client ID y Client Secret que te proporciona Google"
echo ""

# Solicitar credenciales al usuario
echo ""
print_status "🔑 Ingresa las credenciales de Google OAuth:"
echo ""

read -p "Client ID: " GOOGLE_CLIENT_ID
read -p "Client Secret: " GOOGLE_CLIENT_SECRET

# Validar que se ingresaron las credenciales
if [ -z "$GOOGLE_CLIENT_ID" ] || [ -z "$GOOGLE_CLIENT_SECRET" ]; then
    print_error "❌ Las credenciales no pueden estar vacías"
    exit 1
fi

# Determinar el entorno
read -p "¿Estás en desarrollo? (y/n): " IS_DEV

if [[ $IS_DEV =~ ^[Yy]$ ]]; then
    GOOGLE_CALLBACK_URL="http://localhost:3001/auth/google/callback"
    print_info "Configurando para desarrollo..."
else
    read -p "URL de tu backend (ej: https://tu-backend.com): " BACKEND_URL
    GOOGLE_CALLBACK_URL="${BACKEND_URL}/auth/google/callback"
    print_info "Configurando para producción..."
fi

echo ""
print_status "📝 Actualizando archivo .env..."

# Verificar si existe el archivo .env
if [ ! -f ".env" ]; then
    print_warning "Archivo .env no encontrado. Creando desde .env.example..."
    cp env.example .env
fi

# Actualizar variables de Google OAuth en .env
sed -i.bak "s/GOOGLE_CLIENT_ID=.*/GOOGLE_CLIENT_ID=\"$GOOGLE_CLIENT_ID\"/" .env
sed -i.bak "s/GOOGLE_CLIENT_SECRET=.*/GOOGLE_CLIENT_SECRET=\"$GOOGLE_CLIENT_SECRET\"/" .env
sed -i.bak "s|GOOGLE_CALLBACK_URL=.*|GOOGLE_CALLBACK_URL=\"$GOOGLE_CALLBACK_URL\"|" .env

# Limpiar archivo de backup
rm -f .env.bak

print_success "✅ Variables de Google OAuth configuradas en .env"
echo ""

print_status "🔧 Configuración completada:"
echo "   • Client ID: $GOOGLE_CLIENT_ID"
echo "   • Callback URL: $GOOGLE_CALLBACK_URL"
echo ""

print_info "📋 Próximos pasos:"
echo "1. Reinicia tu servidor backend"
echo "2. Prueba el login con Google desde tu frontend"
echo "3. Verifica que las redirecciones funcionen correctamente"
echo ""

print_warning "🔒 RECORDATORIOS DE SEGURIDAD:"
echo "• Nunca compartas tu Client Secret"
echo "• Configura URIs de redirección específicos"
echo "• Usa HTTPS en producción"
echo "• Monitorea el uso de la API"
echo ""

print_success "🎉 Configuración de Google OAuth completada exitosamente!" 