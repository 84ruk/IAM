#!/bin/bash

# Script para obtener la IP del servidor para ESP32
echo "🔍 Obteniendo IP del servidor para ESP32..."

# Obtener IP local (no loopback)
IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)

if [ -z "$IP" ]; then
    echo "❌ No se pudo obtener la IP del servidor"
    exit 1
fi

echo "✅ IP del servidor: $IP"
echo "🌐 URL para ESP32: https://api.iaminventario.com.mx"
echo ""
echo "📋 Configuración para ESP32:"
echo "   • URL del servidor: api.iaminventario.com.mx"
echo "   • Puerto: 443 (HTTPS estándar)"
echo "   • URL completa: https://api.iaminventario.com.mx"
echo ""
echo "🔧 Para usar en el código Arduino:"
echo "   String apiBaseUrl = \"https://api.iaminventario.com.mx\";"
echo ""
echo "🧪 Para probar la conexión:"
echo "   curl -X GET https://api.iaminventario.com.mx/sensores/iot/health \\"
echo "     -H \"x-empresa-id: 2\" \\"
echo "     -H \"x-device-type: esp32\" \\"
echo "     -H \"x-esp32-device: true\""


