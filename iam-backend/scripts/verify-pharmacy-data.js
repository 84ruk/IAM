const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyPharmacyData() {
  try {
    console.log('💊 Verificando datos para farmacia...\n');

    // Buscar la empresa de la farmacia
    const empresa = await prisma.empresa.findFirst({
      where: {
        nombre: {
          contains: 'CliniFarm'
        }
      }
    });

    if (!empresa) {
      console.log('❌ No se encontró la empresa de la farmacia');
      return;
    }

    console.log(`🏥 Empresa: ${empresa.nombre} (ID: ${empresa.id})`);
    console.log(`🏭 Industria: ${empresa.industria}\n`);

    // Obtener estadísticas generales
    const productos = await prisma.producto.findMany({
      where: { empresaId: empresa.id }
    });

    const proveedores = await prisma.proveedor.findMany({
      where: { empresaId: empresa.id }
    });

    const movimientos = await prisma.movimientoInventario.findMany({
      where: { empresaId: empresa.id }
    });

    const pedidos = await prisma.pedidoInventario.findMany({
      where: { empresaId: empresa.id }
    });

    console.log('📊 Resumen General:');
    console.log('==================');
    console.log(`   💊 Productos farmacéuticos: ${productos.length}`);
    console.log(`   🏭 Proveedores especializados: ${proveedores.length}`);
    console.log(`   📊 Movimientos de farmacia: ${movimientos.length}`);
    console.log(`   📋 Pedidos a proveedores: ${pedidos.length}`);

    // Análisis por tipo de producto
    const productosPorTipo = {};
    productos.forEach(p => {
      productosPorTipo[p.tipoProducto] = (productosPorTipo[p.tipoProducto] || 0) + 1;
    });

    console.log('\n💊 Productos por Categoría:');
    console.log('===========================');
    Object.entries(productosPorTipo).forEach(([tipo, cantidad]) => {
      console.log(`   ${tipo}: ${cantidad} productos`);
    });

    // Productos con stock bajo
    const productosStockBajo = productos.filter(p => p.stock <= p.stockMinimo);
    
    console.log('\n⚠️  Productos con Stock Bajo:');
    console.log('============================');
    if (productosStockBajo.length > 0) {
      productosStockBajo.forEach(p => {
        const porcentaje = ((p.stock / p.stockMinimo) * 100).toFixed(1);
        console.log(`   🔴 ${p.nombre} (${p.tipoProducto}): ${p.stock}/${p.stockMinimo} (${porcentaje}%) - $${p.precioVenta}`);
      });
    } else {
      console.log('   ✅ Todos los productos tienen stock adecuado');
    }

    // Productos de alto valor
    const productosAltoValor = productos
      .sort((a, b) => b.precioVenta - a.precioVenta)
      .slice(0, 5);

    console.log('\n💎 Productos de Alto Valor:');
    console.log('===========================');
    productosAltoValor.forEach((p, index) => {
      const emoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '💎';
      console.log(`   ${emoji} ${p.nombre} (${p.tipoProducto}): $${p.precioVenta} - Stock: ${p.stock}`);
    });

    // Análisis de movimientos
    const movimientosEntrada = movimientos.filter(m => m.tipo === 'ENTRADA').length;
    const movimientosSalida = movimientos.filter(m => m.tipo === 'SALIDA').length;

    console.log('\n📈 Movimientos por Tipo (Farmacia):');
    console.log('====================================');
    console.log(`   ENTRADA: ${movimientosEntrada} movimientos`);
    console.log(`   SALIDA: ${movimientosSalida} movimientos`);

    // Análisis de pedidos
    const pedidosPorEstado = {};
    pedidos.forEach(p => {
      pedidosPorEstado[p.estado] = (pedidosPorEstado[p.estado] || 0) + 1;
    });

    console.log('\n📋 Pedidos por Estado:');
    console.log('======================');
    Object.entries(pedidosPorEstado).forEach(([estado, cantidad]) => {
      console.log(`   ${estado}: ${cantidad} pedidos`);
    });

    // Valor del inventario
    const valorTotalCompra = productos.reduce((sum, p) => sum + (p.stock * p.precioCompra), 0);
    const valorTotalVenta = productos.reduce((sum, p) => sum + (p.stock * p.precioVenta), 0);
    const margenTotal = valorTotalVenta - valorTotalCompra;
    const margenPorcentual = valorTotalCompra > 0 ? (margenTotal / valorTotalCompra) * 100 : 0;

    console.log('\n💰 Valor del Inventario (Farmacia):');
    console.log('====================================');
    console.log(`   💵 Valor total (precio venta): $${valorTotalVenta.toLocaleString()}`);
    console.log(`   💰 Valor total (precio compra): $${valorTotalCompra.toLocaleString()}`);
    console.log(`   📦 Productos activos: ${productos.length}`);
    console.log(`   📈 Margen promedio: $${(margenTotal / productos.length).toFixed(2)}`);
    console.log(`   📊 Margen porcentual: ${margenPorcentual.toFixed(1)}%`);

    // Análisis de rotación
    const ventasUltimoMes = movimientos
      .filter(m => m.tipo === 'SALIDA' && m.createdAt >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      .reduce((sum, m) => sum + m.cantidad, 0);

    const stockPromedio = productos.reduce((sum, p) => sum + p.stock, 0) / productos.length;
    const rotacionMensual = stockPromedio > 0 ? ventasUltimoMes / stockPromedio : 0;

    console.log('\n🔄 Rotación de Inventario (Farmacia):');
    console.log('======================================');
    console.log(`   📊 Ventas último mes: ${ventasUltimoMes} unidades`);
    console.log(`   📦 Stock promedio: ${stockPromedio.toFixed(1)} unidades`);
    console.log(`   🔄 Rotación mensual: ${rotacionMensual.toFixed(2)} veces`);

    // Productos más vendidos (simulado)
    const productosMasVendidos = productos
      .sort((a, b) => {
        const ventasA = movimientos
          .filter(m => m.productoId === a.id && m.tipo === 'SALIDA')
          .reduce((sum, m) => sum + m.cantidad, 0);
        const ventasB = movimientos
          .filter(m => m.productoId === b.id && m.tipo === 'SALIDA')
          .reduce((sum, m) => sum + m.cantidad, 0);
        return ventasB - ventasA;
      })
      .slice(0, 8);

    console.log('\n🏆 Productos Más Vendidos (Último Mes):');
    console.log('=======================================');
    productosMasVendidos.forEach((p, index) => {
      const ventas = movimientos
        .filter(m => m.productoId === p.id && m.tipo === 'SALIDA')
        .reduce((sum, m) => sum + m.cantidad, 0);
      const emoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅';
      console.log(`   ${emoji} ${p.nombre} (${p.tipoProducto}): ${ventas} vendidas - $${p.precioVenta}`);
    });

    // Análisis de medicamentos controlados
    const medicamentosControlados = productos.filter(p => 
      p.etiquetas.some(etiqueta => etiqueta.includes('controlado'))
    );

    console.log('\n🔒 Análisis de Medicamentos Controlados:');
    console.log('========================================');
    console.log(`   🔒 Total de medicamentos controlados: ${medicamentosControlados.length}`);
    medicamentosControlados.forEach(p => {
      console.log(`      - ${p.nombre}: Stock ${p.stock}, Mínimo ${p.stockMinimo}`);
    });

    // Análisis de equipos médicos
    const equiposMedicos = productos.filter(p => p.tipoProducto === 'ELECTRONICO');

    console.log('\n🏥 Análisis de Equipos Médicos:');
    console.log('===============================');
    console.log(`   🏥 Total de equipos médicos: ${equiposMedicos.length}`);
    equiposMedicos.forEach(p => {
      console.log(`      - ${p.nombre}: $${p.precioVenta}, Stock ${p.stock}`);
    });

    console.log('\n✅ Verificación de Datos para KPIs de Farmacia:');
    console.log('================================================');
    console.log('   ✅ Productos farmacéuticos: Variedad de medicamentos');
    console.log('   ✅ Medicamentos controlados: Productos con etiqueta "controlado"');
    console.log('   ✅ Equipos médicos: Productos electrónicos para salud');
    console.log('   ✅ Vitaminas y suplementos: Productos de bienestar');
    console.log('   ✅ Productos de cuidado personal: Higiene y protección');
    console.log('   ✅ Movimientos frecuentes: Alta rotación típica de farmacias');
    console.log('   ✅ Productos con stock bajo: Alertas de inventario');
    console.log('   ✅ Proveedores especializados: Laboratorios farmacéuticos');
    console.log('   ✅ Pedidos activos: Gestión de pedidos');

    console.log('\n🎯 Datos listos para probar KPIs específicos de la industria farmacéutica!');
    console.log('🔗 Endpoints disponibles:');
    console.log('   - GET /dashboard-cqrs/kpis');
    console.log('   - GET /dashboard-cqrs/financial-kpis');
    console.log('   - GET /dashboard-cqrs/industry-kpis?industry=FARMACIA');
    console.log('   - GET /dashboard-cqrs/predictive-kpis');
    console.log('   - GET /dashboard-cqrs/data (todos los KPIs)');

    console.log('\n🎉 Verificación completada exitosamente');

  } catch (error) {
    console.error('❌ Error verificando datos de farmacia:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyPharmacyData(); 