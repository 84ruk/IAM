const axios = require('axios');

const BASE_URL = 'http://localhost:3001';
const DEVICE_ID = 'esp32_1754778098281_dzcafmeki';
const API_TOKEN = 'uQl6hzf4FhB8heMvvhcVVYAkvZklr4ZJ';
const EMPRESA_ID = 2;

async function testIoTEndpoints() {
  console.log('🧪 Probando endpoints IoT...\n');

  try {
    // 1. Probar endpoint de configuración
    console.log('1️⃣ Probando /iot/config...');
    const configResponse = await axios.post(`${BASE_URL}/iot/config`, {
      deviceId: DEVICE_ID,
      apiToken: API_TOKEN,
      empresaId: EMPRESA_ID
    });
    
    console.log('✅ Configuración obtenida exitosamente');
    console.log('📊 Datos:', JSON.stringify(configResponse.data, null, 2));
    
  } catch (error) {
    console.log('❌ Error en /iot/config:', error.response?.status, error.response?.statusText);
    if (error.response?.data) {
      console.log('📥 Respuesta:', error.response.data);
    }
  }

  console.log('\n' + '='.repeat(50) + '\n');

  try {
    // 2. Probar endpoint de lecturas
    console.log('2️⃣ Probando /iot/lecturas...');
    const lecturasResponse = await axios.post(`${BASE_URL}/iot/lecturas`, {
      deviceId: DEVICE_ID,
      deviceName: 'ESP32Temp',
      ubicacionId: 2,
      empresaId: EMPRESA_ID,
      apiToken: API_TOKEN,
      timestamp: Date.now(),
      sensors: {
        'Temperatura (DHT22)': 26.6,
        'Humedad (DHT22)': 44.5
      }
    });
    
    console.log('✅ Lecturas enviadas exitosamente');
    console.log('📊 Respuesta:', JSON.stringify(lecturasResponse.data, null, 2));
    
  } catch (error) {
    console.log('❌ Error en /iot/lecturas:', error.response?.status, error.response?.statusText);
    if (error.response?.data) {
      console.log('📥 Respuesta:', error.response.data);
    }
  }

  console.log('\n' + '='.repeat(50) + '\n');

  try {
    // 3. Probar endpoint protegido (debería fallar)
    console.log('3️⃣ Probando /sensores/esp32-config (debería fallar por autenticación)...');
    const protectedResponse = await axios.get(`${BASE_URL}/sensores/esp32-config/${DEVICE_ID}`);
    
    console.log('⚠️ Este endpoint no debería ser accesible sin autenticación');
    console.log('📊 Respuesta:', JSON.stringify(protectedResponse.data, null, 2));
    
  } catch (error) {
    console.log('✅ Correcto: endpoint protegido rechazó la petición');
    console.log('📊 Status:', error.response?.status, error.response?.statusText);
  }
}

// Ejecutar pruebas
testIoTEndpoints().catch(console.error);

