const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function limpiarCacheCompleto() {
  try {
    console.log('🧹 Limpiando caché completo de alertas...');
    
    // Eliminar TODAS las alertas recientes del sensor 1
    const resultado = await prisma.alertaHistorial.deleteMany({
      where: {
        sensor: {
          id: 1
        }
      }
    });
    
    console.log(`✅ Eliminadas ${resultado.count} alertas del sensor 1`);
    console.log('🔄 Caché completamente limpio - se pueden generar nuevas alertas inmediatamente');
    
    // También verificar que no queden alertas
    const alertasRestantes = await prisma.alertaHistorial.count({
      where: {
        sensor: {
          id: 1
        }
      }
    });
    
    console.log(`📊 Alertas restantes en BD: ${alertasRestantes}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

limpiarCacheCompleto();
