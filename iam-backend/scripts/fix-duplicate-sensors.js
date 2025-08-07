const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixDuplicateSensors() {
  try {
    console.log('🔧 Eliminando sensores duplicados...');
    
    // Eliminar el sensor más antiguo (ID: 1) que no tiene lecturas
    const sensorToDelete = await prisma.sensor.findUnique({
      where: { id: 1 },
      include: {
        _count: {
          select: { lecturas: true }
        }
      }
    });
    
    if (!sensorToDelete) {
      console.log('✅ El sensor con ID 1 ya no existe');
      return;
    }
    
    console.log(`📍 Sensor a eliminar:`);
    console.log(`   ID: ${sensorToDelete.id}`);
    console.log(`   Nombre: ${sensorToDelete.nombre}`);
    console.log(`   Tipo: ${sensorToDelete.tipo}`);
    console.log(`   Activo: ${sensorToDelete.activo}`);
    console.log(`   Lecturas: ${sensorToDelete._count.lecturas}`);
    
    if (sensorToDelete._count.lecturas > 0) {
      console.log('⚠️  Este sensor tiene lecturas. Abortando eliminación por seguridad.');
      return;
    }
    
    // Eliminar el sensor duplicado más antiguo
    await prisma.sensor.delete({
      where: { id: 1 }
    });
    
    console.log('✅ Sensor duplicado eliminado exitosamente');
    
    // Verificar que ya no hay duplicados
    const remainingDuplicates = await prisma.$queryRaw`
      SELECT 
        nombre, 
        "ubicacionId", 
        COUNT(*) as count
      FROM "Sensor" 
      GROUP BY nombre, "ubicacionId" 
      HAVING COUNT(*) > 1
    `;
    
    if (remainingDuplicates.length === 0) {
      console.log('✅ Ya no hay sensores duplicados');
    } else {
      console.log(`⚠️  Aún quedan ${remainingDuplicates.length} grupos duplicados`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar
if (require.main === module) {
  fixDuplicateSensors()
    .then(() => {
      console.log('\n✅ Corrección completada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error ejecutando corrección:', error);
      process.exit(1);
    });
}

module.exports = { fixDuplicateSensors };
