const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testIoTEndpoint() {
  console.log('🧪 Probando endpoint IoT público...\n');

  try {
    // Datos de prueba para el endpoint IoT
    const iotData = {
      deviceId: 'ESP32_TEST_001',
      deviceName: 'ESP32 Sensor Test',
      ubicacionId: 2,
      empresaId: 2,
      apiToken: 'test_token_123',
      timestamp: Date.now(),
      sensors: {
        temperatura: 25.5,
        humedad: 60.2
      },
      sensorDetails: [
        {
          tipo: 'TEMPERATURA',
          valor: 25.5,
          unidad: 'C',
          ubicacionId: 2
        },
        {
          tipo: 'HUMEDAD',
          valor: 60.2,
          unidad: '%',
          ubicacionId: 2
        }
      ]
    };

    console.log('📤 Enviando datos IoT:', JSON.stringify(iotData, null, 2));

    const response = await axios.post(`${BASE_URL}/iot/lecturas`, iotData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Respuesta del endpoint IoT:', response.data);
    return true;

  } catch (error) {
    if (error.response) {
      console.log('❌ Error del endpoint IoT:', {
        status: error.response.status,
        data: error.response.data
      });
    } else {
      console.log('❌ Error de conexión:', error.message);
    }
    return false;
  }
}

// Ejecutar test
testIoTEndpoint();
