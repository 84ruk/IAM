const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();

async function regenerarCodigoArduino() {
  try {
    console.log('🔧 Regenerando código Arduino con configuración corregida...\n');

    // Obtener todos los dispositivos IoT activos
    const dispositivos = await prisma.dispositivoIoT.findMany({
      where: {
        activo: true,
        tipo: 'ESP32'
      }
    });

    console.log(`📊 Encontrados ${dispositivos.length} dispositivos IoT activos\n`);

    let regenerados = 0;
    let errores = 0;

    for (const dispositivo of dispositivos) {
      try {
        console.log(`🔧 Procesando: ${dispositivo.deviceName} (${dispositivo.deviceId})`);
        
        // Verificar que la configuración esté corregida
        if (dispositivo.apiBaseUrl === 'http://192.168.0.12:3001' && 
            dispositivo.apiEndpoint === '/iot/lecturas') {
          
          console.log(`  ✅ Configuración ya corregida`);
          
          // Crear configuración para regenerar código
          const config = {
            deviceId: dispositivo.deviceId,
            deviceName: dispositivo.deviceName,
            ubicacionId: dispositivo.ubicacionId,
            empresaId: dispositivo.empresaId,
            wifi: {
              ssid: dispositivo.wifiSSID,
              password: dispositivo.wifiPassword
            },
            api: {
              baseUrl: dispositivo.apiBaseUrl,
              token: dispositivo.apiToken,
              endpoint: dispositivo.apiEndpoint
            },
            sensores: dispositivo.sensoresConfigurados,
            intervalo: dispositivo.intervaloLecturas
          };

          console.log(`  🔄 Regenerando código Arduino...`);
          
          // Llamar al endpoint para regenerar código
          const response = await axios.post('http://localhost:3001/sensores/generar-codigo-arduino', config, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE' // Necesitarás un token válido
            }
          });

          if (response.data.success) {
            console.log(`  ✅ Código regenerado exitosamente`);
            
            // Guardar el código en un archivo
            const fs = require('fs');
            const fileName = `esp32-${dispositivo.deviceId}-corregido.ino`;
            fs.writeFileSync(fileName, response.data.codigoArduino);
            console.log(`  💾 Código guardado en: ${fileName}`);
            
            regenerados++;
          } else {
            console.log(`  ❌ Error regenerando código: ${response.data.message}`);
            errores++;
          }
          
        } else {
          console.log(`  ❌ Configuración no corregida, saltando...`);
          console.log(`     API Base URL: ${dispositivo.apiBaseUrl}`);
          console.log(`     API Endpoint: ${dispositivo.apiEndpoint}`);
        }
        
      } catch (error) {
        console.log(`  ❌ Error procesando dispositivo: ${error.message}`);
        errores++;
      }
      
      console.log(''); // Línea en blanco para separar
    }

    console.log('📊 Resumen de regeneración:');
    console.log(`  ✅ Códigos regenerados: ${regenerados}`);
    console.log(`  ❌ Errores: ${errores}`);
    console.log(`  📊 Total procesados: ${dispositivos.length}`);

    if (regenerados > 0) {
      console.log('\n📝 Instrucciones:');
      console.log('1. Los archivos .ino se han guardado en el directorio actual');
      console.log('2. Sube cada archivo a su ESP32 correspondiente');
      console.log('3. El ESP32 ahora debería funcionar correctamente');
    }

  } catch (error) {
    console.error('❌ Error general:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar regeneración
regenerarCodigoArduino();

