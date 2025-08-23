const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function forzarActualizacionSMS() {
  try {
    console.log('🔧 Forzando actualización de configuración SMS...');
    
    // Primero verificar qué hay en la base de datos
    const configActual = await prisma.configuracionAlerta.findFirst({
      where: { sensorId: 1 }
    });
    
    console.log('📋 Configuración actual:', JSON.stringify(configActual.configuracionNotificacion, null, 2));
    
    // Forzar actualización completa
    const resultado = await prisma.configuracionAlerta.update({
      where: { id: 5 }, // ID específico que vimos en el debug
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
    
    // Verificar que se guardó
    const configVerificada = await prisma.configuracionAlerta.findFirst({
      where: { sensorId: 1 }
    });
    
    console.log('🔍 Verificación final:', JSON.stringify(configVerificada.configuracionNotificacion, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

forzarActualizacionSMS();
