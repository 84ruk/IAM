const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugMovimientos() {
  try {
    console.log('🔍 Debuggeando movimientos recientes...\n');

    // Obtener movimientos recientes
    const movimientos = await prisma.movimientoInventario.findMany({
      where: {
        empresaId: 14, // Usar el empresaId de los logs
      },
      include: {
        producto: {
          select: {
            id: true,
            nombre: true,
            estado: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    console.log(`📊 Total de movimientos encontrados: ${movimientos.length}\n`);

    movimientos.forEach((movimiento, index) => {
      console.log(`--- Movimiento ${index + 1} ---`);
      console.log(`ID: ${movimiento.id}`);
      console.log(`ProductoID: ${movimiento.productoId} (tipo: ${typeof movimiento.productoId})`);
      console.log(`Tipo: ${movimiento.tipo}`);
      console.log(`Cantidad: ${movimiento.cantidad}`);
      console.log(`Motivo: ${movimiento.motivo}`);
      console.log(`Descripción: ${movimiento.descripcion}`);
      console.log(`Fecha: ${movimiento.fecha}`);
      console.log(`EmpresaID: ${movimiento.empresaId}`);
      console.log(`Creado: ${movimiento.createdAt}`);
      
      if (movimiento.producto) {
        console.log(`✅ Producto encontrado: ${movimiento.producto.nombre} (ID: ${movimiento.producto.id})`);
      } else {
        console.log(`❌ Producto NO encontrado para productoId: ${movimiento.productoId}`);
      }
      console.log('');
    });

    // Verificar productos existentes
    console.log('🔍 Verificando productos existentes...\n');
    
    const productos = await prisma.producto.findMany({
      where: {
        empresaId: 14,
        estado: 'ACTIVO',
      },
      select: {
        id: true,
        nombre: true,
        estado: true,
      },
      take: 10,
    });

    console.log(`📦 Productos activos encontrados: ${productos.length}\n`);
    productos.forEach((producto, index) => {
      console.log(`${index + 1}. ID: ${producto.id} - Nombre: ${producto.nombre} - Estado: ${producto.estado}`);
    });

    // Verificar si hay movimientos con productoId que no existen
    console.log('\n🔍 Verificando movimientos con productoId inválidos...\n');
    
    const movimientosInvalidos = await prisma.movimientoInventario.findMany({
      where: {
        empresaId: 14,
        producto: null, // Movimientos sin producto asociado
      },
      select: {
        id: true,
        productoId: true,
        tipo: true,
        cantidad: true,
        motivo: true,
        createdAt: true,
      },
    });

    console.log(`❌ Movimientos con productoId inválidos: ${movimientosInvalidos.length}\n`);
    
    if (movimientosInvalidos.length > 0) {
      movimientosInvalidos.forEach((movimiento, index) => {
        console.log(`${index + 1}. ID: ${movimiento.id} - ProductoID: ${movimiento.productoId} - Tipo: ${movimiento.tipo} - Cantidad: ${movimiento.cantidad} - Creado: ${movimiento.createdAt}`);
      });
    }

    // Verificar si hay productos con nombres similares a los productoId de los movimientos
    if (movimientosInvalidos.length > 0) {
      console.log('\n🔍 Buscando productos por nombre...\n');
      
      for (const movimiento of movimientosInvalidos) {
        if (typeof movimiento.productoId === 'string') {
          const productosSimilares = await prisma.producto.findMany({
            where: {
              empresaId: 14,
              nombre: {
                contains: movimiento.productoId,
                mode: 'insensitive',
              },
            },
            select: {
              id: true,
              nombre: true,
              estado: true,
            },
          });

          if (productosSimilares.length > 0) {
            console.log(`✅ Productos similares encontrados para "${movimiento.productoId}":`);
            productosSimilares.forEach(producto => {
              console.log(`   - ID: ${producto.id} - Nombre: ${producto.nombre} - Estado: ${producto.estado}`);
            });
          } else {
            console.log(`❌ No se encontraron productos similares para "${movimiento.productoId}"`);
          }
        }
      }
    }

  } catch (error) {
    console.error('❌ Error debuggeando movimientos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el debug
debugMovimientos(); 