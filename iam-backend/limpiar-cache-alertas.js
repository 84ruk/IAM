const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function limpiarCacheAlertas() {
  try {
    console.log('🧹 Limpiando caché de alertas para permitir nuevas alertas...');
    
    // Eliminar alertas recientes para que se puedan generar nuevas
    const resultado = await prisma.alertaHistorial.deleteMany({
      where: {
        sensor: {
          id: 1
        },
        fechaEnvio: {
          gte: new Date(Date.now() - 10 * 60 * 1000) // Últimos 10 minutos
        }
      }
    });
    
    console.log(`✅ Eliminadas ${resultado.count} alertas recientes`);
    console.log('🔄 Ahora se pueden generar nuevas alertas inmediatamente');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

limpiarCacheAlertas();
