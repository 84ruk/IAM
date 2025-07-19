#!/bin/bash

# Script para probar el dashboard CQRS con logs limpios
echo "🧪 Probando Dashboard CQRS con logs optimizados..."

# Configurar variables de entorno para logs limpios
export DEBUG_PRISMA=false
export DEBUG_POOL=false
export LOG_LEVEL=warn

echo "📊 Configuración de logs:"
echo "  - DEBUG_PRISMA: $DEBUG_PRISMA"
echo "  - DEBUG_POOL: $DEBUG_POOL"
echo "  - LOG_LEVEL: $LOG_LEVEL"

# Ejecutar tests unitarios
echo ""
echo "🔬 Ejecutando tests unitarios..."
npm run test:dashboard-unit

if [ $? -eq 0 ]; then
    echo "✅ Tests unitarios pasaron exitosamente"
else
    echo "❌ Tests unitarios fallaron"
    exit 1
fi

# Ejecutar tests de performance
echo ""
echo "⚡ Ejecutando tests de performance..."
npm run test:dashboard-performance

if [ $? -eq 0 ]; then
    echo "✅ Tests de performance pasaron exitosamente"
else
    echo "❌ Tests de performance fallaron"
    exit 1
fi

# Ejecutar tests de cache
echo ""
echo "💾 Ejecutando tests de cache..."
npm run test:dashboard-cache

if [ $? -eq 0 ]; then
    echo "✅ Tests de cache pasaron exitosamente"
else
    echo "❌ Tests de cache fallaron"
    exit 1
fi

echo ""
echo "🎉 Todos los tests pasaron exitosamente con logs optimizados!"
echo ""
echo "💡 Para habilitar logs detallados de Prisma, ejecuta:"
echo "   export DEBUG_PRISMA=true && npm run test:dashboard-unit"
echo ""
echo "💡 Para habilitar logs del pool de conexiones, ejecuta:"
echo "   export DEBUG_POOL=true && npm run test:dashboard-unit" 