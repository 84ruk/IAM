#!/bin/bash

echo "🔧 Iniciando reparación de chunks y dependencias..."

# Limpiar caché de Next.js
echo "🧹 Limpiando caché de Next.js..."
rm -rf .next
rm -rf node_modules/.cache

# Limpiar caché de npm
echo "🧹 Limpiando caché de npm..."
npm cache clean --force

# Eliminar node_modules
echo "🗑️ Eliminando node_modules..."
rm -rf node_modules
rm -f package-lock.json

# Reinstalar dependencias
echo "📦 Reinstalando dependencias..."
npm install

# Limpiar caché del navegador (solo en macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "🌐 Limpiando caché del navegador..."
    # Limpiar caché de Safari
    rm -rf ~/Library/Caches/com.apple.Safari
    rm -rf ~/Library/Safari/LocalStorage
    
    # Limpiar caché de Chrome
    rm -rf ~/Library/Caches/Google/Chrome/Default/Cache
    rm -rf ~/Library/Application\ Support/Google/Chrome/Default/Code\ Cache
fi

echo "✅ Reparación completada!"
echo "🚀 Ejecuta 'npm run dev' para iniciar el servidor de desarrollo" 