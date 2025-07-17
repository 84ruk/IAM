const axios = require('axios');

// Configuración para las pruebas
const BASE_URL = 'http://localhost:3001';
const TEST_EMAIL = 'contactobaruk@gmail.com';
const TEST_PHONE = '+524441882114';

// Credenciales de prueba (usando admin@elpeso.com con la contraseña proporcionada)
const LOGIN_CREDENTIALS = {
  email: 'admin@elpeso.com',
  password: 'Carpinterito12?'
};

let authToken = null;

async function login() {
  console.log('🔐 Iniciando sesión con:', LOGIN_CREDENTIALS.email);
  
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, LOGIN_CREDENTIALS, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Extraer token de las cookies o del response
    const cookies = response.headers['set-cookie'];
    if (cookies) {
      const jwtCookie = cookies.find(cookie => cookie.startsWith('jwt='));
      if (jwtCookie) {
        authToken = jwtCookie.split(';')[0].replace('jwt=', '');
      }
    }

    // Si no hay cookie, intentar del response body
    if (!authToken && response.data.token) {
      authToken = response.data.token;
    }

    if (authToken) {
      console.log('✅ Login exitoso');
      return true;
    } else {
      console.log('❌ No se pudo obtener el token de autenticación');
      return false;
    }

  } catch (error) {
    console.error('❌ Error en login:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n💡 Posibles soluciones:');
      console.log('1. Verifica que la contraseña sea correcta');
      console.log('2. Si no recuerdas la contraseña, puedes resetearla o crear una nueva');
      console.log('3. También puedes usar otro usuario admin de la lista:');
      console.log('   - superadmin@iam.com');
      console.log('   - dosalyael32@gmail.com');
      console.log('   - admin@elpeso.com');
      console.log('   - baruk066@gmail.com');
    }
    return false;
  }
}

async function testNotifications() {
  console.log('🚀 Iniciando pruebas de notificaciones para Baruk...\n');

  if (!authToken) {
    console.log('❌ No hay token de autenticación');
    return;
  }

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
          'Authorization': `Bearer ${authToken}`,
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
          'Authorization': `Bearer ${authToken}`,
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
          'Authorization': `Bearer ${authToken}`,
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
          'Authorization': `Bearer ${authToken}`,
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
          'Authorization': `Bearer ${authToken}`,
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
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('✅ Alerta de KPI:', kpiResponse.data);

    console.log('\n🎉 ¡Todas las pruebas de email completadas!');
    console.log(`📧 Emails enviados a: ${TEST_EMAIL}`);
    console.log(`📱 SMS configurado para: ${TEST_PHONE}`);

  } catch (error) {
    console.error('❌ Error en las pruebas:', error.response?.data || error.message);
  }
}

async function testAlertConfiguration() {
  console.log('\n⚙️ Probando configuración de alertas...\n');

  if (!authToken) {
    console.log('❌ No hay token de autenticación');
    return;
  }

  try {
    // Obtener configuración actual
    const configResponse = await axios.get(
      `${BASE_URL}/notifications/config`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );
    console.log('✅ Configuración actual:', configResponse.data);

    // Actualizar la primera configuración para incluir tu email y teléfono
    if (configResponse.data.length > 0) {
      const firstConfig = configResponse.data[0];
      const updateResponse = await axios.put(
        `${BASE_URL}/notifications/config/${firstConfig.id}`,
        {
          destinatarios: [TEST_EMAIL, TEST_PHONE],
          activo: true,
          frecuencia: 'INMEDIATA'
        },
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('✅ Configuración actualizada:', updateResponse.data);
    }

  } catch (error) {
    console.error('❌ Error en configuración:', error.response?.data || error.message);
  }
}

async function testStats() {
  console.log('\n📊 Probando estadísticas...\n');

  if (!authToken) {
    console.log('❌ No hay token de autenticación');
    return;
  }

  try {
    // Obtener estadísticas
    const statsResponse = await axios.get(
      `${BASE_URL}/notifications/stats`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );
    console.log('✅ Estadísticas:', statsResponse.data);

    // Obtener resumen
    const summaryResponse = await axios.get(
      `${BASE_URL}/notifications/summary`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );
    console.log('✅ Resumen:', summaryResponse.data);

  } catch (error) {
    console.error('❌ Error en estadísticas:', error.response?.data || error.message);
  }
}

// Verificar si la aplicación está corriendo
async function checkAppStatus() {
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Aplicación funcionando:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Aplicación no disponible:', error.message);
    return false;
  }
}

// Función principal
async function main() {
  console.log('🔍 Verificando estado de la aplicación...');
  const appRunning = await checkAppStatus();
  
  if (!appRunning) {
    console.log('\n❌ No se pueden ejecutar las pruebas. La aplicación no está disponible.');
    return;
  }

  console.log('\n🔐 Iniciando proceso de autenticación...');
  const loginSuccess = await login();
  
  if (!loginSuccess) {
    console.log('\n❌ No se pudo autenticar. Verifica las credenciales en el script.');
    console.log('💡 Credenciales actuales:', LOGIN_CREDENTIALS);
    return;
  }

  console.log('\n🚀 Iniciando pruebas de notificaciones...\n');
  await testNotifications();
  await testAlertConfiguration();
  await testStats();
  
  console.log('\n🎉 ¡Proceso completado!');
  console.log('📧 Revisa tu email: contactobaruk@gmail.com');
  console.log('📱 Revisa tu teléfono: +524441882114');
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { 
  login, 
  testNotifications, 
  testAlertConfiguration, 
  testStats, 
  checkAppStatus 
}; 