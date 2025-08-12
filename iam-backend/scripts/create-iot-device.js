const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createIoTDevice() {
  try {
    console.log('🔧 Creando dispositivo IoT de prueba...\n');

    // Crear dispositivo IoT
    const dispositivo = await prisma.dispositivoIoT.create({
      data: {
        deviceId: 'ESP32_TEST_001',
        deviceName: 'ESP32 Sensor Test',
        nombre: 'ESP32 Sensor Test', // Campo requerido
        tipo: 'ESP32',
        ubicacionId: 2,
        empresaId: 2,
        apiToken: 'test_token_123',
        activo: true,
        configuracion: {
          intervaloLectura: 5000,
          sensores: ['TEMPERATURA', 'HUMEDAD']
        },
        sensoresConfigurados: ['TEMPERATURA', 'HUMEDAD'],
        intervaloLecturas: 5000
      }
    });

    console.log('✅ Dispositivo IoT creado:', {
      id: dispositivo.id,
      deviceId: dispositivo.deviceId,
      deviceName: dispositivo.deviceName,
      ubicacionId: dispositivo.ubicacionId,
      empresaId: dispositivo.empresaId,
      activo: dispositivo.activo
    });

    return dispositivo;

  } catch (error) {
    if (error.code === 'P2002') {
      console.log('⚠️ El dispositivo ya existe, actualizando...');
      
      const dispositivo = await prisma.dispositivoIoT.update({
        where: { deviceId: 'ESP32_TEST_001' },
        data: {
          activo: true,
          apiToken: 'test_token_123',
          ultimaConexion: new Date()
        }
      });

      console.log('✅ Dispositivo IoT actualizado:', {
        id: dispositivo.id,
        deviceId: dispositivo.deviceId,
        activo: dispositivo.activo
      });

      return dispositivo;
    } else {
      console.error('❌ Error creando dispositivo IoT:', error);
      throw error;
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar script
createIoTDevice();
