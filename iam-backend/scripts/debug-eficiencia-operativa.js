const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugEficienciaOperativa() {
  try {
    console.log('🔍 Debuggeando cálculo de eficiencia operativa...');
    
    const empresaId = 2;
    
    // Replicar la consulta actual exactamente como está en el handler
    console.log('\n📊 Ejecutando consulta actual del handler...');
    const result = await prisma.$queryRaw`
      WITH metricas AS (
        SELECT 
          COUNT(DISTINCT p.id) as total_productos,
          COUNT(CASE WHEN p.stock <= p."stockMinimo" THEN 1 END) as productos_stock_bajo,
          COUNT(CASE WHEN p.stock = 0 THEN 1 END) as productos_sin_stock
        FROM "Producto" p
        WHERE p."empresaId" = ${empresaId}
          AND p.estado = 'ACTIVO'
      )
      SELECT 
        total_productos,
        productos_stock_bajo,
        productos_sin_stock,
        COALESCE(
          (total_productos - productos_stock_bajo - productos_sin_stock) / 
          NULLIF(total_productos, 0) * 100,
          0
        ) as eficiencia
      FROM metricas
    `;
    
    console.log('Resultado de la consulta:', result[0]);
    
    // Consulta más detallada para entender cada producto
    console.log('\n📋 Detalle por producto:');
    const productos = await prisma.$queryRaw`
      SELECT 
        p.nombre,
        p.stock,
        p."stockMinimo",
        CASE 
          WHEN p.stock <= p."stockMinimo" THEN 'STOCK_BAJO'
          WHEN p.stock = 0 THEN 'SIN_STOCK' 
          ELSE 'OK'
        END as estado_stock
      FROM "Producto" p
      WHERE p."empresaId" = ${empresaId}
        AND p.estado = 'ACTIVO'
      ORDER BY p.nombre
    `;
    
    productos.forEach(producto => {
      console.log(`- ${producto.nombre}: Stock ${producto.stock}/${producto.stockMinimo} -> ${producto.estado_stock}`);
    });
    
    // Proponer una fórmula de eficiencia operativa más realista
    console.log('\n💡 Calculando eficiencia alternativa basada en múltiples factores...');
    
    // Obtener datos de movimientos del último mes
    const movimientos = await prisma.$queryRaw`
      SELECT 
        COUNT(*) as total_movimientos,
        COUNT(CASE WHEN tipo = 'SALIDA' THEN 1 END) as salidas,
        COUNT(CASE WHEN tipo = 'ENTRADA' THEN 1 END) as entradas,
        AVG(cantidad) as cantidad_promedio
      FROM "MovimientoInventario"
      WHERE "empresaId" = ${empresaId}
        AND "createdAt" >= NOW() - INTERVAL '30 days'
    `;
    
    console.log('Movimientos último mes:', movimientos[0]);
    
    // Calcular eficiencia más realista
    const totalProductos = Number(result[0].total_productos);
    const productosStockBajo = Number(result[0].productos_stock_bajo);
    const productosSinStock = Number(result[0].productos_sin_stock);
    const totalMovimientos = Number(movimientos[0].total_movimientos);
    const salidas = Number(movimientos[0].salidas);
    
    // Fórmula mejorada de eficiencia operativa
    const factorStock = ((totalProductos - productosStockBajo - productosSinStock) / totalProductos) * 100;
    const factorRotacion = totalProductos > 0 ? Math.min((salidas / totalProductos) * 20, 50) : 0; // Max 50%
    const factorActividad = Math.min(totalMovimientos * 2, 50); // Max 50%
    
    const eficienciaAlternativa = (factorStock * 0.4) + (factorRotacion * 0.3) + (factorActividad * 0.3);
    
    console.log('\n🎯 Análisis de eficiencia:');
    console.log(`Factor Stock: ${factorStock.toFixed(2)}% (peso 40%)`);
    console.log(`Factor Rotación: ${factorRotacion.toFixed(2)}% (peso 30%)`);
    console.log(`Factor Actividad: ${factorActividad.toFixed(2)}% (peso 30%)`);
    console.log(`Eficiencia Operativa Calculada: ${eficienciaAlternativa.toFixed(2)}%`);
    
    // Comparar con rotación de inventario
    const rotacion = await prisma.$queryRaw`
      WITH ventas_periodo AS (
        SELECT SUM(cantidad) as total_vendido
        FROM "MovimientoInventario"
        WHERE "empresaId" = ${empresaId}
          AND tipo = 'SALIDA'
          AND "createdAt" >= NOW() - INTERVAL '30 days'
      ),
      inventario_promedio AS (
        SELECT SUM(stock) as stock_total
        FROM "Producto"
        WHERE "empresaId" = ${empresaId}
          AND estado = 'ACTIVO'
      )
      SELECT 
        vp.total_vendido,
        ip.stock_total,
        CASE 
          WHEN ip.stock_total > 0 THEN (vp.total_vendido / ip.stock_total) * 12
          ELSE 0
        END as rotacion_anual
      FROM ventas_periodo vp, inventario_promedio ip
    `;
    
    console.log('\n📈 Rotación de inventario:', rotacion[0]);
    const rotacionAnual = Number(rotacion[0].rotacion_anual || 0);
    const eficienciaBasadaEnRotacion = Math.min(rotacionAnual * 10, 100);
    console.log(`Eficiencia basada en rotación: ${eficienciaBasadaEnRotacion.toFixed(2)}%`);
    
  } catch (error) {
    console.error('❌ Error en debug:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar debug
if (require.main === module) {
  debugEficienciaOperativa()
    .then(() => {
      console.log('\n✅ Debug completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error ejecutando debug:', error);
      process.exit(1);
    });
}

module.exports = { debugEficienciaOperativa };
