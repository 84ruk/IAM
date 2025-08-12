const axios = require('axios');

const BASE_URL = 'http://localhost:3001';
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NTQ5MzAzOTcsImp0aSI6ImVkNGZkNDljLTMxYjktNGZhNy04MTllLTRlMzIwNDEzYjdhZCIsInN1YiI6IjIiLCJlbWFpbCI6ImJhcnVrMDY2QGdtYWlsLmNvbSIsInJvbCI6IkFETUlOIiwiZW1wcmVzYUlkIjoyLCJ0aXBvSW5kdXN0cmlhIjoiR0VORVJJQ0EiLCJhdXRoUHJvdmlkZXIiOiJnb29nbGUiLCJleHAiOjE3NTUwMTY3OTcsImF1ZCI6Imh0dHA6Ly9sb2NhbGhvc3Q6MzAwMSIsImlzcyI6Imh0dHA6Ly9sb2NhbGhvc3Q6MzAwMSJ9.asAe5308G62JhQs6_aGT1jgML_BLd8gnh-OH21RX6ww';

async function testSensorSystem() {
  console.log('🧪 Probando sistema de sensores...\n');

  try {
    // Usar el token JWT directamente
    console.log('1️⃣ Usando token JWT válido...');
    const authToken = AUTH_TOKEN;
    console.log('✅ Token configurado\n');

    // 2. Obtener ubicaciones disponibles
    console.log('2️⃣ Obteniendo ubicaciones...');
    const ubicacionesResponse = await axios.get(`${BASE_URL}/ubicaciones`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const ubicaciones = ubicacionesResponse.data;
    if (ubicaciones.length === 0) {
      console.log('❌ No hay ubicaciones disponibles');
      return;
    }
    
    const ubicacionId = ubicaciones[0].id;
    console.log(`✅ Ubicación encontrada: ${ubicaciones[0].nombre} (ID: ${ubicacionId})\n`);

    // 3. Crear un sensor
    console.log('3️⃣ Creando sensor...');
    const timestamp = Date.now();
    const sensorData = {
      nombre: `Sensor Test Temperatura ${timestamp}`, // Nombre único cada vez
      tipo: 'TEMPERATURA',
      ubicacionId: ubicacionId,
      descripcion: 'Sensor de prueba para testing'
      // Remover activo y configuracion para usar valores por defecto
    };

    const sensorResponse = await axios.post(`${BASE_URL}/sensores/registrar`, sensorData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const sensor = sensorResponse.data;
    console.log(`✅ Sensor creado: ${sensor.nombre} (ID: ${sensor.id})\n`);

    // 4. Enviar lectura de sensor
    console.log('4️⃣ Enviando lectura de sensor...');
    const lecturaData = {
      tipo: 'TEMPERATURA',
      valor: 25.5,
      unidad: 'celsius', // Usar 'celsius' que debería pasar todas las validaciones
      sensorId: sensor.id,
      ubicacionId: ubicacionId
    };
    
    console.log('📤 Enviando datos:', JSON.stringify(lecturaData, null, 2));

    const lecturaResponse = await axios.post(`${BASE_URL}/sensores/lectura`, lecturaData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log(`✅ Lectura enviada: ${lecturaResponse.data.valor}${lecturaResponse.data.unidad}\n`);

    // 5. Obtener lecturas del sensor
    console.log('5️⃣ Obteniendo lecturas del sensor...');
    const lecturasResponse = await axios.get(`${BASE_URL}/sensores/lecturas?sensorId=${sensor.id}&limite=5`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const lecturas = lecturasResponse.data;
    console.log(`✅ ${lecturas.length} lecturas obtenidas\n`);

    // 6. Probar endpoint IoT público
    console.log('6️⃣ Probando endpoint IoT público...');
    try {
      const iotData = {
        deviceId: 'ESP32_TEST_001',
        deviceName: 'ESP32 Sensor Test',
        ubicacionId: ubicacionId,
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
            ubicacionId: ubicacionId
          },
          {
            tipo: 'HUMEDAD',
            valor: 60.2,
            unidad: '%',
            ubicacionId: ubicacionId
          }
        ]
      };

      const iotResponse = await axios.post(`${BASE_URL}/iot/lecturas`, iotData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Endpoint IoT funcionando:', iotResponse.data.totalLecturas, 'lecturas registradas');
    } catch (error) {
      if (error.response) {
        console.log('⚠️ Endpoint IoT:', error.response.data.message || 'Error desconocido');
      } else {
        console.log('⚠️ Endpoint IoT:', error.message);
      }
    }

    // 7. Obtener sensores registrados
    console.log('7️⃣ Obteniendo sensores registrados...');
    const sensoresResponse = await axios.get(`${BASE_URL}/sensores/listar`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const sensores = sensoresResponse.data;
    console.log(`✅ ${sensores.length} sensores encontrados\n`);

    console.log('🎉 Sistema de sensores funcionando correctamente!');

  } catch (error) {
    console.error('❌ Error en el test:', error.response?.data || error.message);
  }
}

// Ejecutar test
testSensorSystem();
