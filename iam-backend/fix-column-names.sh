#!/bin/bash

echo "🔧 Corrigiendo nombres de columnas en el código..."

# Cambiar ventanaEspera por ventanaEsperaMinutos
find src -name "*.ts" -type f -exec sed -i '' 's/ventanaEspera/ventanaEsperaMinutos/g' {} \;

# Cambiar umbral por umbralCritico
find src -name "*.ts" -type f -exec sed -i '' 's/umbral/umbralCritico/g' {} \;

# Cambiar notificacion por configuracionNotificacion
find src -name "*.ts" -type f -exec sed -i '' 's/notificacion/configuracionNotificacion/g' {} \;

echo "✅ Nombres de columnas corregidos automáticamente"
echo "📝 Archivos modificados:"
find src -name "*.ts" -type f -exec grep -l "ventanaEsperaMinutos\|umbralCritico\|configuracionNotificacion" {} \;
