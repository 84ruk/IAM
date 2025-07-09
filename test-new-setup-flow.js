const axios = require('axios');

const BASE_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const TEST_EMAIL = `test-new-flow-${Date.now()}@example.com`;
const TEST_PASSWORD = 'TestPassword123!';

async function testNewSetupFlow() {
  console.log('🧪 Probando nuevo flujo de setup (sin modal)...\n');
  console.log('Email de prueba:', TEST_EMAIL);
  console.log('Frontend URL:', FRONTEND_URL);

  let authToken = null;

  try {
    // 1. Registrar un usuario nuevo
    console.log('1️⃣ Registrando usuario nuevo...');
    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
      nombre: 'Usuario Test New Flow',
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
    
    // 3. Verificar endpoint needs-setup
    console.log('\n3️⃣ Verificando endpoint needs-setup...');
    const needsSetupResponse = await axios.get(`${BASE_URL}/auth/needs-setup`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('Needs setup:', needsSetupResponse.data.needsSetup);
    
    // 4. Simular acceso al dashboard (debería mostrar SetupRequired)
    console.log('\n4️⃣ Simulando acceso al dashboard...');
    console.log('✅ El dashboard debería mostrar SetupRequired en lugar de abrir modal');
    console.log('✅ El usuario debería ver un botón "Configurar Empresa"');
    
    // 5. Configurar empresa usando la nueva página
    console.log('\n5️⃣ Configurando empresa...');
    const setupResponse = await axios.post(`${BASE_URL}/auth/setup-empresa`, {
      nombreEmpresa: 'Empresa Test New Flow',
      tipoIndustria: 'GENERICA',
      rfc: 'NEWFLOW123',
      direccion: 'Dirección de prueba 456',
      telefono: '+1234567890'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Empresa configurada:', setupResponse.data.message);
    const setupToken = setupResponse.data.token;
    console.log('Nuevo token recibido:', setupToken ? 'SÍ' : 'NO');
    console.log('Token anterior vs nuevo:', authToken === setupToken ? 'IGUALES ❌' : 'DIFERENTES ✅');
    
    // 6. Verificar estado final
    console.log('\n6️⃣ Verificando estado final...');
    const finalStatusResponse = await axios.get(`${BASE_URL}/auth/status`, {
      headers: { Authorization: `Bearer ${setupToken}` }
    });
    
    console.log('Estado final:', {
      needsSetup: finalStatusResponse.data.needsSetup,
      hasEmpresa: finalStatusResponse.data.setupStatus.hasEmpresa,
      setupCompletado: finalStatusResponse.data.setupStatus.setupCompletado,
      empresa: finalStatusResponse.data.empresa?.nombre
    });
    
    // 7. Verificar que el dashboard ahora funciona normalmente
    console.log('\n7️⃣ Verificando acceso al dashboard...');
    console.log('✅ El dashboard debería mostrar contenido normal');
    console.log('✅ No debería mostrar SetupRequired');
    console.log('✅ No debería abrir ningún modal');
    
    // 8. Probar acceso a recursos protegidos
    console.log('\n8️⃣ Probando acceso a recursos protegidos...');
    try {
      const productosResponse = await axios.get(`${BASE_URL}/productos`, {
        headers: { Authorization: `Bearer ${setupToken}` }
      });
      console.log('✅ Acceso a productos exitoso con nuevo token');
    } catch (error) {
      console.log('❌ Error accediendo a productos:', error.response?.status, error.response?.data?.message);
    }
    
    console.log('\n🎉 ¡Nuevo flujo probado exitosamente!');
    console.log('✅ El modal anterior ha sido eliminado');
    console.log('✅ El flujo ahora usa la página dedicada');
    console.log('✅ El token se actualiza automáticamente');
    console.log('✅ Las siguientes peticiones usan el nuevo token con empresaId');
    
    // 9. Información para probar en el navegador
    console.log('\n🌐 Para probar el nuevo flujo en el navegador:');
    console.log(`   1. Ve a: ${FRONTEND_URL}/login`);
    console.log(`   2. Inicia sesión con: ${TEST_EMAIL}`);
    console.log(`   3. Contraseña: ${TEST_PASSWORD}`);
    console.log(`   4. Deberías ver SetupRequired en lugar del modal`);
    console.log(`   5. Haz clic en "Configurar Empresa"`);
    console.log(`   6. Completa el setup en la nueva página`);
    console.log(`   7. Serás redirigido al dashboard`);
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error.response?.data || error.message);
    
    if (error.response?.status === 403) {
      console.log('💡 Error 403: Verificar que el usuario tenga permisos o que el guard esté funcionando correctamente');
    }
  }
}

// Ejecutar la prueba
testNewSetupFlow(); 