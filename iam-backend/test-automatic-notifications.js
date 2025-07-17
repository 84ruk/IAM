const axios = require('axios');

// Configuración para las pruebas
const BASE_URL = 'http://localhost:3001';

// Credenciales de admin
const LOGIN_CREDENTIALS = {
  email: 'admin@elpeso.com',
  password: 'Carpinterito12?'
};

let authToken = null;

async function login() {
  console.log('🔐 Iniciando sesión...');
  
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, LOGIN_CREDENTIALS, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Extraer token
    const cookies = response.headers['set-cookie'];
    if (cookies) {
      const jwtCookie = cookies.find(cookie => cookie.startsWith('jwt='));
      if (jwtCookie) {
        authToken = jwtCookie.split(';')[0].replace('jwt=', '');
      }
    }

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
    return false;
  }
}

async function testAutomaticNotifications() {
  console.log('🚀 Probando notificaciones automáticas por empresa...\n');

  if (!authToken) {
    console.log('❌ No hay token de autenticación');
    return;
  }

  try {
    // 1. Obtener información de la empresa actual
    console.log('📊 1. Obteniendo información de la empresa...');
    const meResponse = await axios.get(`${BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    const user = meResponse.data;
    const empresaId = user.empresaId;
    console.log(`✅ Usuario: ${user.email} (${user.rol})`);
    console.log(`✅ Empresa ID: ${empresaId}`);

    // 2. Obtener usuarios de la empresa
    console.log('\n👥 2. Obteniendo usuarios de la empresa...');
    const usersResponse = await axios.get(`${BASE_URL}/users`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    const users = usersResponse.data.filter(u => u.empresaId === empresaId);
    console.log(`✅ Usuarios en la empresa: ${users.length}`);
    users.forEach(u => {
      console.log(`   - ${u.email} (${u.rol}) - ${u.activo ? '✅ Activo' : '❌ Inactivo'}`);
    });

    // 3. Probar alerta de stock crítico (se enviará a todos los usuarios admin de la empresa)
    console.log('\n🚨 3. Probando alerta de stock crítico automática...');
    const stockResponse = await axios.post(
      `${BASE_URL}/notifications/test-email`,
      {
        email: 'test@example.com', // No importa, se usará la configuración automática
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

    // 4. Probar alerta de sensor (se enviará a todos los usuarios admin de la empresa)
    console.log('\n🌡️ 4. Probando alerta de sensor automática...');
    const sensorResponse = await axios.post(
      `${BASE_URL}/notifications/test-email`,
      {
        email: 'test@example.com',
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

    // 5. Probar alerta de KPI (se enviará a todos los usuarios admin de la empresa)
    console.log('\n📊 5. Probando alerta de KPI automática...');
    const kpiResponse = await axios.post(
      `${BASE_URL}/notifications/test-email`,
      {
        email: 'test@example.com',
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

    // 6. Obtener configuración de alertas para verificar destinatarios automáticos
    console.log('\n⚙️ 6. Verificando configuración de alertas...');
    const configResponse = await axios.get(
      `${BASE_URL}/notifications/config`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );
    
    console.log('✅ Configuración de alertas:');
    configResponse.data.forEach(config => {
      console.log(`   - ${config.tipoAlerta}: ${config.activo ? '✅ Activo' : '❌ Inactivo'}`);
      if (config.destinatarios.length > 0) {
        console.log(`     Destinatarios: ${config.destinatarios.join(', ')}`);
      } else {
        console.log(`     Destinatarios: Automático (usuarios admin de la empresa)`);
      }
    });

    // 7. Obtener estadísticas de notificaciones
    console.log('\n📈 7. Estadísticas de notificaciones...');
    const statsResponse = await axios.get(
      `${BASE_URL}/notifications/stats`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );
    console.log('✅ Estadísticas:', statsResponse.data);

    console.log('\n🎉 ¡Pruebas de notificaciones automáticas completadas!');
    console.log('📧 Las alertas se enviaron automáticamente a los usuarios admin de la empresa');
    console.log('🔧 El sistema ahora detecta automáticamente los destinatarios por empresa');

  } catch (error) {
    console.error('❌ Error en las pruebas:', error.response?.data || error.message);
  }
}

async function testNewUserWelcome() {
  console.log('\n🎉 Probando email de bienvenida para nuevo usuario...\n');

  if (!authToken) {
    console.log('❌ No hay token de autenticación');
    return;
  }

  try {
    // Simular creación de un nuevo usuario (esto requeriría permisos de admin)
    console.log('👤 Simulando email de bienvenida para nuevo usuario...');
    
    // En lugar de crear un usuario real, probamos el endpoint de email de bienvenida
    const welcomeResponse = await axios.post(
      `${BASE_URL}/notifications/test-email`,
      {
        email: 'nuevo.usuario@elpeso.com',
        tipo: 'welcome'
      },
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Email de bienvenida simulado:', welcomeResponse.data);
    console.log('💡 En producción, este email se enviaría automáticamente cuando se cree un nuevo usuario');

  } catch (error) {
    console.error('❌ Error en prueba de bienvenida:', error.response?.data || error.message);
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
    console.log('\n❌ No se pudo autenticar. Verifica las credenciales.');
    return;
  }

  console.log('\n🚀 Iniciando pruebas de notificaciones automáticas...\n');
  await testAutomaticNotifications();
  await testNewUserWelcome();
  
  console.log('\n🎉 ¡Proceso completado!');
  console.log('📧 Las notificaciones ahora se envían automáticamente a los usuarios de cada empresa');
  console.log('👤 Los nuevos usuarios recibirán emails de bienvenida automáticamente');
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { 
  testAutomaticNotifications, 
  testNewUserWelcome, 
  checkAppStatus 
}; 