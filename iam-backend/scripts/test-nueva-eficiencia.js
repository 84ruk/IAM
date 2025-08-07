const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testNuevaEficiencia() {
  try {
    console.log('🧪 Probando nuevo cálculo de eficiencia operativa...');
    
    const empresaId = 2;
    
    // Replicar exactamente el nuevo cálculo
    console.log('\n📊 Paso 1: Métricas de productos...');
    const productosResult = await prisma.$queryRaw`
      SELECT 
        COUNT(DISTINCT p.id)::integer as total_productos,
        COUNT(CASE WHEN p.stock <= p."stockMinimo" THEN 1 END)::integer as productos_stock_bajo,
        COUNT(CASE WHEN p.stock = 0 THEN 1 END)::integer as productos_sin_stock
      FROM "Producto" p
      WHERE p."empresaId" = ${empresaId}
        AND p.estado = 'ACTIVO'
    `;
    
    console.log('Productos resultado:', productosResult[0]);
    
    console.log('\n📊 Paso 2: Métricas de movimientos...');
    const movimientosResult = await prisma.$queryRaw`
      WITH movimientos_mes AS (
        SELECT 
          COUNT(*)::integer as total_movimientos,
          COUNT(CASE WHEN tipo = 'SALIDA' THEN 1 END)::integer as salidas,
          COALESCE(SUM(CASE WHEN tipo = 'SALIDA' THEN cantidad ELSE 0 END), 0) as total_vendido
        FROM "MovimientoInventario"
        WHERE "empresaId" = ${empresaId}
          AND "createdAt" >= NOW() - INTERVAL '30 days'
      ),
      stock_total AS (
        SELECT COALESCE(SUM(stock), 0) as inventario_total
        FROM "Producto"
        WHERE "empresaId" = ${empresaId}
          AND estado = 'ACTIVO'
      )
      SELECT 
        mm.total_movimientos,
        mm.salidas,
        mm.total_vendido,
        st.inventario_total,
        CASE 
          WHEN st.inventario_total > 0 THEN (mm.total_vendido::float / st.inventario_total::float) * 12
          ELSE 0
        END as rotacion_inventario
      FROM movimientos_mes mm, stock_total st
    `;
    
    console.log('Movimientos resultado:', movimientosResult[0]);
    
    // Convertir y calcular como en el código
    const productos = productosResult[0];
    const movimientos = movimientosResult[0];

    const totalProductos = Number(productos.total_productos);
    const productosStockBajo = Number(productos.productos_stock_bajo);
    const productosSinStock = Number(productos.productos_sin_stock);
    const totalMovimientos = Number(movimientos.total_movimientos);
    const salidas = Number(movimientos.salidas);
    const rotacionInventario = Number(movimientos.rotacion_inventario);

    console.log('\n📊 Paso 3: Valores convertidos...');
    console.log({
      totalProductos,
      productosStockBajo,
      productosSinStock,
      totalMovimientos,
      salidas,
      rotacionInventario
    });

    // Calcular factores
    console.log('\n📊 Paso 4: Calculando factores...');
    
    if (totalProductos === 0) {
      console.log('❌ No hay productos, eficiencia = 0');
      return 0;
    }

    // Factor 1: Gestión de stock (40% del peso)
    const factorStock = ((totalProductos - productosStockBajo - productosSinStock) / totalProductos) * 100;
    console.log(`Factor Stock: (${totalProductos} - ${productosStockBajo} - ${productosSinStock}) / ${totalProductos} * 100 = ${factorStock.toFixed(2)}%`);
    
    // Factor 2: Actividad de movimientos (30% del peso)
    const factorActividad = Math.min(totalMovimientos * 1.5, 50);
    console.log(`Factor Actividad: Math.min(${totalMovimientos} * 1.5, 50) = ${factorActividad.toFixed(2)}%`);
    
    // Factor 3: Rotación de inventario (30% del peso)
    const factorRotacion = Math.min(rotacionInventario * 8, 50);
    console.log(`Factor Rotación: Math.min(${rotacionInventario.toFixed(2)} * 8, 50) = ${factorRotacion.toFixed(2)}%`);

    // Eficiencia operativa ponderada
    const eficienciaOperativa = (factorStock * 0.4) + (factorActividad * 0.3) + (factorRotacion * 0.3);
    console.log(`\nEficiencia Operativa: (${factorStock.toFixed(2)} * 0.4) + (${factorActividad.toFixed(2)} * 0.3) + (${factorRotacion.toFixed(2)} * 0.3) = ${eficienciaOperativa.toFixed(2)}%`);

    const eficienciaFinal = Math.round(eficienciaOperativa * 100) / 100;
    console.log(`Eficiencia Final (redondeada): ${eficienciaFinal}%`);

    return eficienciaFinal;
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
    return 0;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar prueba
if (require.main === module) {
  testNuevaEficiencia()
    .then((resultado) => {
      console.log(`\n🎯 Resultado final: ${resultado}%`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error ejecutando prueba:', error);
      process.exit(1);
    });
}

module.exports = { testNuevaEficiencia };
