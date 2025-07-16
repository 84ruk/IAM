const axios = require('axios');

const BASE_URL = 'http://localhost:3001';
const TEST_EMAIL = 'test-security-new@example.com';
const TEST_PASSWORD = 'Aa12345678!@';

async function testDirectAuth() {
  console.log('🔐 TEST DIRECTO DE AUTENTICACIÓN');
  console.log('==================================\n');

  try {
    // 1. Login para obtener refresh token
    console.log('1️⃣ Iniciando sesión...');
    const loginData = {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    };

    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, loginData);
    console.log('✅ Login exitoso');
    console.log('   - Refresh token recibido:', !!loginResponse.data.refreshToken);
    console.log('   - Mensaje:', loginResponse.data.message);

    const refreshToken = loginResponse.data.refreshToken;

    // 2. Verificar estado del usuario
    console.log('\n2️⃣ Verificando estado del usuario...');
    const statusResponse = await axios.get(`${BASE_URL}/auth/needs-setup`);
    console.log('✅ Estado obtenido');
    console.log('   - Necesita setup:', statusResponse.data.needsSetup);
    console.log('   - Usuario:', statusResponse.data.user?.email);
    console.log('   - Empresa:', statusResponse.data.empresa?.nombre);

    // 3. Probar endpoints que no requieren token específico
    console.log('\n3️⃣ Probando endpoints públicos...');
    
    // Test de configuración de Google OAuth
    const googleStatusResponse = await axios.get(`${BASE_URL}/auth/google/status`);
    console.log('✅ Estado de Google OAuth obtenido');
    console.log('   - OAuth habilitado:', googleStatusResponse.data.enabled);

    console.log('\n🎉 ¡AUTENTICACIÓN BÁSICA FUNCIONA!');
    console.log('\n📋 Resumen:');
    console.log('   ✅ Login exitoso');
    console.log('   ✅ Refresh token obtenido');
    console.log('   ✅ Estado de usuario obtenido');
    console.log('   ✅ Endpoints públicos funcionan');

    // 4. Crear un test simple para productos usando el usuario existente
    console.log('\n4️⃣ Probando acceso a productos (sin token)...');
    try {
      const productsResponse = await axios.get(`${BASE_URL}/productos`);
      console.log('❌ Error esperado: Endpoint requiere autenticación');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Protección de autenticación funcionando correctamente');
      } else {
        console.log('⚠️ Error inesperado:', error.response?.status);
      }
    }

    return {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      refreshToken: refreshToken,
      userStatus: statusResponse.data
    };

  } catch (error) {
    console.error('❌ Error en test directo:', error.response?.data || error.message);
    throw error;
  }
}

testDirectAuth().catch(console.error); 