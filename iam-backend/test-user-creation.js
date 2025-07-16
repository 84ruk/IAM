const axios = require('axios');

const BASE_URL = 'http://localhost:3001';
const TEST_EMAIL = `test-user-${Date.now()}@example.com`;
const STRONG_PASSWORD = 'Aa12345678!@';

async function testUserCreation() {
  console.log('👤 TESTING MÓDULO DE CREACIÓN DE USUARIOS');
  console.log('==========================================\n');

  try {
    // 1. Test de registro de usuario
    console.log('1️⃣ Probando registro de usuario...');
    const registerData = {
      nombre: 'Usuario Test',
      email: TEST_EMAIL,
      password: STRONG_PASSWORD
    };

    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, registerData);
    console.log('✅ Registro exitoso');
    console.log('   - Usuario ID:', registerResponse.data.user.id);
    console.log('   - Email:', registerResponse.data.user.email);
    console.log('   - Setup completado:', registerResponse.data.user.setupCompletado);
    console.log('   - Token recibido:', !!registerResponse.data.token);
    console.log('   - Refresh token recibido:', !!registerResponse.data.refreshToken);

    // 2. Test de login del usuario creado
    console.log('\n2️⃣ Probando login del usuario creado...');
    const loginData = {
      email: TEST_EMAIL,
      password: STRONG_PASSWORD
    };

    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, loginData);
    console.log('✅ Login exitoso');
    console.log('   - Token recibido:', !!loginResponse.data.token);
    console.log('   - Refresh token recibido:', !!loginResponse.data.refreshToken);

    // 3. Test de obtención de perfil
    console.log('\n3️⃣ Probando obtención de perfil...');
    const token = loginResponse.data.token;
    const profileResponse = await axios.get(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Perfil obtenido');
    console.log('   - ID:', profileResponse.data.id);
    console.log('   - Email:', profileResponse.data.email);
    console.log('   - Rol:', profileResponse.data.rol);

    // 4. Test de estado de usuario
    console.log('\n4️⃣ Probando estado de usuario...');
    const statusResponse = await axios.get(`${BASE_URL}/auth/needs-setup`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Estado obtenido');
    console.log('   - Necesita setup:', statusResponse.data.needsSetup);

    console.log('\n🎉 ¡TODOS LOS TESTS DE USUARIO PASARON EXITOSAMENTE!');
    console.log('\n📋 Resumen:');
    console.log('   ✅ Registro de usuario');
    console.log('   ✅ Login de usuario');
    console.log('   ✅ Obtención de perfil');
    console.log('   ✅ Estado de usuario');

  } catch (error) {
    console.error('❌ Error en test de usuario:', error.response?.data || error.message);
    
    if (error.response?.status === 400 && error.response?.data?.message?.includes('Ya existe')) {
      console.log('💡 Usuario ya existe, probando login directo...');
      
      try {
        const loginData = {
          email: TEST_EMAIL,
          password: STRONG_PASSWORD
        };

        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, loginData);
        console.log('✅ Login exitoso con usuario existente');
        console.log('   - Token recibido:', !!loginResponse.data.token);
      } catch (loginError) {
        console.error('❌ Error en login:', loginError.response?.data || loginError.message);
      }
    }
  }
}

testUserCreation(); 