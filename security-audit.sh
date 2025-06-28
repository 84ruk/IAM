#!/bin/bash

# Script de auditoría de seguridad para IAM System
echo "🔒 Auditoría de Seguridad - IAM System"

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

# Contador de problemas
ISSUES=0
CRITICAL_ISSUES=0

echo ""
print_info "🔍 Iniciando auditoría de seguridad..."
echo ""

# 1. Verificar archivos de configuración
print_status "1. Verificando archivos de configuración..."

# Verificar si .env está en .gitignore
if grep -q "\.env" .gitignore; then
    print_success "✅ .env está en .gitignore"
else
    print_error "❌ .env NO está en .gitignore"
    ((CRITICAL_ISSUES++))
fi

# Verificar si .env existe y tiene credenciales reales
if [ -f ".env" ]; then
    if grep -q "usuario:contraseña" .env; then
        print_warning "⚠️  .env contiene credenciales de ejemplo"
        ((ISSUES++))
    else
        print_success "✅ .env existe y no contiene credenciales de ejemplo"
    fi
    
    # Verificar permisos del archivo .env
    PERMS=$(stat -f "%Lp" .env 2>/dev/null || stat -c "%a" .env 2>/dev/null)
    if [ "$PERMS" = "600" ]; then
        print_success "✅ .env tiene permisos correctos (600)"
    else
        print_warning "⚠️  .env no tiene permisos seguros (actual: $PERMS, recomendado: 600)"
        ((ISSUES++))
    fi
else
    print_warning "⚠️  Archivo .env no encontrado"
    ((ISSUES++))
fi

echo ""

# 2. Verificar credenciales hardcodeadas
print_status "2. Verificando credenciales hardcodeadas..."

# Buscar posibles credenciales en el código
HARDCODED_CREDS=$(grep -r -i "password\|secret\|key\|token" --include="*.ts" --include="*.js" --include="*.json" src/ 2>/dev/null | grep -v "example\|test\|TODO\|FIXME" | grep -E "(password|secret|key|token)" || true)

if [ -n "$HARDCODED_CREDS" ]; then
    print_error "❌ Se encontraron posibles credenciales hardcodeadas:"
    echo "$HARDCODED_CREDS" | head -5
    if [ $(echo "$HARDCODED_CREDS" | wc -l) -gt 5 ]; then
        echo "... y $(($(echo "$HARDCODED_CREDS" | wc -l) - 5)) más"
    fi
    ((CRITICAL_ISSUES++))
else
    print_success "✅ No se encontraron credenciales hardcodeadas"
fi

echo ""

# 3. Verificar dependencias de seguridad
print_status "3. Verificando dependencias..."

# Verificar si npm audit está disponible
if command -v npm &> /dev/null; then
    print_info "Ejecutando npm audit en el backend..."
    cd iam-backend
    AUDIT_RESULT=$(npm audit --audit-level=moderate 2>&1 || true)
    if echo "$AUDIT_RESULT" | grep -q "found 0 vulnerabilities"; then
        print_success "✅ Backend: No se encontraron vulnerabilidades críticas"
    else
        print_warning "⚠️  Backend: Se encontraron vulnerabilidades"
        echo "$AUDIT_RESULT" | grep -E "(High|Critical)" | head -3
        ((ISSUES++))
    fi
    cd ..
    
    print_info "Ejecutando npm audit en el frontend..."
    cd iam-frontend
    AUDIT_RESULT=$(npm audit --audit-level=moderate 2>&1 || true)
    if echo "$AUDIT_RESULT" | grep -q "found 0 vulnerabilities"; then
        print_success "✅ Frontend: No se encontraron vulnerabilidades críticas"
    else
        print_warning "⚠️  Frontend: Se encontraron vulnerabilidades"
        echo "$AUDIT_RESULT" | grep -E "(High|Critical)" | head -3
        ((ISSUES++))
    fi
    cd ..
else
    print_warning "⚠️  npm no está disponible para verificar dependencias"
    ((ISSUES++))
fi

echo ""

# 4. Verificar configuración de Docker
print_status "4. Verificando configuración de Docker..."

if [ -f "docker-compose.yml" ]; then
    # Verificar si hay credenciales hardcodeadas en docker-compose
    if grep -q "password\|secret\|key" docker-compose.yml | grep -v "POSTGRES_PASSWORD\|JWT_SECRET" | grep -v "\\$"; then
        print_warning "⚠️  Posibles credenciales hardcodeadas en docker-compose.yml"
        ((ISSUES++))
    else
        print_success "✅ docker-compose.yml no contiene credenciales hardcodeadas"
    fi
else
    print_warning "⚠️  docker-compose.yml no encontrado"
    ((ISSUES++))
fi

echo ""

# 5. Verificar configuración de seguridad en el código
print_status "5. Verificando configuración de seguridad en el código..."

# Verificar si hay CORS configurado
if grep -r "cors\|CORS" --include="*.ts" --include="*.js" src/ | grep -v "test" > /dev/null; then
    print_success "✅ CORS está configurado"
else
    print_warning "⚠️  CORS no parece estar configurado"
    ((ISSUES++))
fi

# Verificar si hay rate limiting
if grep -r "rate.*limit\|throttle" --include="*.ts" --include="*.js" src/ | grep -v "test" > /dev/null; then
    print_success "✅ Rate limiting está configurado"
else
    print_warning "⚠️  Rate limiting no parece estar configurado"
    ((ISSUES++))
fi

# Verificar si hay validación de entrada
if grep -r "validation\|validate\|class-validator" --include="*.ts" --include="*.js" src/ | grep -v "test" > /dev/null; then
    print_success "✅ Validación de entrada está configurada"
else
    print_warning "⚠️  Validación de entrada no parece estar configurada"
    ((ISSUES++))
fi

echo ""

# 6. Verificar archivos sensibles
print_status "6. Verificando archivos sensibles..."

SENSITIVE_FILES=(".env" ".env.local" ".env.production" "*.pem" "*.key" "*.crt" "ssl/")

for pattern in "${SENSITIVE_FILES[@]}"; do
    if find . -name "$pattern" -type f 2>/dev/null | grep -v node_modules > /dev/null; then
        print_warning "⚠️  Se encontraron archivos sensibles: $pattern"
        find . -name "$pattern" -type f 2>/dev/null | grep -v node_modules | head -3
        ((ISSUES++))
    fi
done

echo ""

# 7. Verificar configuración de base de datos
print_status "7. Verificando configuración de base de datos..."

if [ -f "iam-backend/prisma/schema.prisma" ]; then
    # Verificar si hay índices en campos sensibles
    if grep -q "@unique\|@index" iam-backend/prisma/schema.prisma; then
        print_success "✅ Se encontraron índices en el schema de Prisma"
    else
        print_warning "⚠️  No se encontraron índices en el schema de Prisma"
        ((ISSUES++))
    fi
else
    print_warning "⚠️  Schema de Prisma no encontrado"
    ((ISSUES++))
fi

echo ""

# Resumen de la auditoría
print_status "📊 Resumen de la auditoría de seguridad:"
echo ""

if [ $CRITICAL_ISSUES -eq 0 ] && [ $ISSUES -eq 0 ]; then
    print_success "🎉 ¡Excelente! No se encontraron problemas críticos de seguridad"
    print_success "✅ Tu proyecto cumple con las mejores prácticas de seguridad"
elif [ $CRITICAL_ISSUES -eq 0 ]; then
    print_warning "⚠️  Se encontraron $ISSUES problemas menores de seguridad"
    print_info "Recomendamos revisar y corregir estos problemas"
else
    print_error "❌ Se encontraron $CRITICAL_ISSUES problemas críticos y $ISSUES problemas menores"
    print_error "🚨 Se requiere atención inmediata a los problemas críticos"
fi

echo ""
print_info "🔧 Recomendaciones generales:"
echo "• Usa variables de entorno para todas las credenciales"
echo "• Implementa rate limiting en todas las APIs"
echo "• Configura CORS correctamente"
echo "• Usa HTTPS en producción"
echo "• Rota las claves JWT regularmente"
echo "• Monitorea logs y acceso al sistema"
echo "• Configura backups automáticos"
echo "• Mantén las dependencias actualizadas"
echo ""

print_status "🔒 Auditoría completada" 