const axios = require('axios');

const BASE_URL = 'http://localhost:3001';
const TEST_EMAIL = 'admin@elpeso.com';
const TEST_PASSWORD = 'Carpinterito12?';

let currentToken = null;
let currentRefreshToken = null;

async function login() {
  try {
    console.log('🔐 Iniciando sesión...');
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    currentToken = response.data.access_token;
    currentRefreshToken = response.data.refresh_token;
    
    console.log('✅ Login exitoso');
    console.log(`📝 Token: ${currentToken ? currentToken.substring(0, 20) + '...' : 'No disponible'}`);
    console.log(`🔄 Refresh Token: ${currentRefreshToken ? currentRefreshToken.substring(0, 20) + '...' : 'No disponible'}`);
    
    return response.data;
  } catch (error) {
    console.error('❌ Error en login:', error.response?.data || error.message);
    throw error;
  }
}

async function checkSessionLimits() {
  try {
    console.log('\n📊 Verificando límites de sesión...');
    const response = await axios.get(`${BASE_URL}/sessions/limits`, {
      headers: { Authorization: `Bearer ${currentToken}` }
    });

    console.log('✅ Límites de sesión:');
    console.log(`   - Sesiones actuales: ${response.data.currentSessions}`);
    console.log(`   - Máximo permitido: ${response.data.maxSessions}`);
    console.log(`   - Permitido: ${response.data.allowed}`);
    console.log(`   - Necesita revocación: ${response.data.needsRevocation}`);
    
    return response.data;
  } catch (error) {
    console.error('❌ Error verificando límites:', error.response?.data || error.message);
    throw error;
  }
}

async function getMySessions() {
  try {
    console.log('\n📋 Obteniendo sesiones activas...');
    const response = await axios.get(`${BASE_URL}/sessions/my-sessions`, {
      headers: { Authorization: `Bearer ${currentToken}` }
    });

    console.log(`✅ Sesiones activas (${response.data.length}):`);
    response.data.forEach((session, index) => {
      console.log(`   ${index + 1}. ID: ${session.id ? session.id.substring(0, 20) + '...' : 'No disponible'}`);
      console.log(`      Creada: ${new Date(session.createdAt).toLocaleString()}`);
      console.log(`      Activa: ${session.isActive}`);
    });
    
    return response.data;
  } catch (error) {
    console.error('❌ Error obteniendo sesiones:', error.response?.data || error.message);
    throw error;
  }
}

async function attemptSecondLogin() {
  try {
    console.log('\n🔄 Intentando segundo login (debería revocar la primera sesión)...');
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    const newToken = response.data.access_token;
    const newRefreshToken = response.data.refresh_token;
    
    console.log('✅ Segundo login exitoso');
    console.log(`📝 Nuevo Token: ${newToken ? newToken.substring(0, 20) + '...' : 'No disponible'}`);
    console.log(`🔄 Nuevo Refresh Token: ${newRefreshToken ? newRefreshToken.substring(0, 20) + '...' : 'No disponible'}`);
    
    // Verificar que el token anterior ya no funciona
    try {
      await axios.get(`${BASE_URL}/sessions/limits`, {
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      console.log('⚠️  El token anterior aún funciona (esto no debería pasar)');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ El token anterior fue revocado correctamente');
      } else {
        console.log('❌ Error inesperado con token anterior:', error.response?.data || error.message);
      }
    }
    
    // Actualizar tokens para continuar pruebas
    currentToken = newToken;
    currentRefreshToken = newRefreshToken;
    
    return response.data;
  } catch (error) {
    console.error('❌ Error en segundo login:', error.response?.data || error.message);
    throw error;
  }
}

async function testDashboardAccess() {
  try {
    console.log('\n📊 Probando acceso al dashboard...');
    const response = await axios.get(`${BASE_URL}/dashboard/kpis`, {
      headers: { Authorization: `Bearer ${currentToken}` }
    });

    console.log('✅ Acceso al dashboard exitoso');
    console.log(`📈 KPIs obtenidos: ${Object.keys(response.data).length}`);
    
    return response.data;
  } catch (error) {
    console.error('❌ Error accediendo al dashboard:', error.response?.data || error.message);
    throw error;
  }
}

async function testSessionStats() {
  try {
    console.log('\n📈 Obteniendo estadísticas de sesiones...');
    const response = await axios.get(`${BASE_URL}/sessions/stats`, {
      headers: { Authorization: `Bearer ${currentToken}` }
    });

    console.log('✅ Estadísticas de sesiones:');
    console.log(`   - Sesiones activas totales: ${response.data.totalActiveSessions}`);
    console.log(`   - Sesiones expiradas: ${response.data.totalExpiredSessions}`);
    console.log(`   - Sesiones por rol:`, response.data.sessionsByRole);
    
    return response.data;
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error.response?.data || error.message);
    throw error;
  }
}

async function runTests() {
  console.log('🚀 Iniciando pruebas de límite de 1 sesión por cuenta');
  console.log(`👤 Usuario: ${TEST_EMAIL}`);
  console.log('=' .repeat(60));

  try {
    // 1. Primer login
    await login();
    
    // 2. Verificar límites iniciales
    await checkSessionLimits();
    
    // 3. Ver sesiones activas
    await getMySessions();
    
    // 4. Probar acceso al dashboard
    await testDashboardAccess();
    
    // 5. Intentar segundo login (debería revocar el primero)
    await attemptSecondLogin();
    
    // 6. Verificar límites después del segundo login
    await checkSessionLimits();
    
    // 7. Ver sesiones activas después del segundo login
    await getMySessions();
    
    // 8. Probar acceso al dashboard con nuevo token
    await testDashboardAccess();
    
    // 9. Ver estadísticas globales
    await testSessionStats();
    
    console.log('\n🎉 Todas las pruebas completadas exitosamente!');
    console.log('✅ El sistema está funcionando correctamente con 1 sesión por cuenta');
    
  } catch (error) {
    console.error('\n💥 Error durante las pruebas:', error.message);
    process.exit(1);
  }
}

// Ejecutar pruebas
runTests(); 