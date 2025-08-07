const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function diagnosticoKPIs() {
  console.log('🔍 DIAGNÓSTICO DE KPIs');
  console.log('========================\n');

  try {
    // 1. Verificar empresas
    console.log('1. Verificando empresas...');
    const empresas = await prisma.empresa.findMany({
      select: {
        id: true,
        nombre: true,
        TipoIndustria: true,
        _count: {
          select: {
            productos: true,
            movimientos: true,
            usuarios: true
          }
        }
      }
    });

    console.log(`   Total empresas: ${empresas.length}`);
    empresas.forEach(emp => {
      console.log(`   - Empresa ${emp.id}: ${emp.nombre} (${emp.TipoIndustria})`);
      console.log(`     Productos: ${emp._count.productos}, Movimientos: ${emp._count.movimientos}, Usuarios: ${emp._count.usuarios}`);
    });

    if (empresas.length === 0) {
      console.log('   ❌ No hay empresas en la base de datos');
      return;
    }

    // 2. Verificar productos
    console.log('\n2. Verificando productos...');
    const productos = await prisma.producto.findMany({
      select: {
        id: true,
        nombre: true,
        stock: true,
        precioCompra: true,
        precioVenta: true,
        stockMinimo: true,
        estado: true,
        empresaId: true
      }
    });

    console.log(`   Total productos: ${productos.length}`);
    
    const productosActivos = productos.filter(p => p.estado === 'ACTIVO');
    console.log(`   Productos activos: ${productosActivos.length}`);
    
    const productosStockBajo = productosActivos.filter(p => p.stock <= p.stockMinimo);
    console.log(`   Productos con stock bajo: ${productosStockBajo.length}`);

    // 3. Verificar movimientos
    console.log('\n3. Verificando movimientos...');
    const movimientos = await prisma.movimientoInventario.findMany({
      select: {
        id: true,
        cantidad: true,
        tipo: true,
        fecha: true,
        empresaId: true,
        productoId: true
      },
      orderBy: {
        fecha: 'desc'
      },
      take: 10
    });

    console.log(`   Total movimientos: ${movimientos.length}`);
    console.log(`   Últimos 10 movimientos:`);
    movimientos.forEach(mov => {
      console.log(`   - ${mov.fecha}: ${mov.tipo} ${mov.cantidad} (Empresa: ${mov.empresaId}, Producto: ${mov.productoId})`);
    });

    // 4. Calcular KPIs manualmente
    console.log('\n4. Calculando KPIs manualmente...');
    
    // Para la primera empresa
    const primeraEmpresa = empresas[0];
    const empresaId = primeraEmpresa.id;
    
    console.log(`   Calculando para empresa: ${primeraEmpresa.nombre} (ID: ${empresaId})`);

    // Total productos
    const totalProductos = await prisma.producto.count({
      where: { 
        empresaId, 
        estado: { in: ['ACTIVO', 'INACTIVO'] }
      }
    });
    console.log(`   Total productos: ${totalProductos}`);

    // Productos con stock bajo
    const productosStockBajoCount = await prisma.producto.count({
      where: {
        empresaId,
        estado: 'ACTIVO',
        stock: {
          lte: prisma.producto.fields.stockMinimo
        }
      }
    });
    console.log(`   Productos con stock bajo: ${productosStockBajoCount}`);

    // Movimientos del último mes
    const fechaLimite = new Date();
    fechaLimite.setMonth(fechaLimite.getMonth() - 1);
    
    const movimientosUltimoMes = await prisma.movimientoInventario.count({
      where: {
        empresaId,
        createdAt: {
          gte: fechaLimite
        }
      }
    });
    console.log(`   Movimientos último mes: ${movimientosUltimoMes}`);

    // Valor total inventario
    const valorInventario = await prisma.$queryRaw`
      SELECT COALESCE(SUM(p.stock * p."precioVenta"), 0) as total
      FROM "Producto" p
      WHERE p."empresaId" = ${empresaId}
        AND p.estado = 'ACTIVO'
    `;
    console.log(`   Valor total inventario: $${Number(valorInventario[0]?.total || 0).toFixed(2)}`);

    // Margen promedio
    const margenPromedio = await prisma.$queryRaw`
      SELECT COALESCE(AVG(p."precioVenta" - p."precioCompra"), 0) as margen
      FROM "Producto" p
      WHERE p."empresaId" = ${empresaId}
        AND p.estado = 'ACTIVO'
        AND p."precioCompra" > 0
    `;
    console.log(`   Margen promedio: $${Number(margenPromedio[0]?.margen || 0).toFixed(2)}`);

    // Rotación inventario
    const rotacionInventario = await prisma.$queryRaw`
      WITH movimientos_salida AS (
        SELECT 
          p.id,
          p.stock,
          COALESCE(SUM(m.cantidad), 0) as ventas_mes
        FROM "Producto" p
        LEFT JOIN "MovimientoInventario" m ON p.id = m."productoId"
          AND m.tipo = 'SALIDA'
          AND m."createdAt" >= NOW() - INTERVAL '30 days'
        WHERE p."empresaId" = ${empresaId}
          AND p.estado = 'ACTIVO'
        GROUP BY p.id, p.stock
      )
      SELECT COALESCE(AVG(
        CASE 
          WHEN stock > 0 THEN ventas_mes / stock
          ELSE 0
        END
      ), 0) as rotacion
      FROM movimientos_salida
    `;
    console.log(`   Rotación inventario: ${Number(rotacionInventario[0]?.rotacion || 0).toFixed(4)}`);

    // 5. Verificar usuarios
    console.log('\n5. Verificando usuarios...');
    const usuarios = await prisma.usuario.findMany({
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        empresaId: true,
        activo: true
      }
    });

    console.log(`   Total usuarios: ${usuarios.length}`);
    usuarios.forEach(user => {
      console.log(`   - ${user.nombre} (${user.email}) - Rol: ${user.rol} - Empresa: ${user.empresaId} - Activo: ${user.activo}`);
    });

    console.log('\n✅ Diagnóstico completado');

  } catch (error) {
    console.error('❌ Error en diagnóstico:', error);
  } finally {
    await prisma.$disconnect();
  }
}

diagnosticoKPIs(); 