const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrarMovimientosPrecios() {
  console.log('🚀 Iniciando migración de movimientos con precios...');
  
  try {
    // Obtener todos los movimientos que no tienen precios
    const movimientosSinPrecios = await prisma.movimientoInventario.findMany({
      where: {
        precioUnitario: null,
        estado: 'ACTIVO'
      },
      include: {
        producto: true
      }
    });

    console.log(`📊 Encontrados ${movimientosSinPrecios.length} movimientos sin precios`);

    if (movimientosSinPrecios.length === 0) {
      console.log('✅ No hay movimientos que migrar');
      return;
    }

    let actualizados = 0;
    let errores = 0;

    for (const movimiento of movimientosSinPrecios) {
      try {
        // Calcular precios basados en el tipo de movimiento
        let precioUnitario, tipoPrecio;

        if (movimiento.tipo === 'ENTRADA') {
          precioUnitario = movimiento.producto.precioCompra || 0;
          tipoPrecio = 'COMPRA';
        } else {
          precioUnitario = movimiento.producto.precioVenta || 0;
          tipoPrecio = 'VENTA';
        }

        const precioTotal = precioUnitario * movimiento.cantidad;

        // Actualizar el movimiento
        await prisma.movimientoInventario.update({
          where: { id: movimiento.id },
          data: {
            precioUnitario,
            precioTotal,
            tipoPrecio
          }
        });

        actualizados++;
        console.log(`✅ Movimiento ${movimiento.id} actualizado: ${movimiento.tipo} ${movimiento.cantidad} unidades - Precio: $${precioUnitario} - Total: $${precioTotal}`);

      } catch (error) {
        errores++;
        console.error(`❌ Error actualizando movimiento ${movimiento.id}:`, error.message);
      }
    }

    console.log('\n📈 Resumen de migración:');
    console.log(`✅ Movimientos actualizados: ${actualizados}`);
    console.log(`❌ Errores: ${errores}`);
    console.log(`📊 Total procesados: ${movimientosSinPrecios.length}`);

    if (errores === 0) {
      console.log('🎉 Migración completada exitosamente');
    } else {
      console.log('⚠️ Migración completada con errores');
    }

  } catch (error) {
    console.error('❌ Error en la migración:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la migración
migrarMovimientosPrecios()
  .then(() => {
    console.log('🏁 Script completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  }); 