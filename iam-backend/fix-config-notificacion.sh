#!/bin/bash

echo "🔧 Corrigiendo configuracionNotificacion vs configNotificacion..."

# Cambiar configuracionNotificacion por configNotificacion en los servicios
find src -name "*.ts" -type f -exec sed -i '' 's/config\.configuracionNotificacion/config.configNotificacion/g' {} \;

echo "✅ Corrección aplicada"
