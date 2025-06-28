#!/bin/bash

# Script para generar claves seguras y credenciales
echo "🔐 Generador de Claves Seguras - IAM System"

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

print_secret() {
    echo -e "${GREEN}[SECRET]${NC} $1"
}

# Verificar que openssl esté instalado
if ! command -v openssl &> /dev/null; then
    print_error "OpenSSL no está instalado. Por favor, instala OpenSSL primero."
    exit 1
fi

echo ""
print_info "🔐 Generando claves seguras para tu aplicación..."
echo ""

# Generar JWT Secret
print_status "Generando JWT Secret..."
JWT_SECRET=$(openssl rand -base64 32)
print_secret "JWT_SECRET=$JWT_SECRET"
echo ""

# Generar contraseña para base de datos
print_status "Generando contraseña para base de datos..."
DB_PASSWORD=$(openssl rand -base64 16 | tr -d "=+/" | cut -c1-16)
print_secret "DB_PASSWORD=$DB_PASSWORD"
echo ""

# Generar usuario para base de datos
print_status "Generando usuario para base de datos..."
DB_USER="iam_user_$(openssl rand -hex 4)"
print_secret "DB_USER=$DB_USER"
echo ""

# Generar nombre de base de datos
print_status "Generando nombre de base de datos..."
DB_NAME="iam_db_$(openssl rand -hex 4)"
print_secret "DB_NAME=$DB_NAME"
echo ""

# Generar URL de base de datos
print_status "Generando URL de base de datos..."
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}"
print_secret "DATABASE_URL=$DATABASE_URL"
echo ""

# Generar clave para encriptación adicional
print_status "Generando clave de encriptación..."
ENCRYPTION_KEY=$(openssl rand -base64 32)
print_secret "ENCRYPTION_KEY=$ENCRYPTION_KEY"
echo ""

# Generar salt para hashing
print_status "Generando salt para hashing..."
HASH_SALT=$(openssl rand -base64 16)
print_secret "HASH_SALT=$HASH_SALT"
echo ""

print_warning "⚠️  IMPORTANTE: Guarda estas claves en un lugar seguro!"
print_warning "⚠️  NUNCA las compartas o las commitees al repositorio!"
echo ""

# Crear archivo de configuración temporal
print_status "Creando archivo de configuración temporal..."
cat > .env.generated << EOF
# ========================================
# CONFIGURACIÓN GENERADA AUTOMÁTICAMENTE
# ========================================
# FECHA: $(date)
# 
# ⚠️  IMPORTANTE: 
# - Guarda este archivo en un lugar seguro
# - NUNCA lo commitees al repositorio
# - Usa estas credenciales solo para desarrollo
# - Para producción, genera nuevas credenciales

# ========================================
# BASE DE DATOS
# ========================================
DATABASE_URL="${DATABASE_URL}"
POSTGRES_USER="${DB_USER}"
POSTGRES_PASSWORD="${DB_PASSWORD}"
POSTGRES_DB="${DB_NAME}"

# ========================================
# AUTENTICACIÓN JWT
# ========================================
JWT_SECRET="${JWT_SECRET}"
JWT_EXPIRES_IN="24h"

# ========================================
# SERVIDOR
# ========================================
PORT=3001
NODE_ENV="development"

# ========================================
# CORS
# ========================================
FRONTEND_URL="http://localhost:3000"

# ========================================
# SEGURIDAD ADICIONAL
# ========================================
ENCRYPTION_KEY="${ENCRYPTION_KEY}"
HASH_SALT="${HASH_SALT}"

# ========================================
# LOGGING
# ========================================
LOG_LEVEL="info"

# ========================================
# RATE LIMITING
# ========================================
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EOF

print_status "✅ Archivo .env.generated creado con éxito!"
echo ""

print_info "📋 Próximos pasos:"
echo "1. Revisa el archivo .env.generated"
echo "2. Copia las credenciales que necesites a tu archivo .env"
echo "3. Elimina el archivo .env.generated después de usarlo"
echo "4. Configura tu base de datos con las credenciales generadas"
echo ""

print_warning "🔒 RECORDATORIOS DE SEGURIDAD:"
echo "• Usa contraseñas diferentes para cada entorno"
echo "• Rota las claves JWT regularmente"
echo "• Monitorea el acceso a tu base de datos"
echo "• Configura backups automáticos"
echo "• Usa HTTPS en producción"
echo ""

# Establecer permisos seguros
chmod 600 .env.generated

print_status "🔐 Permisos de archivo configurados (solo lectura para el propietario)"
print_status "🎉 Generación de claves completada exitosamente!" 