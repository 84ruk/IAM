const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function activateSensores() {
  try {
    console.log('🔍 Activando sensores inactivos...\n');

    // Obtener todos los sensores inactivos
    const sensoresInactivos = await prisma.sensor.findMany({
      where: {
        activo: false
      },
      include: {
        ubicacion: {
          select: {
            nombre: true,
            empresa: {
              select: {
                nombre: true
              }
            }
          }
        }
      }
    });

    console.log(`📡 Sensores inactivos encontrados: ${sensoresInactivos.length}`);

    if (sensoresInactivos.length === 0) {
      console.log('✅ Todos los sensores ya están activos');
      return;
    }

    // Mostrar sensores que se van a activar
    sensoresInactivos.forEach(sensor => {
      console.log(`  • ${sensor.nombre} (ID: ${sensor.id})`);
      console.log(`    - Tipo: ${sensor.tipo}`);
      console.log(`    - Ubicación: ${sensor.ubicacion?.nombre || 'Sin ubicación'}`);
      console.log(`    - Empresa: ${sensor.ubicacion?.empresa?.nombre || 'Sin empresa'}`);
    });

    // Activar todos los sensores
    const result = await prisma.sensor.updateMany({
      where: {
        activo: false
      },
      data: {
        activo: true
      }
    });

    console.log(`\n✅ ${result.count} sensores activados exitosamente`);

    // Verificar el resultado
    const sensoresActivos = await prisma.sensor.findMany({
      where: {
        activo: true
      },
      include: {
        ubicacion: {
          select: {
            nombre: true,
            empresa: {
              select: {
                nombre: true
              }
            }
          }
        }
      }
    });

    console.log('\n📡 Sensores activos después de la activación:');
    sensoresActivos.forEach(sensor => {
      console.log(`  • ${sensor.nombre} (ID: ${sensor.id})`);
      console.log(`    - Tipo: ${sensor.tipo}`);
      console.log(`    - Ubicación: ${sensor.ubicacion?.nombre || 'Sin ubicación'}`);
      console.log(`    - Empresa: ${sensor.ubicacion?.empresa?.nombre || 'Sin empresa'}`);
    });

  } catch (error) {
    console.error('❌ Error activando sensores:', error);
  } finally {
    await prisma.$disconnect();
  }
}

activateSensores();



