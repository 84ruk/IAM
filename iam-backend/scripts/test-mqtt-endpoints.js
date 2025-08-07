#!/usr/bin/env node

const axios = require('axios');

// Configuración
const BASE_URL = process.env.API_URL || 'http://localhost:3000';
const JWT_TOKEN = process.env.JWT_TOKEN || '';

if (!JWT_TOKEN) {
  console.log('❌ Error: JWT_TOKEN no configurado');
  console.log('Ejecuta: export JWT_TOKEN="tu_token_jwt"');
  process.exit(1);
}

const headers = {
  'Authorization': `Bearer ${JWT_TOKEN}`,
  'Content-Type': 'application/json',
};

// Función para hacer requests
async function makeRequest(method, endpoint, data = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers,
      ...(data && { data }),
    };

    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status,
    };
  }
}

// Tests
async function runTests() {
  console.log('🧪 Iniciando pruebas de endpoints MQTT...\n');

  const tests = [
    // 1. Estado MQTT
    {
      name: 'GET /mqtt-sensor/status',
      test: () => makeRequest('GET', '/mqtt-sensor/status'),
    },
    {
      name: 'POST /mqtt-sensor/toggle (habilitar)',
      test: () => makeRequest('POST', '/mqtt-sensor/toggle', { enabled: true }),
    },

    // 2. Dispositivos EMQX
    {
      name: 'GET /mqtt-sensor/devices',
      test: () => makeRequest('GET', '/mqtt-sensor/devices'),
    },
    {
      name: 'GET /mqtt-sensor/broker/stats',
      test: () => makeRequest('GET', '/mqtt-sensor/broker/stats'),
    },

    // 3. Sensores
    {
      name: 'GET /mqtt-sensor/sensores/listar',
      test: () => makeRequest('GET', '/mqtt-sensor/sensores/listar'),
    },
    {
      name: 'POST /mqtt-sensor/sensores/registrar',
      test: () => makeRequest('POST', '/mqtt-sensor/sensores/registrar', {
        nombre: 'Sensor de Prueba',
        tipo: 'TEMPERATURA',
        ubicacionId: 1,
        activo: true,
        configuracion: {
          unidad: '°C',
          rango_min: -40,
          rango_max: 80,
        },
      }),
    },

    // 4. Lecturas
    {
      name: 'GET /mqtt-sensor/lecturas/listar',
      test: () => makeRequest('GET', '/mqtt-sensor/lecturas/listar'),
    },
    {
      name: 'POST /mqtt-sensor/lecturas/registrar',
      test: () => makeRequest('POST', '/mqtt-sensor/lecturas/registrar', {
        tipo: 'TEMPERATURA',
        valor: 25.5,
        unidad: '°C',
        ubicacionId: 1,
      }),
    },
    {
      name: 'POST /mqtt-sensor/lecturas/simular',
      test: () => makeRequest('POST', '/mqtt-sensor/lecturas/simular', {
        productoId: 1,
      }),
    },

    // 5. Analytics y Alertas
    {
      name: 'GET /mqtt-sensor/analytics',
      test: () => makeRequest('GET', '/mqtt-sensor/analytics'),
    },
    {
      name: 'GET /mqtt-sensor/alertas',
      test: () => makeRequest('GET', '/mqtt-sensor/alertas'),
    },

    // 6. Dashboard
    {
      name: 'GET /mqtt-sensor/dashboard/ubicaciones',
      test: () => makeRequest('GET', '/mqtt-sensor/dashboard/ubicaciones'),
    },
    {
      name: 'GET /mqtt-sensor/dashboard/alertas',
      test: () => makeRequest('GET', '/mqtt-sensor/dashboard/alertas'),
    },

    // 7. Monitoreo
    {
      name: 'GET /mqtt-sensor/monitoreo/estado',
      test: () => makeRequest('GET', '/mqtt-sensor/monitoreo/estado'),
    },
    {
      name: 'GET /mqtt-sensor/monitoreo/estadisticas',
      test: () => makeRequest('GET', '/mqtt-sensor/monitoreo/estadisticas'),
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    console.log(`🔍 Probando: ${test.name}`);
    
    const result = await test.test();
    
    if (result.success) {
      console.log(`✅ Éxito: ${test.name}`);
      console.log(`   Respuesta: ${JSON.stringify(result.data, null, 2).substring(0, 200)}...`);
      passed++;
    } else {
      console.log(`❌ Falló: ${test.name}`);
      console.log(`   Error: ${result.error?.message || result.error}`);
      console.log(`   Status: ${result.status}`);
      failed++;
    }
    
    console.log('');
  }

  // Resumen
  console.log('📊 Resumen de Pruebas');
  console.log('=====================');
  console.log(`✅ Exitosas: ${passed}`);
  console.log(`❌ Fallidas: ${failed}`);
  console.log(`📈 Total: ${passed + failed}`);
  console.log(`🎯 Tasa de éxito: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

  if (failed > 0) {
    console.log('\n⚠️  Algunas pruebas fallaron. Verifica:');
    console.log('   - Que el servidor esté ejecutándose');
    console.log('   - Que el JWT token sea válido');
    console.log('   - Que tengas permisos de ADMIN/SUPERADMIN');
    console.log('   - Que tengas una empresa configurada');
  } else {
    console.log('\n🎉 ¡Todas las pruebas pasaron exitosamente!');
  }
}

// Ejecutar pruebas
runTests().catch(console.error); 