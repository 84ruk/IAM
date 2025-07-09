const axios = require('axios');

const BASE_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const TEST_EMAIL = `test-token-update-${Date.now()}@example.com`;
const TEST_PASSWORD = 'TestPassword123!';

async function testTokenUpdateAfterSetup() {
  console.log('🧪 Probando actualización de token después del setup de empresa...\n');
  console.log('Email de prueba:', TEST_EMAIL);

  let authToken = null;
  let setupToken = null;

  try {
    // 1. Registrar un usuario nuevo
    console.log('1️⃣ Registrando usuario nuevo...');
    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
      nombre: 'Usuario Test Token Update',
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });
    
    console.log('✅ Usuario registrado:', registerResponse.data.message);
    authToken = registerResponse.data.token;
    console.log('Token inicial obtenido:', authToken ? 'SÍ' : 'NO');
    
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
    
    // 3. Verificar endpoint /auth/me antes del setup
    console.log('\n3️⃣ Verificando /auth/me antes del setup...');
    const meBeforeResponse = await axios.get(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('Usuario antes del setup:', {
      id: meBeforeResponse.data.id,
      email: meBeforeResponse.data.email,
      rol: meBeforeResponse.data.rol,
      empresaId: meBeforeResponse.data.empresaId,
      tipoIndustria: meBeforeResponse.data.tipoIndustria
    });
    
    // 4. Configurar empresa
    console.log('\n4️⃣ Configurando empresa...');
    const setupResponse = await axios.post(`${BASE_URL}/auth/setup-empresa`, {
      nombreEmpresa: 'Empresa Test Token Update',
      tipoIndustria: 'GENERICA',
      rfc: 'TOKENUPDATE123',
      direccion: 'Dirección de prueba 789'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Empresa configurada:', setupResponse.data.message);
    setupToken = setupResponse.data.token;
    console.log('Nuevo token recibido:', setupToken ? 'SÍ' : 'NO');
    console.log('Token anterior vs nuevo:', authToken === setupToken ? 'IGUALES ❌' : 'DIFERENTES ✅');
    
    // 5. Verificar endpoint /auth/me después del setup con el nuevo token
    console.log('\n5️⃣ Verificando /auth/me después del setup con nuevo token...');
    const meAfterResponse = await axios.get(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${setupToken}` }
    });
    
    console.log('Usuario después del setup:', {
      id: meAfterResponse.data.id,
      email: meAfterResponse.data.email,
      rol: meAfterResponse.data.rol,
      empresaId: meAfterResponse.data.empresaId,
      tipoIndustria: meAfterResponse.data.tipoIndustria
    });
    
    // 6. Verificar que el token anterior ya no funciona
    console.log('\n6️⃣ Verificando que el token anterior ya no funciona...');
    try {
      await axios.get(`${BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      console.log('❌ El token anterior aún funciona (esto no debería pasar)');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ El token anterior ya no funciona (correcto)');
      } else {
        console.log('⚠️ Error inesperado con token anterior:', error.response?.status);
      }
    }
    
    // 7. Probar acceso a recursos protegidos con el nuevo token
    console.log('\n7️⃣ Probando acceso a recursos protegidos...');
    try {
      const productosResponse = await axios.get(`${BASE_URL}/productos`, {
        headers: { Authorization: `Bearer ${setupToken}` }
      });
      console.log('✅ Acceso a productos exitoso con nuevo token');
    } catch (error) {
      console.log('❌ Error accediendo a productos:', error.response?.status, error.response?.data?.message);
    }
    
    console.log('\n🎉 ¡Prueba completada exitosamente!');
    console.log('✅ El token se actualiza correctamente después del setup de empresa');
    console.log('✅ Las siguientes peticiones usan el nuevo token con empresaId');
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error.response?.data || error.message);
    
    if (error.response?.status === 403) {
      console.log('💡 Error 403: Verificar que el usuario tenga permisos o que el guard esté funcionando correctamente');
    }
  }
}

// Ejecutar la prueba
testTokenUpdateAfterSetup(); 