const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function limpiarMovimientosInvalidos() {
  try {
    console.log('🧹 Limpiando movimientos con productoId inválidos...\n');

    // Obtener movimientos con productoId que no existen
    const movimientosInvalidos = await prisma.movimientoInventario.findMany({
      where: {
        empresaId: 14,
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

    console.log(`📊 Total de movimientos encontrados: ${movimientosInvalidos.length}\n`);

    let movimientosAEliminar = [];
    let movimientosValidos = 0;

    for (const movimiento of movimientosInvalidos) {
      // Verificar si el producto existe
      const productoExiste = await prisma.producto.findUnique({
        where: {
          id: parseInt(movimiento.productoId),
          empresaId: 14,
          estado: 'ACTIVO',
        },
        select: {
          id: true,
          nombre: true,
        },
      });

      if (productoExiste) {
        movimientosValidos++;
        console.log(`✅ Movimiento ${movimiento.id} - ProductoID ${movimiento.productoId} válido: ${productoExiste.nombre}`);
      } else {
        movimientosAEliminar.push(movimiento);
        console.log(`❌ Movimiento ${movimiento.id} - ProductoID ${movimiento.productoId} inválido`);
      }
    }

    console.log(`\n📊 Resumen:`);
    console.log(`   - Movimientos válidos: ${movimientosValidos}`);
    console.log(`   - Movimientos a eliminar: ${movimientosAEliminar.length}`);

    if (movimientosAEliminar.length > 0) {
      console.log(`\n🗑️ Eliminando ${movimientosAEliminar.length} movimientos inválidos...`);
      
      for (const movimiento of movimientosAEliminar) {
        try {
          await prisma.movimientoInventario.delete({
            where: {
              id: movimiento.id,
            },
          });
          console.log(`   ✅ Eliminado movimiento ${movimiento.id}`);
        } catch (error) {
          console.log(`   ❌ Error eliminando movimiento ${movimiento.id}: ${error.message}`);
        }
      }
      
      console.log(`\n🎉 Limpieza completada. ${movimientosAEliminar.length} movimientos eliminados.`);
    } else {
      console.log(`\n✅ No hay movimientos inválidos para eliminar.`);
    }

  } catch (error) {
    console.error('❌ Error limpiando movimientos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la limpieza
limpiarMovimientosInvalidos(); 