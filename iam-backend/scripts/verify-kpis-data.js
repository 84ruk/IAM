const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔍 Verificando datos para KPIs...');

    // Buscar el usuario admin@elpeso.com
    const usuario = await prisma.usuario.findUnique({
      where: { email: 'admin@elpeso.com' },
      include: { empresa: true }
    });

    if (!usuario || !usuario.empresa) {
      throw new Error('Usuario admin@elpeso.com no encontrado o sin empresa asociada');
    }

    const empresaId = usuario.empresa.id;
    console.log(`📋 Empresa: ${usuario.empresa.nombre} (ID: ${empresaId})`);

    // 1. Resumen general
    console.log('\n📊 Resumen General:');
    console.log('==================');
    
    const totalProductos = await prisma.producto.count({ where: { empresaId } });
    const totalProveedores = await prisma.proveedor.count({ where: { empresaId } });
    const totalMovimientos = await prisma.movimientoInventario.count({ where: { empresaId } });
    const totalPedidos = await prisma.pedidoInventario.count({ where: { empresaId } });
    
    console.log(`   📦 Productos: ${totalProductos}`);
    console.log(`   🏭 Proveedores: ${totalProveedores}`);
    console.log(`   📊 Movimientos: ${totalMovimientos}`);
    console.log(`   📋 Pedidos: ${totalPedidos}`);

    // 2. Productos con stock bajo
    console.log('\n⚠️  Productos con Stock Bajo:');
    console.log('============================');
    
    const productosStockBajo = await prisma.producto.findMany({
      where: {
        empresaId,
        estado: 'ACTIVO',
        stock: {
          lte: prisma.producto.fields.stockMinimo
        }
      },
      select: {
        nombre: true,
        stock: true,
        stockMinimo: true,
        precioVenta: true,
        precioCompra: true
      },
      orderBy: {
        stock: 'asc'
      }
    });

    if (productosStockBajo.length === 0) {
      console.log('   ✅ No hay productos con stock bajo');
    } else {
      productosStockBajo.forEach(producto => {
        const porcentaje = ((producto.stock / producto.stockMinimo) * 100).toFixed(1);
        const margen = ((producto.precioVenta - producto.precioCompra) / producto.precioCompra * 100).toFixed(1);
        const icono = producto.stock === 0 ? '🔴' : producto.stock < producto.stockMinimo * 0.5 ? '🟡' : '🟠';
        console.log(`   ${icono} ${producto.nombre}: ${producto.stock}/${producto.stockMinimo} (${porcentaje}%) - Margen: ${margen}%`);
      });
    }

    // 3. Movimientos por tipo
    console.log('\n📈 Movimientos por Tipo:');
    console.log('========================');
    
    const movimientosPorTipo = await prisma.movimientoInventario.groupBy({
      by: ['tipo'],
      where: { empresaId },
      _count: {
        tipo: true
      }
    });

    movimientosPorTipo.forEach(mov => {
      console.log(`   ${mov.tipo}: ${mov._count.tipo} movimientos`);
    });

    // 4. Movimientos por mes (últimos 3 meses)
    console.log('\n📅 Movimientos por Mes (Últimos 3 meses):');
    console.log('==========================================');
    
    const tresMesesAtras = new Date();
    tresMesesAtras.setMonth(tresMesesAtras.getMonth() - 3);
    
    const movimientosPorMes = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', "createdAt") as mes,
        COUNT(*) as total,
        COUNT(CASE WHEN tipo = 'ENTRADA' THEN 1 END) as entradas,
        COUNT(CASE WHEN tipo = 'SALIDA' THEN 1 END) as salidas
      FROM "MovimientoInventario"
      WHERE "empresaId" = ${empresaId}
        AND "createdAt" >= ${tresMesesAtras}
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY mes DESC
    `;

    movimientosPorMes.forEach(mov => {
      const fecha = new Date(mov.mes).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
      console.log(`   ${fecha}: ${mov.total} total (${mov.entradas} entradas, ${mov.salidas} salidas)`);
    });

    // 5. Valor total del inventario
    console.log('\n💰 Valor del Inventario:');
    console.log('========================');
    
    const valorInventario = await prisma.$queryRaw`
      SELECT 
        SUM(stock * "precioVenta") as valor_venta,
        SUM(stock * "precioCompra") as valor_compra,
        COUNT(*) as total_productos,
        AVG("precioVenta" - "precioCompra") as margen_promedio
      FROM "Producto"
      WHERE "empresaId" = ${empresaId}
        AND estado = 'ACTIVO'
    `;

    const valor = valorInventario[0];
    console.log(`   💵 Valor total (precio venta): $${valor.valor_venta?.toFixed(2) || '0.00'}`);
    console.log(`   💰 Valor total (precio compra): $${valor.valor_compra?.toFixed(2) || '0.00'}`);
    console.log(`   📦 Productos activos: ${valor.total_productos || 0}`);
    console.log(`   📈 Margen promedio: $${valor.margen_promedio?.toFixed(2) || '0.00'}`);

    // 6. Rotación de inventario estimada
    console.log('\n🔄 Rotación de Inventario Estimada:');
    console.log('===================================');
    
    const rotacionEstimada = await prisma.$queryRaw`
      WITH ventas_mes AS (
        SELECT COALESCE(SUM(cantidad), 0) as total_ventas
        FROM "MovimientoInventario"
        WHERE "empresaId" = ${empresaId}
          AND tipo = 'SALIDA'
          AND "createdAt" >= NOW() - INTERVAL '30 days'
      ),
      inventario_promedio AS (
        SELECT COALESCE(AVG(stock), 0) as stock_promedio
        FROM "Producto"
        WHERE "empresaId" = ${empresaId}
          AND estado = 'ACTIVO'
      )
      SELECT 
        vm.total_ventas,
        ip.stock_promedio,
        CASE 
          WHEN ip.stock_promedio > 0 THEN vm.total_ventas / ip.stock_promedio
          ELSE 0
        END as rotacion
      FROM ventas_mes vm, inventario_promedio ip
    `;

    const rotacion = rotacionEstimada[0];
    console.log(`   📊 Ventas último mes: ${rotacion.total_ventas || 0} unidades`);
    console.log(`   📦 Stock promedio: ${rotacion.stock_promedio?.toFixed(1) || '0'} unidades`);
    console.log(`   🔄 Rotación mensual: ${rotacion.rotacion?.toFixed(2) || '0'} veces`);

    // 7. Productos más vendidos
    console.log('\n🏆 Productos Más Vendidos (Último Mes):');
    console.log('=======================================');
    
    const productosMasVendidos = await prisma.$queryRaw`
      SELECT 
        p.nombre,
        COALESCE(SUM(m.cantidad), 0) as ventas,
        p.stock as stock_actual
      FROM "Producto" p
      LEFT JOIN "MovimientoInventario" m ON p.id = m."productoId"
        AND m.tipo = 'SALIDA'
        AND m."createdAt" >= NOW() - INTERVAL '30 days'
      WHERE p."empresaId" = ${empresaId}
        AND p.estado = 'ACTIVO'
      GROUP BY p.id, p.nombre, p.stock
      ORDER BY ventas DESC
      LIMIT 5
    `;

    productosMasVendidos.forEach((producto, index) => {
      const icono = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅';
      console.log(`   ${icono} ${producto.nombre}: ${producto.ventas} vendidas (stock: ${producto.stock_actual})`);
    });

    // 8. Verificación de datos para KPIs
    console.log('\n✅ Verificación de Datos para KPIs:');
    console.log('===================================');
    
    const verificaciones = [
      {
        nombre: 'Productos con stock bajo',
        condicion: productosStockBajo.length > 0,
        descripcion: 'Para probar alertas de stock'
      },
      {
        nombre: 'Movimientos de entrada y salida',
        condicion: movimientosPorTipo.length >= 2,
        descripcion: 'Para calcular rotación de inventario'
      },
      {
        nombre: 'Productos con precios diferentes',
        condicion: totalProductos > 5,
        descripcion: 'Para calcular márgenes'
      },
      {
        nombre: 'Movimientos en los últimos 90 días',
        condicion: totalMovimientos > 50,
        descripcion: 'Para predicciones y tendencias'
      },
      {
        nombre: 'Pedidos en diferentes estados',
        condicion: totalPedidos > 0,
        descripcion: 'Para KPIs de gestión de pedidos'
      }
    ];

    verificaciones.forEach(verificacion => {
      const icono = verificacion.condicion ? '✅' : '❌';
      console.log(`   ${icono} ${verificacion.nombre}: ${verificacion.descripcion}`);
    });

    console.log('\n🎯 Datos listos para probar el módulo de KPIs!');
    console.log('🔗 Endpoints disponibles:');
    console.log('   - GET /dashboard-cqrs/kpis');
    console.log('   - GET /dashboard-cqrs/financial-kpis');
    console.log('   - GET /dashboard-cqrs/industry-kpis');
    console.log('   - GET /dashboard-cqrs/predictive-kpis');
    console.log('   - GET /dashboard-cqrs/data (todos los KPIs)');

  } catch (error) {
    console.error('❌ Error verificando datos:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el script
if (require.main === module) {
  main()
    .then(() => {
      console.log('\n🎉 Verificación completada exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Error en la verificación:', error);
      process.exit(1);
    });
}

module.exports = { main }; 