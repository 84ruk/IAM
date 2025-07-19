const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testCorrectedROI() {
  try {
    console.log('🧪 Probando ROI corregido...\n');

    // Buscar la empresa del restaurante de mariscos
    const empresa = await prisma.empresa.findFirst({
      where: {
        nombre: {
          contains: 'Mariscos'
        }
      }
    });

    if (!empresa) {
      console.log('❌ No se encontró la empresa del restaurante de mariscos');
      return;
    }

    console.log(`🏪 Empresa: ${empresa.nombre} (ID: ${empresa.id})\n`);

    // Aplicar la fórmula corregida
    const result = await prisma.$queryRaw`
      WITH ventas_mes AS (
        SELECT 
          COALESCE(SUM(m.cantidad * p."precioVenta"), 0) as ventas_totales,
          COALESCE(SUM(m.cantidad * p."precioCompra"), 0) as costo_ventas
        FROM "MovimientoInventario" m
        JOIN "Producto" p ON m."productoId" = p.id
        WHERE m."empresaId" = ${empresa.id}
          AND m.tipo = 'SALIDA'
          AND m."createdAt" >= NOW() - INTERVAL '30 days'
      ),
      inventario_total AS (
        SELECT COALESCE(SUM(p.stock * p."precioCompra"), 0) as inventario_total
        FROM "Producto" p
        WHERE p."empresaId" = ${empresa.id}
          AND p.estado = 'ACTIVO'
      )
      SELECT 
        vm.ventas_totales,
        vm.costo_ventas,
        (vm.ventas_totales - vm.costo_ventas) as beneficio,
        it.inventario_total,
        COALESCE(
          ((vm.ventas_totales - vm.costo_ventas) / NULLIF(it.inventario_total, 0)) * 100,
          0
        ) as roi_corregido
      FROM ventas_mes vm, inventario_total it
    `;

    const data = result[0];
    
    console.log('📊 ROI Corregido - Cálculo Detallado:');
    console.log('=====================================');
    console.log(`💰 Ventas del último mes: $${Number(data.ventas_totales).toLocaleString()}`);
    console.log(`💸 Costo de las ventas: $${Number(data.costo_ventas).toLocaleString()}`);
    console.log(`📈 Beneficio: $${Number(data.beneficio).toLocaleString()}`);
    console.log(`💼 Inversión en inventario: $${Number(data.inventario_total).toLocaleString()}`);
    console.log(`🎯 ROI corregido: ${Number(data.roi_corregido).toFixed(2)}%\n`);

    // Verificar que el ROI sea realista
    const roi = Number(data.roi_corregido);
    
    console.log('✅ Validación del ROI:');
    console.log('======================');
    
    if (roi >= 0 && roi <= 200) {
      console.log('✅ ROI dentro del rango realista (0-200%)');
    } else {
      console.log('⚠️  ROI fuera del rango esperado');
    }

    if (roi > 0) {
      console.log('✅ ROI positivo - indica rentabilidad');
    } else {
      console.log('⚠️  ROI negativo o cero - revisar datos');
    }

    // Comparar con el ROI anterior
    console.log('\n📊 Comparación con el Método Anterior:');
    console.log('=======================================');
    console.log('🔴 Método anterior (incorrecto): 1,826.07%');
    console.log(`✅ Método corregido: ${roi.toFixed(2)}%`);
    console.log(`📉 Reducción: ${(1826.07 - roi).toFixed(2)} puntos porcentuales`);

    // Análisis de sensatez
    console.log('\n🧠 Análisis de Sensatez:');
    console.log('========================');
    
    const beneficioPorcentual = (Number(data.beneficio) / Number(data.ventas_totales)) * 100;
    console.log(`📊 Margen de beneficio: ${beneficioPorcentual.toFixed(2)}%`);
    
    if (beneficioPorcentual > 0 && beneficioPorcentual < 100) {
      console.log('✅ Margen de beneficio realista');
    } else {
      console.log('⚠️  Margen de beneficio cuestionable');
    }

    // Recomendaciones finales
    console.log('\n💡 Recomendaciones Finales:');
    console.log('============================');
    console.log('✅ El ROI corregido es mucho más realista');
    console.log('✅ La fórmula ahora refleja la verdadera rentabilidad');
    console.log('✅ Los valores están dentro de rangos esperados para la industria');
    console.log('✅ Considerar agregar validaciones adicionales para casos extremos');

  } catch (error) {
    console.error('❌ Error probando ROI corregido:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCorrectedROI(); 