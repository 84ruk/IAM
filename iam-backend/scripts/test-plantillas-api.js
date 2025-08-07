const fs = require('fs');
const path = require('path');

async function testPlantillasAPI() {
  try {
    console.log('🧪 Probando API de plantillas...');
    
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NTQ1MjM4NjMsImp0aSI6ImE3ZDZkNzlhLTRmNGMtNDNhZS05ODA3LWM0YWMzOTMzMzU3ZSIsInN1YiI6IjEiLCJlbWFpbCI6ImJhcnVrMDY2QGdtYWlsLmNvbSIsInJvbCI6IkFETUlOIiwiZW1wcmVzYUlkIjoyLCJ0aXBvSW5kdXN0cmlhIjoiR0VORVJJQ0EiLCJhdXRoUHJvdmlkZXIiOiJnb29nbGUiLCJleHAiOjE3NTQ2MTAyNjMsImF1ZCI6Imh0dHA6Ly9sb2NhbGhvc3Q6MzAwMSIsImlzcyI6Imh0dHA6Ly9sb2NhbGhvc3Q6MzAwMSJ9.JItMTmjBWig28HcJuFglmHmR7hpSG4F2FPNKMP8yTS4';
    
    // Probar endpoint de tipos de plantillas
    console.log('\n📋 Obteniendo tipos de plantillas...');
    const tiposResponse = await fetch('http://localhost:3001/plantillas', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });
    
    if (!tiposResponse.ok) {
      throw new Error(`Error ${tiposResponse.status}: ${tiposResponse.statusText}`);
    }
    
    const tiposData = await tiposResponse.json();
    console.log('✅ Tipos obtenidos:', tiposData.data);
    
    // Probar cada tipo de plantilla
    const tipos = ['productos', 'proveedores', 'movimientos'];
    
    for (const tipo of tipos) {
      console.log(`\n🔍 Obteniendo info de plantilla: ${tipo}`);
      
      // Obtener información
      const infoResponse = await fetch(`http://localhost:3001/plantillas/${tipo}/info`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      if (infoResponse.ok) {
        const infoData = await infoResponse.json();
        console.log(`✅ Info de ${tipo}:`, {
          columnasRequeridas: infoData.data.columnasRequeridas.length,
          columnasOpcionales: infoData.data.columnasOpcionales.length
        });
      } else {
        console.log(`❌ Error obteniendo info de ${tipo}: ${infoResponse.status}`);
      }
      
      // Probar descarga (simulada)
      console.log(`📥 Probando descarga de plantilla: ${tipo}`);
      const descargaResponse = await fetch(`http://localhost:3001/plantillas/${tipo}/descargar`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      });
      
      if (descargaResponse.ok) {
        const contentLength = descargaResponse.headers.get('content-length');
        console.log(`✅ Plantilla ${tipo} generada exitosamente (${contentLength} bytes)`);
      } else {
        console.log(`❌ Error descargando ${tipo}: ${descargaResponse.status}`);
      }
    }
    
    console.log('\n🎉 Pruebas de API completadas!');
    return true;
    
  } catch (error) {
    console.error('❌ Error en las pruebas:', error.message);
    return false;
  }
}

// Función para verificar si el servidor está corriendo
async function checkServerHealth() {
  try {
    const response = await fetch('http://localhost:3001/plantillas', {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    
    // Si devuelve 401 (no autorizado), el servidor está corriendo
    return response.status === 401 || response.status === 200;
  } catch (error) {
    return false;
  }
}

// Ejecutar pruebas
if (require.main === module) {
  (async () => {
    console.log('🚀 Verificando estado del servidor...');
    
    const serverRunning = await checkServerHealth();
    if (!serverRunning) {
      console.log('❌ El servidor no está corriendo o el endpoint no está disponible');
      console.log('💡 Inicia el servidor con: npm run start:dev');
      process.exit(1);
    }
    
    console.log('✅ Servidor respondiendo, ejecutando pruebas...\n');
    
    const success = await testPlantillasAPI();
    process.exit(success ? 0 : 1);
  })();
}

module.exports = { testPlantillasAPI };
