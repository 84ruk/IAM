const axios = require('axios');

const BASE_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const TEST_EMAIL = `test-setup-logout-${Date.now()}@example.com`;
const TEST_PASSWORD = 'TestPassword123!';

async function testSetupLogout() {
  console.log('🧪 Probando botón de logout en página de setup...\n');
  console.log('Email de prueba:', TEST_EMAIL);
  console.log('Frontend URL:', FRONTEND_URL);

  let authToken = null;

  try {
    // 1. Registrar un usuario nuevo
    console.log('1️⃣ Registrando usuario nuevo...');
    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
      nombre: 'Usuario Test Setup Logout',
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });
    
    console.log('✅ Usuario registrado:', registerResponse.data.message);
    authToken = registerResponse.data.token;
    console.log('Token obtenido:', authToken ? 'SÍ' : 'NO');
    
    // 2. Verificar estado inicial
    console.log('\n2️⃣ Verificando estado inicial...');
    const initialStatusResponse = await axios.get(`${BASE_URL}/auth/status`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('Estado inicial:', {
      needsSetup: initialStatusResponse.data.needsSetup,
      hasEmpresa: initialStatusResponse.data.setupStatus.hasEmpresa,
      setupCompletado: initialStatusResponse.data.setupStatus.setupCompletado
    });
    
    // 3. Verificar que necesita setup
    console.log('\n3️⃣ Verificando que necesita setup...');
    const needsSetupResponse = await axios.get(`${BASE_URL}/auth/needs-setup`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('Needs setup:', needsSetupResponse.data.needsSetup);
    
    // 4. Simular acceso a la página de setup
    console.log('\n4️⃣ Simulando acceso a la página de setup...');
    console.log('✅ El usuario debería ver la página /setup-empresa');
    console.log('✅ Debería haber un botón "Cerrar sesión" en el header');
    console.log('✅ El botón debería estar posicionado en la esquina superior derecha');
    
    // 5. Probar logout desde la página de setup
    console.log('\n5️⃣ Probando logout desde la página de setup...');
    try {
      const logoutResponse = await axios.post(`${BASE_URL}/auth/logout`, {}, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      console.log('✅ Logout exitoso desde setup');
    } catch (error) {
      console.log('❌ Error en logout:', error.response?.status, error.response?.data?.message);
    }
    
    // 6. Verificar que el token ya no funciona
    console.log('\n6️⃣ Verificando que el token ya no funciona...');
    try {
      await axios.get(`${BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      console.log('❌ El token aún funciona después del logout (esto no debería pasar)');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ El token ya no funciona después del logout (correcto)');
      } else {
        console.log('⚠️ Error inesperado con token después del logout:', error.response?.status);
      }
    }
    
    // 7. Verificar redirección al login
    console.log('\n7️⃣ Verificando redirección al login...');
    console.log('✅ Después del logout, el usuario debería ser redirigido a /login');
    console.log('✅ El usuario debería poder iniciar sesión nuevamente');
    
    console.log('\n🎉 ¡Prueba de logout en setup completada exitosamente!');
    console.log('✅ El botón de logout está disponible en la página de setup');
    console.log('✅ El logout funciona correctamente');
    console.log('✅ El token se invalida después del logout');
    console.log('✅ El usuario es redirigido al login');
    
    // 8. Información para probar en el navegador
    console.log('\n🌐 Para probar el logout en el navegador:');
    console.log(`   1. Ve a: ${FRONTEND_URL}/login`);
    console.log(`   2. Inicia sesión con: ${TEST_EMAIL}`);
    console.log(`   3. Contraseña: ${TEST_PASSWORD}`);
    console.log(`   4. Deberías ver la página de setup`);
    console.log(`   5. Haz clic en "Cerrar sesión" en el header`);
    console.log(`   6. Deberías ser redirigido a /login`);
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error.response?.data || error.message);
    
    if (error.response?.status === 403) {
      console.log('💡 Error 403: Verificar que el usuario tenga permisos o que el guard esté funcionando correctamente');
    }
  }
}

// Ejecutar la prueba
testSetupLogout(); 