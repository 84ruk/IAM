const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkIoTDevices() {
  try {
    console.log('🔍 Verificando dispositivos IoT registrados...\n');
    
    const dispositivos = await prisma.dispositivoIoT.findMany({
      select: {
        id: true,
        deviceId: true,
        deviceName: true,
        empresaId: true,
        apiToken: true,
        activo: true,
        createdAt: true,
        empresa: {
          select: {
            nombre: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (dispositivos.length === 0) {
      console.log('❌ No hay dispositivos IoT registrados');
      return;
    }

    console.log(`✅ Encontrados ${dispositivos.length} dispositivos IoT:\n`);
    
    dispositivos.forEach((device, index) => {
      console.log(`${index + 1}. ${device.deviceName} (${device.deviceId})`);
      console.log(`   Empresa: ${device.empresa?.nombre || 'N/A'} (ID: ${device.empresaId})`);
      console.log(`   Token: ${device.apiToken ? '✅ Configurado' : '❌ No configurado'}`);
      console.log(`   Estado: ${device.activo ? '🟢 Activo' : '🔴 Inactivo'}`);
      console.log(`   Creado: ${device.createdAt.toISOString()}`);
      console.log('');
    });

    // Mostrar ejemplo de uso
    if (dispositivos.length > 0) {
      const device = dispositivos[0];
      console.log('📋 Ejemplo de uso del endpoint IoT:');
      console.log(`curl -X POST http://localhost:3001/iot/lecturas \\`);
      console.log(`  -H "Content-Type: application/json" \\`);
      console.log(`  -d '{`);
      console.log(`    "deviceId": "${device.deviceId}",`);
      console.log(`    "deviceName": "${device.deviceName}",`);
      console.log(`    "ubicacionId": 2,`);
      console.log(`    "empresaId": ${device.empresaId},`);
      console.log(`    "apiToken": "${device.apiToken || 'TOKEN_AQUI'}",`);
      console.log(`    "timestamp": ${Date.now()},`);
      console.log(`    "sensors": {`);
      console.log(`      "Temperatura": 25.5`);
      console.log(`    }`);
      console.log(`  }'`);
    }

  } catch (error) {
    console.error('❌ Error verificando dispositivos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkIoTDevices();
