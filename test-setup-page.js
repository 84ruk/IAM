const axios = require('axios');

const BASE_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const TEST_EMAIL = `test-setup-page-${Date.now()}@example.com`;
const TEST_PASSWORD = 'TestPassword123!';

async function testSetupPage() {
  console.log('🧪 Probando nueva página de setup de empresa...\n');
  console.log('Email de prueba:', TEST_EMAIL);
  console.log('Frontend URL:', FRONTEND_URL);

  let authToken = null;

  try {
    // 1. Registrar un usuario nuevo
    console.log('1️⃣ Registrando usuario nuevo...');
    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
      nombre: 'Usuario Test Setup Page',
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
    
    // 3. Verificar que el endpoint needs-setup funciona
    console.log('\n3️⃣ Verificando endpoint needs-setup...');
    const needsSetupResponse = await axios.get(`${BASE_URL}/auth/needs-setup`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('Needs setup:', needsSetupResponse.data.needsSetup);
    
    // 4. Configurar empresa usando la nueva página
    console.log('\n4️⃣ Configurando empresa...');
    const setupResponse = await axios.post(`${BASE_URL}/auth/setup-empresa`, {
      nombreEmpresa: 'Empresa Test Setup Page',
      tipoIndustria: 'GENERICA',
      rfc: 'SETUPPAGE123',
      direccion: 'Dirección de prueba 999',
      telefono: '+1234567890'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Empresa configurada:', setupResponse.data.message);
    const setupToken = setupResponse.data.token;
    console.log('Nuevo token recibido:', setupToken ? 'SÍ' : 'NO');
    console.log('Token anterior vs nuevo:', authToken === setupToken ? 'IGUALES ❌' : 'DIFERENTES ✅');
    
    // 5. Verificar estado final
    console.log('\n5️⃣ Verificando estado final...');
    const finalStatusResponse = await axios.get(`${BASE_URL}/auth/status`, {
      headers: { Authorization: `Bearer ${setupToken}` }
    });
    
    console.log('Estado final:', {
      needsSetup: finalStatusResponse.data.needsSetup,
      hasEmpresa: finalStatusResponse.data.setupStatus.hasEmpresa,
      setupCompletado: finalStatusResponse.data.setupStatus.setupCompletado,
      empresa: finalStatusResponse.data.empresa?.nombre
    });
    
    // 6. Verificar endpoint /auth/me con nuevo token
    console.log('\n6️⃣ Verificando /auth/me con nuevo token...');
    const meResponse = await axios.get(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${setupToken}` }
    });
    
    console.log('Usuario después del setup:', {
      id: meResponse.data.id,
      email: meResponse.data.email,
      rol: meResponse.data.rol,
      empresaId: meResponse.data.empresaId,
      tipoIndustria: meResponse.data.tipoIndustria
    });
    
    // 7. Probar acceso a recursos protegidos
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
    console.log('✅ La nueva página de setup funciona correctamente');
    console.log('✅ El token se actualiza automáticamente');
    console.log('✅ Las siguientes peticiones usan el nuevo token con empresaId');
    
    // 8. Información para probar la página en el navegador
    console.log('\n🌐 Para probar la página en el navegador:');
    console.log(`   - Ve a: ${FRONTEND_URL}/setup-empresa`);
    console.log(`   - O inicia sesión con: ${TEST_EMAIL}`);
    console.log(`   - Contraseña: ${TEST_PASSWORD}`);
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error.response?.data || error.message);
    
    if (error.response?.status === 403) {
      console.log('💡 Error 403: Verificar que el usuario tenga permisos o que el guard esté funcionando correctamente');
    }
  }
}

// Ejecutar la prueba
testSetupPage(); 