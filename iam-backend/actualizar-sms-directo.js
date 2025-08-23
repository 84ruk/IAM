const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function actualizarSMSDirecto() {
  try {
    console.log('🔧 Actualizando SMS directamente en la base de datos...');
    
    // Actualizar usando el ID exacto
    const resultado = await prisma.configuracionAlerta.update({
      where: { id: 5 },
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
    
    // Verificar inmediatamente
    const configVerificada = await prisma.configuracionAlerta.findFirst({
      where: { id: 5 }
    });
    
    console.log('🔍 Verificación inmediata:', JSON.stringify(configVerificada.configuracionNotificacion, null, 2));
    
    if (configVerificada.configuracionNotificacion.sms === true) {
      console.log('✅ SMS habilitado correctamente');
    } else {
      console.log('❌ SMS NO se habilitó');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

actualizarSMSDirecto();
