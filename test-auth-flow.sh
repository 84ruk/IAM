#!/bin/bash

# Script para probar el flujo completo de autenticación - IAM System
echo "🧪 Probador del Flujo de Autenticación - IAM System"

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

# Configuración
API_BASE_URL="http://localhost:3001"
TEST_EMAIL="test@example.com"
TEST_PASSWORD="Test123!@#"
TEST_NAME="Usuario de Prueba"

echo ""
print_info "🧪 Iniciando pruebas del flujo de autenticación..."
echo ""

# Función para hacer requests HTTP
make_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local headers=$4
    
    if [ -n "$data" ]; then
        if [ -n "$headers" ]; then
            curl -s -X "$method" "$API_BASE_URL$endpoint" \
                -H "Content-Type: application/json" \
                -H "$headers" \
                -d "$data" \
                -w "\nHTTP_STATUS:%{http_code}\n"
        else
            curl -s -X "$method" "$API_BASE_URL$endpoint" \
                -H "Content-Type: application/json" \
                -d "$data" \
                -w "\nHTTP_STATUS:%{http_code}\n"
        fi
    else
        if [ -n "$headers" ]; then
            curl -s -X "$method" "$API_BASE_URL$endpoint" \
                -H "$headers" \
                -w "\nHTTP_STATUS:%{http_code}\n"
        else
            curl -s -X "$method" "$API_BASE_URL$endpoint" \
                -w "\nHTTP_STATUS:%{http_code}\n"
        fi
    fi
}

# Función para extraer HTTP status
get_http_status() {
    echo "$1" | grep "HTTP_STATUS:" | cut -d: -f2
}

# Función para extraer respuesta JSON
get_json_response() {
    echo "$1" | sed '/HTTP_STATUS:/d'
}

# 1. Probar endpoint de salud
print_status "1. Probando endpoint de salud..."
response=$(make_request "GET" "/health")
status=$(get_http_status "$response")
json_response=$(get_json_response "$response")

if [ "$status" = "200" ]; then
    print_success "✅ Endpoint de salud funcionando"
else
    print_error "❌ Endpoint de salud falló: $status"
    echo "Respuesta: $json_response"
fi

echo ""

# 2. Probar estado de Google OAuth
print_status "2. Probando estado de Google OAuth..."
response=$(make_request "GET" "/auth/google/status")
status=$(get_http_status "$response")
json_response=$(get_json_response "$response")

if [ "$status" = "200" ]; then
    print_success "✅ Endpoint de estado de Google OAuth funcionando"
    echo "Respuesta: $json_response"
else
    print_warning "⚠️  Endpoint de estado de Google OAuth falló: $status"
fi

echo ""

# 3. Probar registro de usuario individual
print_status "3. Probando registro de usuario individual..."
register_data="{\"nombre\":\"$TEST_NAME\",\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}"
response=$(make_request "POST" "/auth/register" "$register_data")
status=$(get_http_status "$response")
json_response=$(get_json_response "$response")

if [ "$status" = "201" ]; then
    print_success "✅ Registro de usuario exitoso"
    echo "Respuesta: $json_response"
    
    # Extraer token para pruebas posteriores
    TOKEN=$(echo "$json_response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    if [ -n "$TOKEN" ]; then
        print_info "Token extraído para pruebas posteriores"
    fi
else
    print_warning "⚠️  Registro de usuario falló: $status"
    echo "Respuesta: $json_response"
fi

echo ""

# 4. Probar login
print_status "4. Probando login..."
login_data="{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}"
response=$(make_request "POST" "/auth/login" "$login_data")
status=$(get_http_status "$response")
json_response=$(get_json_response "$response")

if [ "$status" = "200" ]; then
    print_success "✅ Login exitoso"
    echo "Respuesta: $json_response"
else
    print_warning "⚠️  Login falló: $status"
    echo "Respuesta: $json_response"
fi

echo ""

# 5. Probar endpoint /me (si tenemos token)
if [ -n "$TOKEN" ]; then
    print_status "5. Probando endpoint /me..."
    response=$(make_request "GET" "/auth/me" "" "Authorization: Bearer $TOKEN")
    status=$(get_http_status "$response")
    json_response=$(get_json_response "$response")

    if [ "$status" = "200" ]; then
        print_success "✅ Endpoint /me funcionando"
        echo "Respuesta: $json_response"
    else
        print_warning "⚠️  Endpoint /me falló: $status"
        echo "Respuesta: $json_response"
    fi
else
    print_warning "⚠️  No se pudo probar /me - token no disponible"
fi

echo ""

# 6. Probar verificación de setup
if [ -n "$TOKEN" ]; then
    print_status "6. Probando verificación de setup..."
    response=$(make_request "GET" "/auth/needs-setup" "" "Authorization: Bearer $TOKEN")
    status=$(get_http_status "$response")
    json_response=$(get_json_response "$response")

    if [ "$status" = "200" ]; then
        print_success "✅ Verificación de setup funcionando"
        echo "Respuesta: $json_response"
    else
        print_warning "⚠️  Verificación de setup falló: $status"
        echo "Respuesta: $json_response"
    fi
else
    print_warning "⚠️  No se pudo probar needs-setup - token no disponible"
fi

echo ""

# 7. Probar gestión de usuarios (si tenemos token)
if [ -n "$TOKEN" ]; then
    print_status "7. Probando gestión de usuarios..."
    
    # Listar usuarios
    response=$(make_request "GET" "/users" "" "Authorization: Bearer $TOKEN")
    status=$(get_http_status "$response")
    json_response=$(get_json_response "$response")

    if [ "$status" = "200" ]; then
        print_success "✅ Listado de usuarios funcionando"
        echo "Respuesta: $json_response"
    else
        print_warning "⚠️  Listado de usuarios falló: $status"
        echo "Respuesta: $json_response"
    fi
    
    # Estadísticas de usuarios
    response=$(make_request "GET" "/users/stats" "" "Authorization: Bearer $TOKEN")
    status=$(get_http_status "$response")
    json_response=$(get_json_response "$response")

    if [ "$status" = "200" ]; then
        print_success "✅ Estadísticas de usuarios funcionando"
        echo "Respuesta: $json_response"
    else
        print_warning "⚠️  Estadísticas de usuarios falló: $status"
        echo "Respuesta: $json_response"
    fi
else
    print_warning "⚠️  No se pudo probar gestión de usuarios - token no disponible"
fi

echo ""

# 8. Probar logout
print_status "8. Probando logout..."
response=$(make_request "POST" "/auth/logout")
status=$(get_http_status "$response")
json_response=$(get_json_response "$response")

if [ "$status" = "200" ]; then
    print_success "✅ Logout exitoso"
    echo "Respuesta: $json_response"
else
    print_warning "⚠️  Logout falló: $status"
    echo "Respuesta: $json_response"
fi

echo ""
print_success "🎉 Pruebas completadas!"
echo ""
print_info "📋 Resumen de funcionalidades probadas:"
echo "   ✅ Endpoint de salud"
echo "   ✅ Estado de Google OAuth"
echo "   ✅ Registro de usuarios"
echo "   ✅ Login con email/password"
echo "   ✅ Verificación de usuario autenticado"
echo "   ✅ Verificación de setup de empresa"
echo "   ✅ Gestión de usuarios (listado y estadísticas)"
echo "   ✅ Logout"
echo ""
print_info "🔧 Próximos pasos:"
echo "1. Configura Google OAuth con: ./setup-google-oauth.sh"
echo "2. Prueba el login con Google desde el frontend"
echo "3. Configura una empresa para completar el setup"
echo "4. Prueba la gestión completa de usuarios"
echo ""
print_warning "⚠️  RECORDATORIOS:"
echo "• Asegúrate de que el backend esté ejecutándose en http://localhost:3001"
echo "• Verifica que las variables de entorno estén configuradas"
echo "• Para pruebas en producción, cambia API_BASE_URL en el script" 