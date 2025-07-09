const axios = require('axios');

// Configuración
const BASE_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const TEST_EMAIL = `test-${Date.now()}@example.com`;
const TEST_PASSWORD = 'TestPassword123!';
const EMPRESA_NOMBRE = 'Empresa Test';
const EMPRESA_INDUSTRIA = 'ELECTRONICA';

let authToken = null;
let setupToken = null;

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testRegistroUsuario() {
  console.log('\n🔵 1. Registrando usuario...');
  
  try {
    const response = await axios.post(`${BASE_URL}/auth/register`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      nombre: 'Usuario Test'
    });
    
    authToken = response.data.token;
    console.log('✅ Usuario registrado exitosamente');
    if (authToken) {
      console.log(`   Token recibido: ${authToken.substring(0, 20)}...`);
    } else {
      console.log('⚠️  No se recibió token en la respuesta');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error en registro de usuario:', error.response?.data || error.message);
    return false;
  }
}

async function testNeedsSetupInicial() {
  console.log('\n🔵 2. Verificando needs-setup (debe ser true)...');
  
  try {
    const response = await axios.get(`${BASE_URL}/auth/needs-setup`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    const needsSetup = response.data.needsSetup;
    console.log(`   needs-setup: ${needsSetup}`);
    
    if (needsSetup === true) {
      console.log('✅ needs-setup es true como se esperaba');
      return true;
    } else {
      console.log('❌ needs-setup debería ser true pero es false');
      return false;
    }
  } catch (error) {
    console.error('❌ Error verificando needs-setup:', error.response?.data || error.message);
    return false;
  }
}

async function testSetupEmpresa() {
  console.log('\n🔵 3. Realizando setup de empresa...');
  
  try {
    const response = await axios.post(`${BASE_URL}/auth/setup-empresa`, {
      nombreEmpresa: EMPRESA_NOMBRE,
      tipoIndustria: EMPRESA_INDUSTRIA,
      direccion: 'Dirección Test 123',
      telefono: '+1234567890'
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    setupToken = response.data.token;
    console.log('✅ Setup de empresa completado exitosamente');
    if (setupToken) {
      console.log(`   Nuevo token recibido: ${setupToken.substring(0, 20)}...`);
    } else {
      console.log('⚠️  No se recibió token en la respuesta del setup');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error en setup de empresa:', error.response?.data || error.message);
    return false;
  }
}

async function testNeedsSetupFinal() {
  console.log('\n🔵 4. Verificando needs-setup con nuevo token (debe ser false)...');
  
  try {
    const response = await axios.get(`${BASE_URL}/auth/needs-setup`, {
      headers: {
        'Authorization': `Bearer ${setupToken}`
      }
    });
    
    const needsSetup = response.data.needsSetup;
    console.log(`   needs-setup: ${needsSetup}`);
    
    if (needsSetup === false) {
      console.log('✅ needs-setup es false como se esperaba');
      return true;
    } else {
      console.log('❌ needs-setup debería ser false pero es true');
      return false;
    }
  } catch (error) {
    console.error('❌ Error verificando needs-setup final:', error.response?.data || error.message);
    return false;
  }
}

async function testAccesoProveedores() {
  console.log('\n🔵 5. Accediendo a /proveedores...');
  
  try {
    const response = await axios.get(`${BASE_URL}/proveedores`, {
      headers: {
        'Authorization': `Bearer ${setupToken}`
      }
    });
    
    console.log('✅ Acceso a /proveedores exitoso');
    console.log(`   Proveedores encontrados: ${response.data.length}`);
    
    return true;
  } catch (error) {
    console.error('❌ Error accediendo a /proveedores:', error.response?.data || error.message);
    return false;
  }
}

async function testFlujoCompleto() {
  console.log('🚀 Iniciando prueba del flujo completo de registro y setup');
  console.log(`📧 Email de prueba: ${TEST_EMAIL}`);
  console.log(`🏢 Empresa: ${EMPRESA_NOMBRE} (${EMPRESA_INDUSTRIA})`);
  
  const resultados = [];
  
  // Paso 1: Registro de usuario
  resultados.push(await testRegistroUsuario());
  if (!resultados[0]) {
    console.log('\n❌ Falló el registro de usuario. Deteniendo pruebas.');
    return false;
  }
  
  await delay(1000); // Pequeña pausa entre requests
  
  // Paso 2: Verificar needs-setup inicial
  resultados.push(await testNeedsSetupInicial());
  if (!resultados[1]) {
    console.log('\n❌ Falló la verificación inicial de needs-setup. Deteniendo pruebas.');
    return false;
  }
  
  await delay(1000);
  
  // Paso 3: Setup de empresa
  resultados.push(await testSetupEmpresa());
  if (!resultados[2]) {
    console.log('\n❌ Falló el setup de empresa. Deteniendo pruebas.');
    return false;
  }
  
  await delay(1000);
  
  // Paso 4: Verificar needs-setup final
  resultados.push(await testNeedsSetupFinal());
  if (!resultados[3]) {
    console.log('\n❌ Falló la verificación final de needs-setup. Deteniendo pruebas.');
    return false;
  }
  
  await delay(1000);
  
  // Paso 5: Acceso a proveedores
  resultados.push(await testAccesoProveedores());
  
  // Resumen final
  console.log('\n📊 RESUMEN DE PRUEBAS:');
  console.log('1. Registro de usuario:', resultados[0] ? '✅' : '❌');
  console.log('2. needs-setup inicial (true):', resultados[1] ? '✅' : '❌');
  console.log('3. Setup de empresa:', resultados[2] ? '✅' : '❌');
  console.log('4. needs-setup final (false):', resultados[3] ? '✅' : '❌');
  console.log('5. Acceso a /proveedores:', resultados[4] ? '✅' : '❌');
  
  const exitoso = resultados.every(r => r);
  console.log(`\n${exitoso ? '🎉' : '💥'} FLUJO COMPLETO: ${exitoso ? 'EXITOSO' : 'FALLÓ'}`);
  
  return exitoso;
}

// Ejecutar la prueba
if (require.main === module) {
  testFlujoCompleto()
    .then(exitoso => {
      process.exit(exitoso ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Error inesperado:', error);
      process.exit(1);
    });
}

module.exports = { testFlujoCompleto }; 