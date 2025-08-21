const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDevices() {
  try {
    console.log('🔍 Consultando dispositivos IoT...');
    
    const devices = await prisma.dispositivoIoT.findMany({
      where: { activo: true },
      select: {
        deviceId: true,
        deviceName: true,
        empresaId: true,
        ubicacionId: true,
        activo: true,
        apiToken: true
      },
      take: 5
    });
    
    console.log('📱 Dispositivos encontrados:', devices.length);
    devices.forEach(device => {
      console.log(`  - ${device.deviceId}: ${device.deviceName} (Empresa: ${device.empresaId}, Ubicación: ${device.ubicacionId})`);
    });
    
    if (devices.length === 0) {
      console.log('❌ No hay dispositivos IoT configurados');
    }
    
  } catch (error) {
    console.error('❌ Error consultando dispositivos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDevices();
