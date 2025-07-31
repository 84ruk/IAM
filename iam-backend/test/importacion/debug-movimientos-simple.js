const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugMovimientosSimple() {
  try {
    console.log('🔍 Debuggeando movimientos recientes (sin include)...\n');

    // Obtener movimientos recientes sin include
    const movimientos = await prisma.movimientoInventario.findMany({
      where: {
        empresaId: 14,
      },
      select: {
        id: true,
        productoId: true,
        tipo: true,
        cantidad: true,
        motivo: true,
        descripcion: true,
        fecha: true,
        empresaId: true,
        createdAt: true,
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

    // Verificar si los productoId de los movimientos existen
    console.log('\n🔍 Verificando si los productoId existen...\n');
    
    for (const movimiento of movimientos) {
      const productoExiste = await prisma.producto.findUnique({
        where: {
          id: parseInt(movimiento.productoId),
        },
        select: {
          id: true,
          nombre: true,
        },
      });

      if (productoExiste) {
        console.log(`✅ ProductoID ${movimiento.productoId} existe: ${productoExiste.nombre}`);
      } else {
        console.log(`❌ ProductoID ${movimiento.productoId} NO existe`);
        
        // Si es un string, buscar por nombre
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
            },
          });

          if (productosSimilares.length > 0) {
            console.log(`   🔍 Productos similares encontrados:`);
            productosSimilares.forEach(producto => {
              console.log(`      - ID: ${producto.id} - Nombre: ${producto.nombre}`);
            });
          } else {
            console.log(`   ❌ No se encontraron productos similares`);
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
debugMovimientosSimple(); 