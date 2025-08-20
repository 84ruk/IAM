#!/bin/bash

echo "🔧 Corrigiendo todos los nombres de propiedades para consistencia..."

# Corregir configNotificacion -> configuracionNotificacion en los servicios
find src -name "*.ts" -type f -exec sed -i '' 's/config\.configNotificacion/config.configuracionNotificacion/g' {} \;

# Corregir configNotificaciones -> configuracionNotificacion
find src -name "*.ts" -type f -exec sed -i '' 's/config\.configNotificaciones/config.configuracionNotificacion/g' {} \;

# Corregir configNotificacion -> configuracionNotificacion en las propiedades
find src -name "*.ts" -type f -exec sed -i '' 's/configNotificacion:/configuracionNotificacion:/g' {} \;

echo "✅ Todos los nombres corregidos para consistencia"
