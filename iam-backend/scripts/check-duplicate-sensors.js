const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDuplicateSensors() {
  try {
    console.log('🔍 Buscando sensores duplicados...');
    
    // Buscar sensores duplicados por nombre y ubicación
    const duplicates = await prisma.$queryRaw`
      SELECT 
        nombre, 
        "ubicacionId", 
        COUNT(*) as count,
        ARRAY_AGG(id) as sensor_ids
      FROM "Sensor" 
      GROUP BY nombre, "ubicacionId" 
      HAVING COUNT(*) > 1
      ORDER BY count DESC
    `;
    
    if (duplicates.length === 0) {
      console.log('✅ No se encontraron sensores duplicados');
      return;
    }
    
    console.log(`⚠️  Encontrados ${duplicates.length} grupos de sensores duplicados:`);
    
    for (const duplicate of duplicates) {
      console.log(`\n📍 Nombre: "${duplicate.nombre}", UbicacionId: ${duplicate.ubicacionId}`);
      console.log(`   🔢 Cantidad: ${duplicate.count}`);
      console.log(`   🆔 IDs: [${duplicate.sensor_ids.join(', ')}]`);
      
      // Obtener detalles de cada sensor duplicado
      const sensores = await prisma.sensor.findMany({
        where: {
          id: {
            in: duplicate.sensor_ids.map(id => Number(id))
          }
        },
        include: {
          ubicacion: {
            select: { nombre: true }
          },
          _count: {
            select: { lecturas: true }
          }
        }
      });
      
      sensores.forEach((sensor, index) => {
        console.log(`     Sensor ${index + 1}:`);
        console.log(`       ID: ${sensor.id}`);
        console.log(`       Tipo: ${sensor.tipo}`);
        console.log(`       Activo: ${sensor.activo}`);
        console.log(`       Ubicación: ${sensor.ubicacion.nombre}`);
        console.log(`       Lecturas: ${sensor._count.lecturas}`);
        console.log(`       Creado: ${sensor.createdAt.toLocaleString()}`);
      });
    }
    
    console.log('\n💡 Sugerencias para resolver:');
    console.log('1. Eliminar sensores duplicados más antiguos');
    console.log('2. Renombrar sensores duplicados');
    console.log('3. Mover lecturas del sensor a eliminar al sensor a mantener');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar
if (require.main === module) {
  checkDuplicateSensors()
    .then(() => {
      console.log('\n✅ Verificación completada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error ejecutando verificación:', error);
      process.exit(1);
    });
}

module.exports = { checkDuplicateSensors };
