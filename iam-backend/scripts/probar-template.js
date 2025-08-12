// Script para probar que el template Arduino genere código correcto
const { ARDUINO_CODE_TEMPLATE } = require('../src/sensores/templates/arduino-code.template.ts');

// Configuración de prueba
const configPrueba = {
  deviceId: "esp32_test_001",
  deviceName: "ESP32Test",
  ubicacionId: 2,
  empresaId: 2,
  wifi: {
    ssid: "TestWiFi",
    password: "TestPassword"
  },
  api: {
    baseUrl: "http://localhost:3001", // Este valor será ignorado por el template
    token: "test_token_123",
    endpoint: "/old/endpoint" // Este valor será ignorado por el template
  },
  sensores: [
    {
      tipo: "TEMPERATURA",
      nombre: "Temperatura (DHT22)",
      pin: 4,
      pin2: 0,
      enabled: true,
      umbralMin: 15,
      umbralMax: 35,
      unidad: "°C",
      intervalo: 30000
    },
    {
      tipo: "HUMEDAD",
      nombre: "Humedad (DHT22)",
      pin: 4,
      pin2: 0,
      enabled: true,
      umbralMin: 30,
      umbralMax: 80,
      unidad: "%",
      intervalo: 30000
    }
  ],
  intervalo: 30000
};

console.log('🧪 Probando template Arduino corregido...\n');

try {
  // Generar código usando el template
  const codigoGenerado = ARDUINO_CODE_TEMPLATE(configPrueba);
  
  // Verificar que el código contenga los valores correctos
  const tieneIPCorrecta = codigoGenerado.includes('http://192.168.0.12:3001');
  const tieneEndpointCorrecto = codigoGenerado.includes('/iot/lecturas');
  const tieneEndpointConfig = codigoGenerado.includes('/iot/config');
  
  console.log('✅ Código generado exitosamente');
  console.log(`📏 Longitud del código: ${codigoGenerado.length} caracteres`);
  console.log('');
  
  console.log('🔍 Verificando valores correctos:');
  console.log(`  ✅ IP del servidor (192.168.0.12:3001): ${tieneIPCorrecta ? 'SÍ' : 'NO'}`);
  console.log(`  ✅ Endpoint de lecturas (/iot/lecturas): ${tieneEndpointCorrecto ? 'SÍ' : 'NO'}`);
  console.log(`  ✅ Endpoint de configuración (/iot/config): ${tieneEndpointConfig ? 'SÍ' : 'NO'}`);
  console.log('');
  
  if (tieneIPCorrecta && tieneEndpointCorrecto && tieneEndpointConfig) {
    console.log('🎉 ¡Template funcionando correctamente!');
    console.log('   El código Arduino ahora usará:');
    console.log('   - IP: http://192.168.0.12:3001');
    console.log('   - Endpoint de lecturas: /iot/lecturas');
    console.log('   - Endpoint de configuración: /iot/config');
  } else {
    console.log('❌ Template con problemas:');
    if (!tieneIPCorrecta) console.log('   - Falta IP correcta');
    if (!tieneEndpointCorrecto) console.log('   - Falta endpoint de lecturas correcto');
    if (!tieneEndpointConfig) console.log('   - Falta endpoint de configuración correcto');
  }
  
  // Mostrar fragmentos relevantes del código
  console.log('\n📋 Fragmentos del código generado:');
  console.log('--- Configuración API ---');
  const lineasAPI = codigoGenerado.split('\n').filter(line => 
    line.includes('apiBaseUrl') || line.includes('apiEndpoint')
  );
  lineasAPI.forEach(line => console.log(line.trim()));
  
  console.log('\n--- Endpoint de configuración ---');
  const lineasConfig = codigoGenerado.split('\n').filter(line => 
    line.includes('/iot/config')
  );
  lineasConfig.forEach(line => console.log(line.trim()));
  
  console.log('\n--- Endpoint de lecturas ---');
  const lineasLecturas = codigoGenerado.split('\n').filter(line => 
    line.includes('/iot/lecturas')
  );
  lineasLecturas.forEach(line => console.log(line.trim()));
  
} catch (error) {
  console.error('❌ Error generando código:', error);
}

