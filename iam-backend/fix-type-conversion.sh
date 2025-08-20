#!/bin/bash

echo "🔧 Corrigiendo problemas de conversión de tipos..."

# Corregir la conversión de tipos para configuracionNotificacion
find src -name "*.ts" -type f -exec sed -i '' 's/configuracionNotificacion as Prisma\.JsonObject/configuracionNotificacion as unknown as Prisma.JsonObject/g' {} \;

echo "✅ Conversiones de tipos corregidas"
