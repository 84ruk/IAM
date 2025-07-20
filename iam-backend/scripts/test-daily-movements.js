const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDailyMovements() {
  console.log('🧪 Probando consulta de movimientos diarios...\n');

  try {
    const empresaId = 8; // ID de la empresa del usuario prueba@iam.com
    const days = 7;
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - days);

    console.log(`📅 Fecha límite: ${fechaLimite.toISOString()}`);
    console.log(`🏢 Empresa ID: ${empresaId}`);
    console.log(`📊 Días: ${days}\n`);

    // 1. Verificar movimientos totales
    const totalMovimientos = await prisma.movimientoInventario.count({
      where: {
        empresaId: empresaId,
        estado: 'ACTIVO'
      }
    });

    console.log(`📈 Total movimientos en la empresa: ${totalMovimientos}`);

    // 2. Verificar movimientos en el rango de fechas
    const movimientosEnRango = await prisma.movimientoInventario.count({
      where: {
        empresaId: empresaId,
        fecha: {
          gte: fechaLimite
        },
        estado: 'ACTIVO'
      }
    });

    console.log(`📅 Movimientos en los últimos ${days} días: ${movimientosEnRango}`);

    // 3. Verificar algunos movimientos específicos
    const movimientosRecientes = await prisma.movimientoInventario.findMany({
      where: {
        empresaId: empresaId,
        fecha: {
          gte: fechaLimite
        },
        estado: 'ACTIVO'
      },
      select: {
        id: true,
        fecha: true,
        tipo: true,
        cantidad: true,
        producto: {
          select: {
            nombre: true,
            precioVenta: true
          }
        }
      },
      orderBy: {
        fecha: 'desc'
      },
      take: 5
    });

    console.log('\n📋 Últimos 5 movimientos:');
    movimientosRecientes.forEach(mov => {
      console.log(`- ID: ${mov.id}, Fecha: ${mov.fecha.toISOString()}, Tipo: ${mov.tipo}, Cantidad: ${mov.cantidad}, Producto: ${mov.producto.nombre}`);
    });

    // 4. Probar la consulta SQL directamente
    console.log('\n🔍 Probando consulta SQL...');
    const resultadoSQL = await prisma.$queryRaw`
      SELECT 
        DATE(m.fecha) as fecha,
        m.tipo,
        SUM(m.cantidad) as cantidad,
        SUM(m.cantidad * p."precioVenta") as valor
      FROM "MovimientoInventario" m
      INNER JOIN "Producto" p ON m."productoId" = p.id
      WHERE m."empresaId" = ${empresaId}
        AND m.fecha >= ${fechaLimite}
        AND m.estado = 'ACTIVO'
        AND p.estado = 'ACTIVO'
      GROUP BY DATE(m.fecha), m.tipo
      ORDER BY fecha ASC
    `;

    console.log('\n📊 Resultado de la consulta SQL:');
    console.log(JSON.stringify(resultadoSQL, (key, value) =>
      typeof value === 'bigint' ? Number(value) : value
    , 2));

    // 5. Verificar si hay productos con precioVenta
    const productosConPrecio = await prisma.producto.count({
      where: {
        empresaId: empresaId,
        estado: 'ACTIVO',
        precioVenta: {
          not: null
        }
      }
    });

    console.log(`\n💰 Productos con precio de venta: ${productosConPrecio}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testDailyMovements();
}

module.exports = { testDailyMovements }; 