const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function corregirConfiguracionIoT() {
  try {
    console.log('🔧 Corrigiendo configuración de dispositivos IoT...\n');

    // Obtener todos los dispositivos IoT
    const dispositivos = await prisma.dispositivoIoT.findMany({
      where: {
        activo: true,
        tipo: 'ESP32'
      }
    });

    console.log(`📊 Encontrados ${dispositivos.length} dispositivos IoT activos\n`);

    let corregidos = 0;
    let errores = 0;

    for (const dispositivo of dispositivos) {
      try {
        console.log(`🔧 Procesando: ${dispositivo.deviceName} (${dispositivo.deviceId})`);
        
        // Verificar si necesita corrección
        const necesitaCorreccion = 
          !dispositivo.apiBaseUrl ||
          /(^https?:\/\/)?(localhost|127\.0\.0\.1)/i.test(dispositivo.apiBaseUrl) ||
          dispositivo.apiEndpoint === '/sensores/lecturas-multiples';

        if (necesitaCorreccion) {
          console.log(`  ❌ Configuración incorrecta detectada:`);
          console.log(`     API Base URL: ${dispositivo.apiBaseUrl}`);
          console.log(`     API Endpoint: ${dispositivo.apiEndpoint}`);
          
          // Corregir configuración
          const baseUrl = process.env.EXTERNAL_API_BASE_URL || process.env.BACKEND_PUBLIC_URL || 'http://192.168.0.12:3001';
          await prisma.dispositivoIoT.update({
            where: { id: dispositivo.id },
            data: {
              apiBaseUrl: baseUrl,
              apiEndpoint: '/iot/lecturas'
            }
          });
          
          console.log(`  ✅ Configuración corregida:`);
          console.log(`     API Base URL: ${baseUrl}`);
          console.log(`     API Endpoint: /iot/lecturas`);
          corregidos++;
        } else {
          console.log(`  ✅ Configuración ya correcta`);
        }
        
      } catch (error) {
        console.log(`  ❌ Error corrigiendo dispositivo: ${error.message}`);
        errores++;
      }
      
      console.log(''); // Línea en blanco para separar
    }

    console.log('📊 Resumen de correcciones:');
    console.log(`  ✅ Dispositivos corregidos: ${corregidos}`);
    console.log(`  ❌ Errores: ${errores}`);
    console.log(`  📊 Total procesados: ${dispositivos.length}`);

  } catch (error) {
    console.error('❌ Error general:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar corrección
corregirConfiguracionIoT();

