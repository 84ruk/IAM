const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkSensores() {
  try {
    console.log('🔍 Verificando sensores en la base de datos...\n');

    // Obtener todas las empresas
    const empresas = await prisma.empresa.findMany({
      select: {
        id: true,
        nombre: true,
        _count: {
          select: {
            sensores: true
          }
        }
      }
    });

    console.log('📊 Empresas encontradas:');
    empresas.forEach(empresa => {
      console.log(`  • ${empresa.nombre} (ID: ${empresa.id}) - ${empresa._count.sensores} sensores`);
    });

    // Obtener todos los sensores con detalles
    const sensores = await prisma.sensor.findMany({
      include: {
        ubicacion: {
          select: {
            id: true,
            nombre: true,
            empresa: {
              select: {
                id: true,
                nombre: true
              }
            }
          }
        },
        _count: {
          select: {
            lecturas: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('\n📡 Sensores encontrados:');
    if (sensores.length === 0) {
      console.log('  ❌ No hay sensores registrados en la base de datos');
    } else {
      sensores.forEach(sensor => {
        console.log(`  • ${sensor.nombre} (ID: ${sensor.id})`);
        console.log(`    - Tipo: ${sensor.tipo}`);
        console.log(`    - Activo: ${sensor.activo ? '✅' : '❌'}`);
        console.log(`    - Ubicación: ${sensor.ubicacion?.nombre || 'Sin ubicación'} (ID: ${sensor.ubicacionId})`);
        console.log(`    - Empresa: ${sensor.ubicacion?.empresa?.nombre || 'Sin empresa'} (ID: ${sensor.ubicacion?.empresa?.id})`);
        console.log(`    - Lecturas: ${sensor._count.lecturas}`);
        console.log(`    - Creado: ${sensor.createdAt.toISOString()}`);
        console.log('');
      });
    }

    // Obtener ubicaciones
    const ubicaciones = await prisma.ubicacion.findMany({
      include: {
        empresa: {
          select: {
            id: true,
            nombre: true
          }
        },
        _count: {
          select: {
            sensores: true
          }
        }
      }
    });

    console.log('📍 Ubicaciones:');
    ubicaciones.forEach(ubicacion => {
      console.log(`  • ${ubicacion.nombre} (ID: ${ubicacion.id})`);
      console.log(`    - Empresa: ${ubicacion.empresa?.nombre || 'Sin empresa'} (ID: ${ubicacion.empresaId})`);
      console.log(`    - Activa: ${ubicacion.activa ? '✅' : '❌'}`);
      console.log(`    - Sensores: ${ubicacion._count.sensores}`);
      console.log('');
    });

    // Verificar dispositivos IoT
    const dispositivos = await prisma.dispositivoIoT.findMany({
      include: {
        ubicacion: {
          select: {
            id: true,
            nombre: true,
            empresa: {
              select: {
                id: true,
                nombre: true
              }
            }
          }
        },
        _count: {
          select: {
            sensores: true
          }
        }
      }
    });

    console.log('🤖 Dispositivos IoT:');
    if (dispositivos.length === 0) {
      console.log('  ❌ No hay dispositivos IoT registrados');
    } else {
      dispositivos.forEach(dispositivo => {
        console.log(`  • ${dispositivo.nombre} (ID: ${dispositivo.id})`);
        console.log(`    - Tipo: ${dispositivo.tipo}`);
        console.log(`    - Device ID: ${dispositivo.deviceId}`);
        console.log(`    - Ubicación: ${dispositivo.ubicacion?.nombre || 'Sin ubicación'}`);
        console.log(`    - Empresa: ${dispositivo.ubicacion?.empresa?.nombre || 'Sin empresa'}`);
        console.log(`    - Sensores: ${dispositivo._count.sensores}`);
        console.log(`    - Última actualización: ${dispositivo.ultimaActualizacion?.toISOString() || 'Nunca'}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Error verificando sensores:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSensores();



