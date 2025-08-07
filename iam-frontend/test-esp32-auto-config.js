const fetch = require('node-fetch');

async function testESP32AutoConfig() {
  console.log('🧪 Probando configuración automática ESP32...\n');

  const testConfig = {
    deviceName: "ESP32_Test_Device",
    wifiSSID: "MiWiFi",
    wifiPassword: "miContraseña123",
    ubicacionId: 1,
    sensores: [
      {
        tipo: "TEMPERATURA",
        nombre: "Sensor Temperatura Test",
        pin: 4,
        enabled: true
      },
      {
        tipo: "HUMEDAD",
        nombre: "Sensor Humedad Test",
        pin: 4,
        enabled: true
      }
    ]
  };

  console.log('📤 Enviando configuración de prueba:');
  console.log(JSON.stringify(testConfig, null, 2));
  console.log('\n');

  try {
    // Probar directamente el backend
    console.log('🔗 Probando conexión directa al backend (puerto 3001)...');
    const backendResponse = await fetch('http://localhost:3001/mqtt-sensor/esp32/configuracion-automatica', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testConfig),
    });

    const backendData = await backendResponse.json();
    console.log('✅ Respuesta del backend:');
    console.log(JSON.stringify(backendData, null, 2));
    console.log('\n');

    // Probar a través del frontend API route
    console.log('🔗 Probando a través del frontend API route (puerto 3000)...');
    const frontendResponse = await fetch('http://localhost:3000/api/mqtt-sensor/esp32/configuracion-automatica', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testConfig),
    });

    const frontendData = await frontendResponse.json();
    console.log('✅ Respuesta del frontend:');
    console.log(JSON.stringify(frontendData, null, 2));

  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Soluciones posibles:');
      console.log('1. Asegúrate de que el backend esté corriendo en el puerto 3001');
      console.log('2. Asegúrate de que el frontend esté corriendo en el puerto 3000');
      console.log('3. Verifica que no haya firewalls bloqueando las conexiones');
    }
  }
}

// Ejecutar la prueba
testESP32AutoConfig(); 