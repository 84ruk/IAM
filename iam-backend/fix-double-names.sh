#!/bin/bash

echo "🔧 Corrigiendo nombres duplicados incorrectamente..."

# Corregir ventanaEsperaMinutosMinutos -> ventanaEsperaMinutos
find src -name "*.ts" -type f -exec sed -i '' 's/ventanaEsperaMinutosMinutos/ventanaEsperaMinutos/g' {} \;

# Corregir umbralCriticoCritico -> umbralCritico
find src -name "*.ts" -type f -exec sed -i '' 's/umbralCriticoCritico/umbralCritico/g' {} \;

# Corregir configuracionNotificacionNotificacion -> configuracionNotificacion
find src -name "*.ts" -type f -exec sed -i '' 's/configuracionNotificacionNotificacion/configuracionNotificacion/g' {} \;

echo "✅ Nombres duplicados corregidos"
