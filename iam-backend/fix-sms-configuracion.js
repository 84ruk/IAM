const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function habilitarSMS() {
  try {
    console.log('🔧 Habilitando SMS en configuración de alertas...');
    
    const resultado = await prisma.configuracionAlerta.update({
      where: { sensorId: 1 },
      data: {
        configuracionNotificacion: {
          sms: true,
          push: false,
          email: true,
          webSocket: true
        }
      }
    });
    
    console.log('✅ Configuración actualizada exitosamente');
    console.log('📋 Nueva configuración:', JSON.stringify(resultado.configuracionNotificacion, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

habilitarSMS();
