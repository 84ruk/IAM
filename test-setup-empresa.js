const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testSetupEmpresa() {
  console.log('🧪 Probando setup de empresa sin RFC...\n');
  
  try {
    // 1. Registrar un usuario nuevo
    console.log('1️⃣ Registrando usuario...');
    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
      nombre: 'Usuario Test Setup',
      email: `test-setup-${Date.now()}@example.com`,
      password: 'Test123!'
    });
    
    const { token } = registerResponse.data;
    console.log('✅ Usuario registrado exitosamente');
    
    // 2. Verificar que necesita setup
    console.log('\n2️⃣ Verificando necesidad de setup...');
    const needsSetupResponse = await axios.get(`${BASE_URL}/auth/needs-setup`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Necesita setup:', needsSetupResponse.data.needsSetup);
    
    // 3. Configurar empresa sin RFC
    console.log('\n3️⃣ Configurando empresa sin RFC...');
    const setupResponse = await axios.post(`${BASE_URL}/auth/setup-empresa`, {
      nombreEmpresa: 'Empresa Test Sin RFC',
      tipoIndustria: 'GENERICA',
      direccion: 'Dirección de prueba'
      // No incluir RFC
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Empresa configurada exitosamente');
    console.log('📋 Datos de la empresa:', {
      id: setupResponse.data.empresa.id,
      nombre: setupResponse.data.empresa.nombre,
      tipoIndustria: setupResponse.data.empresa.tipoIndustria,
      rfc: setupResponse.data.empresa.rfc || 'No proporcionado'
    });
    
    // 4. Verificar que ya no necesita setup
    console.log('\n4️⃣ Verificando que ya no necesita setup...');
    const finalCheckResponse = await axios.get(`${BASE_URL}/auth/needs-setup`, {
      headers: { Authorization: `Bearer ${setupResponse.data.token}` }
    });
    
    console.log('✅ Ya no necesita setup:', finalCheckResponse.data.needsSetup);
    
    console.log('\n🎉 ¡Prueba completada exitosamente!');
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error.response?.data || error.message);
    
    if (error.response?.data?.message) {
      console.error('📋 Detalles del error:', error.response.data);
    }
  }
}

// Ejecutar la prueba
testSetupEmpresa().catch(console.error); 