wconst axios = require('axios');

// Configuración para las pruebas
const BASE_URL = 'http://localhost:3001';
const TEST_EMAIL = 'contactobaruk@gmail.com';
const TEST_PHONE = '+524441882114';

// Token de prueba (necesitarás un token válido de un usuario admin)
const TEST_TOKEN = 'tu-token-jwt-aqui'; // Reemplaza con un token válido

async function testNotifications() {
  console.log('🚀 Iniciando pruebas de notificaciones para Baruk...\n');

  try {
    // 1. Probar email de bienvenida
    console.log('📧 1. Probando email de bienvenida...');
    const welcomeResponse = await axios.post(
      `${BASE_URL}/notifications/test-email`,
      {
        email: TEST_EMAIL,
        tipo: 'welcome'
      },
      {
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('✅ Email de bienvenida:', welcomeResponse.data);

    // 2. Probar alerta de stock crítico
    console.log('\n📧 2. Probando alerta de stock crítico...');
    const stockResponse = await axios.post(
      `${BASE_URL}/notifications/test-email`,
      {
        email: TEST_EMAIL,
        tipo: 'stock-critical'
      },
      {
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('✅ Alerta de stock crítico:', stockResponse.data);

    // 3. Probar predicción de quiebre de stock
    console.log('\n📧 3. Probando predicción de quiebre de stock...');
    const predictionResponse = await axios.post(
      `${BASE_URL}/notifications/test-email`,
      {
        email: TEST_EMAIL,
        tipo: 'stockout-prediction'
      },
      {
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('✅ Predicción de quiebre:', predictionResponse.data);

    // 4. Probar alerta de sensor
    console.log('\n📧 4. Probando alerta de sensor...');
    const sensorResponse = await axios.post(
      `${BASE_URL}/notifications/test-email`,
      {
        email: TEST_EMAIL,
        tipo: 'sensor-alert'
      },
      {
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('✅ Alerta de sensor:', sensorResponse.data);

    // 5. Probar alerta de caducidad
    console.log('\n📧 5. Probando alerta de caducidad...');
    const expiryResponse = await axios.post(
      `${BASE_URL}/notifications/test-email`,
      {
        email: TEST_EMAIL,
        tipo: 'expiry-alert'
      },
      {
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('✅ Alerta de caducidad:', expiryResponse.data);

    // 6. Probar alerta de KPI
    console.log('\n📧 6. Probando alerta de KPI...');
    const kpiResponse = await axios.post(
      `${BASE_URL}/notifications/test-email`,
      {
        email: TEST_EMAIL,
        tipo: 'kpi-alert'
      },
      {
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('✅ Alerta de KPI:', kpiResponse.data);

    // 7. Obtener estadísticas de notificaciones
    console.log('\n📊 7. Obteniendo estadísticas de notificaciones...');
    const statsResponse = await axios.get(
      `${BASE_URL}/notifications/stats`,
      {
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`
        }
      }
    );
    console.log('✅ Estadísticas:', statsResponse.data);

    // 8. Obtener resumen de alertas
    console.log('\n📊 8. Obteniendo resumen de alertas...');
    const summaryResponse = await axios.get(
      `${BASE_URL}/notifications/summary`,
      {
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`
        }
      }
    );
    console.log('✅ Resumen de alertas:', summaryResponse.data);

    console.log('\n🎉 ¡Todas las pruebas completadas exitosamente!');
    console.log(`📧 Emails enviados a: ${TEST_EMAIL}`);
    console.log(`📱 SMS configurado para: ${TEST_PHONE}`);

  } catch (error) {
    console.error('❌ Error en las pruebas:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n💡 Para obtener un token válido:');
      console.log('1. Inicia sesión en la aplicación');
      console.log('2. Copia el token JWT de las cookies o headers');
      console.log('3. Reemplaza TEST_TOKEN en este script');
    }
  }
}

// Función para probar configuración de alertas
async function testAlertConfiguration() {
  console.log('\n⚙️ Probando configuración de alertas...\n');

  try {
    // Obtener configuración actual
    const configResponse = await axios.get(
      `${BASE_URL}/notifications/config`,
      {
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`
        }
      }
    );
    console.log('✅ Configuración actual:', configResponse.data);

    // Actualizar configuración para incluir tu email y teléfono
    const updateResponse = await axios.put(
      `${BASE_URL}/notifications/config/1`, // Asumiendo que existe una configuración con ID 1
      {
        destinatarios: [TEST_EMAIL, TEST_PHONE],
        activo: true,
        frecuencia: 'INMEDIATA'
      },
      {
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('✅ Configuración actualizada:', updateResponse.data);

  } catch (error) {
    console.error('❌ Error en configuración:', error.response?.data || error.message);
  }
}

// Ejecutar pruebas
async function runAllTests() {
  await testNotifications();
  await testAlertConfiguration();
}

// Verificar si la aplicación está corriendo
async function checkAppStatus() {
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Aplicación funcionando:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Aplicación no disponible:', error.message);
    console.log('💡 Asegúrate de que la aplicación esté corriendo en http://localhost:3001');
    return false;
  }
}

// Función principal
async function main() {
  console.log('🔍 Verificando estado de la aplicación...');
  const appRunning = await checkAppStatus();
  
  if (appRunning) {
    console.log('\n🚀 Iniciando pruebas de notificaciones...\n');
    await runAllTests();
  } else {
    console.log('\n❌ No se pueden ejecutar las pruebas. La aplicación no está disponible.');
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testNotifications, testAlertConfiguration, checkAppStatus }; 