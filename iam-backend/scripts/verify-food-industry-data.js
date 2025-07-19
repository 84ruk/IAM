const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🐟 Verificando datos para restaurante de mariscos...');

    // Buscar el usuario prueba@iam.com
    const usuario = await prisma.usuario.findUnique({
      where: { email: 'prueba@iam.com' },
      include: { empresa: true }
    });

    if (!usuario || !usuario.empresa) {
      throw new Error('Usuario prueba@iam.com no encontrado o sin empresa asociada');
    }

    const empresaId = usuario.empresa.id;
    console.log(`📋 Empresa: ${usuario.empresa.nombre} (ID: ${empresaId})`);
    console.log(`🏭 Industria: ${usuario.empresa.TipoIndustria}`);

    // 1. Resumen general
    console.log('\n📊 Resumen General:');
    console.log('==================');
    
    const totalProductos = await prisma.producto.count({ where: { empresaId } });
    const totalProveedores = await prisma.proveedor.count({ where: { empresaId } });
    const totalMovimientos = await prisma.movimientoInventario.count({ where: { empresaId } });
    const totalPedidos = await prisma.pedidoInventario.count({ where: { empresaId } });
    
    console.log(`   🐟 Productos de mariscos: ${totalProductos}`);
    console.log(`   🏭 Proveedores especializados: ${totalProveedores}`);
    console.log(`   📊 Movimientos de restaurante: ${totalMovimientos}`);
    console.log(`   📋 Pedidos a proveedores: ${totalPedidos}`);

    // 2. Productos por categoría
    console.log('\n🐠 Productos por Categoría:');
    console.log('===========================');
    
    const productosPorCategoria = await prisma.producto.groupBy({
      by: ['tipoProducto'],
      where: { empresaId },
      _count: {
        tipoProducto: true
      }
    });

    productosPorCategoria.forEach(cat => {
      console.log(`   ${cat.tipoProducto}: ${cat._count.tipoProducto} productos`);
    });

    // 3. Productos con stock bajo
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
        tipoProducto: true
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
        const icono = producto.stock === 0 ? '🔴' : producto.stock < producto.stockMinimo * 0.5 ? '🟡' : '🟠';
        console.log(`   ${icono} ${producto.nombre} (${producto.tipoProducto}): ${producto.stock}/${producto.stockMinimo} (${porcentaje}%) - $${producto.precioVenta}`);
      });
    }

    // 4. Productos premium (alto valor)
    console.log('\n💎 Productos Premium (Alto Valor):');
    console.log('==================================');
    
    const productosPremium = await prisma.producto.findMany({
      where: {
        empresaId,
        estado: 'ACTIVO',
        precioVenta: {
          gte: 300
        }
      },
      select: {
        nombre: true,
        precioVenta: true,
        stock: true,
        tipoProducto: true
      },
      orderBy: {
        precioVenta: 'desc'
      },
      take: 10
    });

    productosPremium.forEach((producto, index) => {
      const icono = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '💎';
      console.log(`   ${icono} ${producto.nombre} (${producto.tipoProducto}): $${producto.precioVenta} - Stock: ${producto.stock}`);
    });

    // 5. Movimientos por tipo (específicos de restaurante)
    console.log('\n📈 Movimientos por Tipo (Restaurante):');
    console.log('======================================');
    
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

    // 6. Movimientos por mes (últimos 3 meses)
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

    // 7. Valor total del inventario (específico de alimentos)
    console.log('\n💰 Valor del Inventario (Mariscos):');
    console.log('====================================');
    
    const valorInventario = await prisma.$queryRaw`
      SELECT 
        SUM(stock * "precioVenta") as valor_venta,
        SUM(stock * "precioCompra") as valor_compra,
        COUNT(*) as total_productos,
        AVG("precioVenta" - "precioCompra") as margen_promedio,
        AVG(CASE WHEN "precioVenta" > 0 THEN ("precioVenta" - "precioCompra") / "precioVenta" * 100 END) as margen_porcentaje
      FROM "Producto"
      WHERE "empresaId" = ${empresaId}
        AND estado = 'ACTIVO'
    `;

    const valor = valorInventario[0];
    console.log(`   💵 Valor total (precio venta): $${valor.valor_venta?.toFixed(2) || '0.00'}`);
    console.log(`   💰 Valor total (precio compra): $${valor.valor_compra?.toFixed(2) || '0.00'}`);
    console.log(`   📦 Productos activos: ${valor.total_productos || 0}`);
    console.log(`   📈 Margen promedio: $${valor.margen_promedio?.toFixed(2) || '0.00'}`);
    console.log(`   📊 Margen porcentual: ${valor.margen_porcentaje?.toFixed(1) || '0'}%`);

    // 8. Rotación de inventario (específica de restaurante)
    console.log('\n🔄 Rotación de Inventario (Restaurante):');
    console.log('=========================================');
    
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

    // 9. Productos más vendidos (específicos de mariscos)
    console.log('\n🏆 Productos Más Vendidos (Último Mes):');
    console.log('=======================================');
    
    const productosMasVendidos = await prisma.$queryRaw`
      SELECT 
        p.nombre,
        p."tipoProducto",
        COALESCE(SUM(m.cantidad), 0) as ventas,
        p.stock as stock_actual,
        p."precioVenta"
      FROM "Producto" p
      LEFT JOIN "MovimientoInventario" m ON p.id = m."productoId"
        AND m.tipo = 'SALIDA'
        AND m."createdAt" >= NOW() - INTERVAL '30 days'
      WHERE p."empresaId" = ${empresaId}
        AND p.estado = 'ACTIVO'
      GROUP BY p.id, p.nombre, p."tipoProducto", p.stock, p."precioVenta"
      ORDER BY ventas DESC
      LIMIT 8
    `;

    productosMasVendidos.forEach((producto, index) => {
      const icono = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅';
      console.log(`   ${icono} ${producto.nombre} (${producto.tipoProducto}): ${producto.ventas} vendidas - $${producto.precioVenta}`);
    });

    // 10. Análisis de frescura (productos con stock bajo vs alto)
    console.log('\n🌊 Análisis de Frescura:');
    console.log('========================');
    
    const productosFrescos = await prisma.producto.findMany({
      where: {
        empresaId,
        estado: 'ACTIVO',
        etiquetas: {
          has: 'fresco'
        }
      },
      select: {
        nombre: true,
        stock: true,
        stockMinimo: true,
        precioVenta: true
      },
      orderBy: {
        stock: 'asc'
      }
    });

    console.log(`   🐟 Productos frescos: ${productosFrescos.length}`);
    const productosFrescosBajo = productosFrescos.filter(p => p.stock <= p.stockMinimo);
    console.log(`   ⚠️  Productos frescos con stock bajo: ${productosFrescosBajo.length}`);
    
    productosFrescosBajo.forEach(producto => {
      const porcentaje = ((producto.stock / producto.stockMinimo) * 100).toFixed(1);
      console.log(`      🔴 ${producto.nombre}: ${producto.stock}/${producto.stockMinimo} (${porcentaje}%)`);
    });

    // 11. Verificación de datos para KPIs de alimentos
    console.log('\n✅ Verificación de Datos para KPIs de Alimentos:');
    console.log('================================================');
    
    const verificaciones = [
      {
        nombre: 'Productos de mariscos y pescados',
        condicion: totalProductos >= 15,
        descripcion: 'Variedad de productos marinos'
      },
      {
        nombre: 'Productos premium (alto valor)',
        condicion: productosPremium.length >= 5,
        descripcion: 'Productos de lujo para KPIs financieros'
      },
      {
        nombre: 'Productos frescos',
        condicion: productosFrescos.length >= 10,
        descripcion: 'Productos con etiqueta "fresco"'
      },
      {
        nombre: 'Movimientos frecuentes',
        condicion: totalMovimientos >= 200,
        descripcion: 'Alta rotación típica de restaurantes'
      },
      {
        nombre: 'Productos con stock bajo',
        condicion: productosStockBajo.length > 0,
        descripcion: 'Alertas de inventario'
      },
      {
        nombre: 'Proveedores especializados',
        condicion: totalProveedores >= 3,
        descripcion: 'Proveedores de mariscos'
      },
      {
        nombre: 'Pedidos activos',
        condicion: totalPedidos > 0,
        descripcion: 'Gestión de pedidos'
      }
    ];

    verificaciones.forEach(verificacion => {
      const icono = verificacion.condicion ? '✅' : '❌';
      console.log(`   ${icono} ${verificacion.nombre}: ${verificacion.descripcion}`);
    });

    console.log('\n🎯 Datos listos para probar KPIs específicos de la industria de alimentos!');
    console.log('🔗 Endpoints disponibles:');
    console.log('   - GET /dashboard-cqrs/kpis');
    console.log('   - GET /dashboard-cqrs/financial-kpis');
    console.log('   - GET /dashboard-cqrs/industry-kpis?industry=ALIMENTOS');
    console.log('   - GET /dashboard-cqrs/predictive-kpis');
    console.log('   - GET /dashboard-cqrs/data (todos los KPIs)');

  } catch (error) {
    console.error('❌ Error verificando datos de alimentos:', error);
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