const axios = require('axios');

const BASE_URL = 'http://localhost:3001';
const TEST_EMAIL = 'test-security-new@example.com';
const TEST_PASSWORD = 'Aa12345678!@';

async function testSimpleLogin() {
  console.log('🔐 TEST SIMPLE DE LOGIN');
  console.log('========================\n');

  try {
    // 1. Login
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

    // 2. Usar refresh token para obtener nuevo token de acceso
    console.log('\n2️⃣ Obteniendo token de acceso con refresh token...');
    const refreshData = {
      refreshToken: refreshToken
    };

    const refreshResponse = await axios.post(`${BASE_URL}/auth/refresh`, refreshData);
    console.log('✅ Refresh exitoso');
    console.log('   - Token recibido:', !!refreshResponse.data.token);
    console.log('   - Refresh token nuevo:', !!refreshResponse.data.refreshToken);

    const accessToken = refreshResponse.data.token;

    // 3. Verificar que el token funciona
    console.log('\n3️⃣ Verificando token de acceso...');
    const profileResponse = await axios.get(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    console.log('✅ Token válido');
    console.log('   - ID:', profileResponse.data.id);
    console.log('   - Email:', profileResponse.data.email);
    console.log('   - Rol:', profileResponse.data.rol);

    console.log('\n🎉 ¡LOGIN Y TOKEN FUNCIONAN CORRECTAMENTE!');
    console.log('\n📋 Resumen:');
    console.log('   ✅ Login exitoso');
    console.log('   ✅ Refresh token obtenido');
    console.log('   ✅ Token de acceso obtenido');
    console.log('   ✅ Token válido para /auth/me');

    return {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      accessToken: accessToken,
      refreshToken: refreshResponse.data.refreshToken,
      userId: profileResponse.data.id
    };

  } catch (error) {
    console.error('❌ Error en test simple:', error.response?.data || error.message);
    throw error;
  }
}

testSimpleLogin().catch(console.error); 