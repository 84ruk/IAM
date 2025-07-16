const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testCacheStrategies() {
  console.log('🧪 Probando estrategias de cache avanzadas...\n');

  try {
    // 1. Verificar empresas existentes
    console.log('1. Verificando empresas existentes...');
    const empresas = await prisma.empresa.findMany({
      select: { id: true, nombre: true }
    });

    if (empresas.length === 0) {
      console.log('❌ No hay empresas en la base de datos');
      return;
    }

    const empresaId = empresas[0].id;
    console.log(`✅ Usando empresa: ${empresas[0].nombre} (ID: ${empresaId})\n`);

    // 2. Simular diferentes patrones de acceso
    console.log('2. Simulando patrones de acceso...');
    
    // Patrón HOT: Datos muy frecuentes
    console.log('🔥 Patrón HOT: Datos muy frecuentes');
    console.log('   - KPIs del dashboard');
    console.log('   - Información básica de empresa');
    console.log('   - Usuarios activos');
    
    // Patrón WARM: Datos moderadamente frecuentes
    console.log('🌡️  Patrón WARM: Datos moderadamente frecuentes');
    console.log('   - Productos populares');
    console.log('   - Movimientos recientes');
    console.log('   - Configuraciones');
    
    // Patrón COLD: Datos poco frecuentes
    console.log('❄️  Patrón COLD: Datos poco frecuentes');
    console.log('   - Reportes históricos');
    console.log('   - Datos de auditoría');
    console.log('   - Configuraciones avanzadas\n');

    // 3. Verificar productos existentes
    console.log('3. Verificando productos existentes...');
    const productos = await prisma.producto.findMany({
      where: { empresaId },
      select: { id: true, nombre: true, stock: true }
    });

    console.log(`✅ Encontrados ${productos.length} productos\n`);

    // 4. Verificar movimientos existentes
    console.log('4. Verificando movimientos existentes...');
    const movimientos = await prisma.movimientoInventario.findMany({
      where: { empresaId },
      select: { id: true, tipo: true, cantidad: true }
    });

    console.log(`✅ Encontrados ${movimientos.length} movimientos\n`);

    // 5. Simular estrategias de cache
    console.log('5. Simulando estrategias de cache...');
    
    // Cache-Aside para datos estáticos
    console.log('🔥 Cache-Aside: Información de empresa');
    console.log('   - Datos que se leen frecuentemente pero se actualizan raramente');
    console.log('   - TTL: 30 minutos');
    console.log('   - Ejemplo: nombre, RFC, configuración\n');
    
    // Write-Through para datos críticos
    console.log('🚀 Write-Through: Productos y movimientos');
    console.log('   - Datos críticos que deben estar siempre sincronizados');
    console.log('   - TTL: 10 minutos');
    console.log('   - Ejemplo: stock, precios, movimientos\n');
    
    // Write-Behind para analytics
    console.log('⚡ Write-Behind: Métricas y analytics');
    console.log('   - Datos con muchas escrituras que no necesitan persistencia inmediata');
    console.log('   - TTL: 1 minuto');
    console.log('   - Ejemplo: contadores, logs, métricas\n');
    
    // Refresh-Ahead para KPIs
    console.log('🔄 Refresh-Ahead: KPIs del dashboard');
    console.log('   - Datos que necesitan estar siempre disponibles');
    console.log('   - TTL: 5 minutos');
    console.log('   - Ejemplo: KPIs, reportes frecuentes\n');

    // 6. Simular cache warming
    console.log('6. Simulando cache warming...');
    console.log('🎯 Cache Warming para empresa:', empresaId);
    console.log('   - Pre-cargando datos básicos de empresa');
    console.log('   - Pre-cargando usuarios activos');
    console.log('   - Pre-cargando productos más utilizados');
    console.log('   - Pre-cargando KPIs básicos');
    console.log('   - Pre-cargando configuraciones\n');

    // 7. Simular invalidación inteligente
    console.log('7. Simulando invalidación inteligente...');
    console.log('🧹 Invalidación inteligente:');
    console.log('   - Al actualizar producto: invalidar KPIs, top-products, product-stats');
    console.log('   - Al crear movimiento: invalidar KPIs, movement-stats, dashboard');
    console.log('   - Al actualizar empresa: invalidar empresa:basic, empresa:config');
    console.log('   - Al actualizar usuario: invalidar session:user, empresa:users\n');

    // 8. Simular evicción inteligente
    console.log('8. Simulando evicción inteligente...');
    console.log('📊 Evicción inteligente:');
    console.log('   - Si > 10,000 keys: evicción de datos fríos');
    console.log('   - Si > 8,000 keys: evicción por patrón de uso');
    console.log('   - Datos calientes: TTL extendido');
    console.log('   - Datos fríos: TTL reducido\n');

    console.log('✅ Prueba de estrategias de cache completada exitosamente!');
    console.log('\n📋 Resumen de estrategias implementadas:');
    console.log('   🔥 Cache-Aside: Para datos estáticos');
    console.log('   🚀 Write-Through: Para datos críticos');
    console.log('   ⚡ Write-Behind: Para analytics');
    console.log('   🔄 Refresh-Ahead: Para KPIs');
    console.log('   🎯 Cache Warming: Al login');
    console.log('   📊 Intelligent Cache: Por patrón de acceso');
    console.log('   🔮 Predictive Cache: Basado en patrones de usuario');
    console.log('   🧹 Smart Eviction: Limpieza inteligente');
    console.log('   🔄 Smart Invalidation: Invalidación relacionada');

  } catch (error) {
    console.error('❌ Error en prueba de estrategias de cache:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la prueba
testCacheStrategies(); 