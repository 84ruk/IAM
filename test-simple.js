const axios = require('axios');

const BASE_URL = 'http://localhost:3001';
const TEST_EMAIL = `test-simple-${Date.now()}@example.com`;
const TEST_PASSWORD = 'Password123!';

async function testSimple() {
  console.log('🧪 Probando registro y login simple...\n');
  console.log('Email de prueba:', TEST_EMAIL);

  try {
    // 1. Registrar un usuario nuevo
    console.log('1️⃣ Registrando usuario nuevo...');
    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
      nombre: 'Usuario Test Simple',
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });
    
    console.log('✅ Usuario registrado:', registerResponse.data.message);
    const token = registerResponse.data.token;
    console.log('Token obtenido:', token ? 'SÍ' : 'NO');
    
    // 2. Verificar endpoint needs-setup
    console.log('\n2️⃣ Verificando endpoint needs-setup...');
    const needsSetupResponse = await axios.get(`${BASE_URL}/auth/needs-setup`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('Needs setup:', needsSetupResponse.data.needsSetup);
    
    // 3. Verificar endpoint /auth/me
    console.log('\n3️⃣ Verificando endpoint /auth/me...');
    const meResponse = await axios.get(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('Usuario actual:', {
      id: meResponse.data.id,
      email: meResponse.data.email,
      rol: meResponse.data.rol,
      empresaId: meResponse.data.empresaId
    });
    
    // 4. Configurar empresa
    console.log('\n4️⃣ Configurando empresa...');
    const setupResponse = await axios.post(`${BASE_URL}/auth/setup-empresa`, {
      nombreEmpresa: 'Empresa Test Simple',
      tipoIndustria: 'GENERICA',
      rfc: 'TESTSIMPLE123',
      direccion: 'Dirección de prueba 456'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Empresa configurada:', setupResponse.data.message);
    const newToken = setupResponse.data.token;
    
    // 5. Verificar estado después del setup
    console.log('\n5️⃣ Verificando estado después del setup...');
    const finalNeedsSetup = await axios.get(`${BASE_URL}/auth/needs-setup`, {
      headers: { Authorization: `Bearer ${newToken}` }
    });
    
    console.log('Needs setup final:', finalNeedsSetup.data.needsSetup);
    
    // 6. Probar acceso a /proveedores
    console.log('\n6️⃣ Probando acceso a /proveedores...');
    try {
      const proveedoresResponse = await axios.get(`${BASE_URL}/proveedores`, {
        headers: { Authorization: `Bearer ${newToken}` }
      });
      console.log('✅ Acceso a proveedores OK. Resultado:', proveedoresResponse.data);
    } catch (err) {
      if (err.response?.status === 403) {
        console.error('❌ Acceso denegado a /proveedores:', err.response.data.message);
      } else {
        console.error('Error al acceder a /proveedores:', err.response?.data || err.message);
      }
    }
    
    console.log('\n🎉 ¡Prueba completada exitosamente!');
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error.response?.data || error.message);
  }
}

testSimple(); 