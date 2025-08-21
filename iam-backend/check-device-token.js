const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDeviceToken(deviceId) {
  try {
    console.log(`🔍 Consultando token para dispositivo: ${deviceId}`);
    
    const device = await prisma.dispositivoIoT.findFirst({
      where: { deviceId },
      select: {
        deviceId: true,
        deviceName: true,
        empresaId: true,
        ubicacionId: true,
        activo: true,
        apiToken: true
      }
    });
    
    if (device) {
      console.log('📱 Dispositivo encontrado:');
      console.log(`  - Device ID: ${device.deviceId}`);
      console.log(`  - Nombre: ${device.deviceName}`);
      console.log(`  - Empresa: ${device.empresaId}`);
      console.log(`  - Ubicación: ${device.ubicacionId}`);
      console.log(`  - Activo: ${device.activo}`);
      console.log(`  - API Token: ${device.apiToken || 'No configurado'}`);
    } else {
      console.log('❌ Dispositivo no encontrado');
    }
    
  } catch (error) {
    console.error('❌ Error consultando dispositivo:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Usar el primer dispositivo de la lista anterior
checkDeviceToken('esp32_1755557097745_76ti2rgxm');
