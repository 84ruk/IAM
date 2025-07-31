#!/bin/bash

# Script para configurar un cron job que mantenga la aplicación Fly.io siempre activa
# Este script configura un cron job que hace ping cada 5 minutos

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuración
APP_URL="${FLY_APP_URL:-https://iam-backend-baruk.fly.dev}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
KEEP_ALIVE_SCRIPT="$SCRIPT_DIR/keep-alive.js"
CRON_LOG="$SCRIPT_DIR/keep-alive-cron.log"

echo -e "${BLUE}🚀 Configurando Keep-Alive para Fly.io${NC}"
echo -e "${BLUE}URL de la aplicación: ${APP_URL}${NC}"
echo ""

# Verificar que el script existe
if [ ! -f "$KEEP_ALIVE_SCRIPT" ]; then
    echo -e "${RED}❌ Error: No se encontró el script keep-alive.js${NC}"
    echo "Asegúrate de que el archivo existe en: $KEEP_ALIVE_SCRIPT"
    exit 1
fi

# Verificar que Node.js está instalado
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Error: Node.js no está instalado${NC}"
    exit 1
fi

# Crear el comando del cron job
CRON_COMMAND="*/5 * * * * cd $SCRIPT_DIR && node keep-alive.js >> $CRON_LOG 2>&1"

echo -e "${YELLOW}📋 Comando del cron job que se agregará:${NC}"
echo "$CRON_COMMAND"
echo ""

# Función para agregar el cron job
add_cron_job() {
    # Crear un archivo temporal con el cron job
    TEMP_CRON=$(mktemp)
    
    # Obtener los cron jobs existentes
    crontab -l 2>/dev/null > "$TEMP_CRON" || true
    
    # Verificar si ya existe un cron job similar
    if grep -q "keep-alive.js" "$TEMP_CRON"; then
        echo -e "${YELLOW}⚠️  Ya existe un cron job para keep-alive.js${NC}"
        echo -e "${YELLOW}¿Deseas reemplazarlo? (y/N)${NC}"
        read -r response
        if [[ ! "$response" =~ ^[Yy]$ ]]; then
            echo -e "${BLUE}Operación cancelada${NC}"
            rm "$TEMP_CRON"
            exit 0
        fi
        
        # Remover el cron job existente
        sed -i '/keep-alive.js/d' "$TEMP_CRON"
    fi
    
    # Agregar el nuevo cron job
    echo "$CRON_COMMAND" >> "$TEMP_CRON"
    
    # Instalar el nuevo cron job
    crontab "$TEMP_CRON"
    
    # Limpiar
    rm "$TEMP_CRON"
    
    echo -e "${GREEN}✅ Cron job agregado exitosamente${NC}"
}

# Función para mostrar el estado actual
show_status() {
    echo -e "${BLUE}📊 Estado actual de los cron jobs:${NC}"
    if crontab -l 2>/dev/null | grep -q "keep-alive.js"; then
        echo -e "${GREEN}✅ Cron job activo${NC}"
        crontab -l | grep "keep-alive.js"
    else
        echo -e "${RED}❌ No hay cron job activo${NC}"
    fi
    
    echo ""
    echo -e "${BLUE}📄 Logs del keep-alive:${NC}"
    if [ -f "$CRON_LOG" ]; then
        echo -e "${GREEN}✅ Archivo de log existe: $CRON_LOG${NC}"
        echo -e "${BLUE}Últimas 10 líneas:${NC}"
        tail -n 10 "$CRON_LOG" 2>/dev/null || echo "Archivo de log vacío"
    else
        echo -e "${YELLOW}⚠️  Archivo de log no existe aún${NC}"
    fi
}

# Función para remover el cron job
remove_cron_job() {
    echo -e "${YELLOW}🗑️  Removiendo cron job de keep-alive...${NC}"
    
    # Crear un archivo temporal
    TEMP_CRON=$(mktemp)
    
    # Obtener los cron jobs existentes y filtrar keep-alive
    crontab -l 2>/dev/null | grep -v "keep-alive.js" > "$TEMP_CRON" || true
    
    # Instalar el cron job actualizado
    crontab "$TEMP_CRON"
    
    # Limpiar
    rm "$TEMP_CRON"
    
    echo -e "${GREEN}✅ Cron job removido exitosamente${NC}"
}

# Función para probar el script manualmente
test_script() {
    echo -e "${BLUE}🧪 Probando el script keep-alive...${NC}"
    echo -e "${BLUE}Esto hará un ping a tu aplicación${NC}"
    echo ""
    
    cd "$SCRIPT_DIR"
    node keep-alive.js &
    PID=$!
    
    # Esperar 10 segundos
    sleep 10
    
    # Detener el script
    kill $PID 2>/dev/null || true
    
    echo ""
    echo -e "${GREEN}✅ Prueba completada${NC}"
}

# Función para mostrar ayuda
show_help() {
    echo -e "${BLUE}📖 Uso: $0 [comando]${NC}"
    echo ""
    echo "Comandos disponibles:"
    echo "  install    - Instalar el cron job (por defecto)"
    echo "  status     - Mostrar el estado actual"
    echo "  remove     - Remover el cron job"
    echo "  test       - Probar el script manualmente"
    echo "  help       - Mostrar esta ayuda"
    echo ""
    echo "Variables de entorno:"
    echo "  FLY_APP_URL - URL de tu aplicación Fly.io"
    echo ""
}

# Procesar argumentos
case "${1:-install}" in
    "install"|"add")
        add_cron_job
        show_status
        ;;
    "status"|"check")
        show_status
        ;;
    "remove"|"delete")
        remove_cron_job
        ;;
    "test")
        test_script
        ;;
    "help"|"-h"|"--help")
        show_help
        ;;
    *)
        echo -e "${RED}❌ Comando desconocido: $1${NC}"
        echo ""
        show_help
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}🎉 Configuración completada${NC}"
echo -e "${BLUE}💡 Consejos:${NC}"
echo "  - El cron job se ejecutará cada 5 minutos"
echo "  - Los logs se guardarán en: $CRON_LOG"
echo "  - Para verificar el estado: $0 status"
echo "  - Para remover: $0 remove" 