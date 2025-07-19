const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function analyzeROICalculation() {
  try {
    console.log('🔍 Analizando cálculo del ROI del Inventario...\n');

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

    // 1. Calcular ventas del último mes (como lo hace el backend)
    const ventasMes = await prisma.$queryRaw`
      SELECT COALESCE(SUM(m.cantidad * p."precioVenta"), 0) as ventas_totales
      FROM "MovimientoInventario" m
      JOIN "Producto" p ON m."productoId" = p.id
      WHERE m."empresaId" = ${empresa.id}
        AND m.tipo = 'SALIDA'
        AND m."createdAt" >= NOW() - INTERVAL '30 days'
    `;

    const ventasTotales = Number(ventasMes[0]?.ventas_totales || 0);

    // 2. Calcular inventario promedio (como lo hace el backend)
    const inventarioPromedio = await prisma.$queryRaw`
      SELECT COALESCE(AVG(p.stock * p."precioCompra"), 0) as inventario_avg
      FROM "Producto" p
      WHERE p."empresaId" = ${empresa.id}
        AND p.estado = 'ACTIVO'
    `;

    const inventarioAvg = Number(inventarioPromedio[0]?.inventario_avg || 0);

    // 3. Calcular ROI (como lo hace el backend)
    const roi = inventarioAvg > 0 ? ((ventasTotales - inventarioAvg) / inventarioAvg) * 100 : 0;

    console.log('📊 Cálculo del ROI (Backend):');
    console.log('================================');
    console.log(`💰 Ventas del último mes: $${ventasTotales.toLocaleString()}`);
    console.log(`📦 Inventario promedio (costo): $${inventarioAvg.toLocaleString()}`);
    console.log(`📈 ROI = ((${ventasTotales.toLocaleString()} - ${inventarioAvg.toLocaleString()}) / ${inventarioAvg.toLocaleString()}) × 100`);
    console.log(`🎯 ROI calculado: ${roi.toFixed(2)}%\n`);

    // 4. Análisis detallado de los datos
    console.log('🔍 Análisis Detallado:');
    console.log('======================');

    // Obtener todos los productos con sus stocks y precios
    const productos = await prisma.producto.findMany({
      where: {
        empresaId: empresa.id,
        estado: 'ACTIVO'
      },
      select: {
        id: true,
        nombre: true,
        stock: true,
        precioCompra: true,
        precioVenta: true,
        tipoProducto: true
      }
    });

    console.log(`📦 Total de productos activos: ${productos.length}`);

    // Calcular valores totales
    const valorTotalCompra = productos.reduce((sum, p) => sum + (p.stock * p.precioCompra), 0);
    const valorTotalVenta = productos.reduce((sum, p) => sum + (p.stock * p.precioVenta), 0);
    const stockTotal = productos.reduce((sum, p) => sum + p.stock, 0);

    console.log(`💰 Valor total del inventario (costo): $${valorTotalCompra.toLocaleString()}`);
    console.log(`💵 Valor total del inventario (venta): $${valorTotalVenta.toLocaleString()}`);
    console.log(`📊 Stock total: ${stockTotal} unidades`);

    // 5. Problemas identificados en el cálculo
    console.log('\n⚠️  PROBLEMAS IDENTIFICADOS:');
    console.log('============================');

    // Problema 1: Usa AVG en lugar de SUM para el inventario
    console.log('🔴 Problema 1: Usa AVG en lugar de SUM');
    console.log(`   - Backend usa: AVG(stock * precioCompra) = $${inventarioAvg.toLocaleString()}`);
    console.log(`   - Debería usar: SUM(stock * precioCompra) = $${valorTotalCompra.toLocaleString()}`);
    console.log(`   - Diferencia: ${((inventarioAvg - valorTotalCompra) / valorTotalCompra * 100).toFixed(2)}%`);

    // Problema 2: Compara ventas con inventario promedio
    console.log('\n🔴 Problema 2: Compara ventas con inventario promedio');
    console.log('   - Las ventas son del último mes (flujo)');
    console.log('   - El inventario es el stock actual (stock)');
    console.log('   - No son comparables directamente');

    // Problema 3: No considera el costo de las ventas
    console.log('\n🔴 Problema 3: No considera el costo de las ventas');
    console.log('   - ROI debería ser: (Beneficio / Inversión) × 100');
    console.log('   - Beneficio = Ventas - Costo de las ventas');
    console.log('   - Inversión = Valor del inventario');

    // 6. Cálculo correcto del ROI
    console.log('\n✅ CÁLCULO CORRECTO DEL ROI:');
    console.log('============================');

    // Obtener el costo de las ventas del último mes
    const costoVentas = await prisma.$queryRaw`
      SELECT COALESCE(SUM(m.cantidad * p."precioCompra"), 0) as costo_ventas
      FROM "MovimientoInventario" m
      JOIN "Producto" p ON m."productoId" = p.id
      WHERE m."empresaId" = ${empresa.id}
        AND m.tipo = 'SALIDA'
        AND m."createdAt" >= NOW() - INTERVAL '30 days'
    `;

    const costoVentasTotal = Number(costoVentas[0]?.costo_ventas || 0);
    const beneficio = ventasTotales - costoVentasTotal;
    const roiCorrecto = valorTotalCompra > 0 ? (beneficio / valorTotalCompra) * 100 : 0;

    console.log(`💰 Ventas del último mes: $${ventasTotales.toLocaleString()}`);
    console.log(`💸 Costo de las ventas: $${costoVentasTotal.toLocaleString()}`);
    console.log(`📈 Beneficio: $${beneficio.toLocaleString()}`);
    console.log(`💼 Inversión en inventario: $${valorTotalCompra.toLocaleString()}`);
    console.log(`🎯 ROI correcto: ${roiCorrecto.toFixed(2)}%`);

    // 7. Comparación de métodos
    console.log('\n📊 COMPARACIÓN DE MÉTODOS:');
    console.log('==========================');
    console.log(`🔴 Backend actual: ${roi.toFixed(2)}%`);
    console.log(`✅ Método correcto: ${roiCorrecto.toFixed(2)}%`);
    console.log(`📈 Diferencia: ${(roiCorrecto - roi).toFixed(2)} puntos porcentuales`);

    // 8. Recomendaciones
    console.log('\n💡 RECOMENDACIONES:');
    console.log('===================');
    console.log('1. Cambiar AVG por SUM en el cálculo del inventario');
    console.log('2. Usar el costo de las ventas en lugar del inventario promedio');
    console.log('3. Considerar el período de tiempo (mensual vs anual)');
    console.log('4. Agregar validaciones para evitar divisiones por cero');

  } catch (error) {
    console.error('❌ Error analizando ROI:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeROICalculation(); 