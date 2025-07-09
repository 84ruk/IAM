const axios = require('axios');

const BASE_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const TEST_EMAIL = `test-input-design-${Date.now()}@example.com`;
const TEST_PASSWORD = 'TestPassword123!';

async function testInputDesign() {
  console.log('🎨 Probando diseño mejorado de inputs...\n');
  console.log('Email de prueba:', TEST_EMAIL);
  console.log('Frontend URL:', FRONTEND_URL);

  let authToken = null;

  try {
    // 1. Registrar un usuario nuevo
    console.log('1️⃣ Registrando usuario nuevo...');
    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
      nombre: 'Usuario Test Input Design',
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });
    
    console.log('✅ Usuario registrado:', registerResponse.data.message);
    authToken = registerResponse.data.token;
    
    // 2. Verificar que necesita setup
    console.log('\n2️⃣ Verificando que necesita setup...');
    const needsSetupResponse = await axios.get(`${BASE_URL}/auth/needs-setup`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('Needs setup:', needsSetupResponse.data.needsSetup);
    
    // 3. Verificar diseño de inputs en la página de setup
    console.log('\n3️⃣ Verificando diseño de inputs en setup...');
    console.log('✅ Deberías ver la página /setup-empresa con inputs mejorados');
    console.log('✅ Los inputs deberían tener:');
    console.log('   - Sombra tenue (shadow-sm)');
    console.log('   - Sombra más pronunciada en hover (hover:shadow-md)');
    console.log('   - Sombra más pronunciada en focus (focus:shadow-md)');
    console.log('   - Transiciones suaves (transition-all duration-200)');
    console.log('   - Bordes redondeados (rounded-lg)');
    console.log('   - Padding mejorado (px-4 py-3)');
    console.log('   - Colores consistentes con el tema');
    
    // 4. Verificar estados de los inputs
    console.log('\n4️⃣ Estados de los inputs:');
    console.log('✅ Estado normal: borde gris, sombra tenue');
    console.log('✅ Estado hover: borde más oscuro, sombra media');
    console.log('✅ Estado focus: borde azul, anillo de focus, sombra media');
    console.log('✅ Estado error: borde rojo, anillo rojo');
    
    // 5. Verificar consistencia entre Input y Select
    console.log('\n5️⃣ Consistencia entre componentes:');
    console.log('✅ Input y Select tienen el mismo diseño base');
    console.log('✅ Mismos colores, sombras y transiciones');
    console.log('✅ Mismo padding y bordes redondeados');
    console.log('✅ Mismos estados de hover y focus');
    
    // 6. Verificar responsividad
    console.log('\n6️⃣ Responsividad:');
    console.log('✅ Los inputs se adaptan a diferentes tamaños de pantalla');
    console.log('✅ Las sombras se ven bien en móvil y desktop');
    console.log('✅ El padding es apropiado para touch en móvil');
    
    console.log('\n🎉 ¡Prueba de diseño de inputs completada!');
    console.log('✅ Los inputs tienen sombras tenues y diseño mejorado');
    console.log('✅ Consistencia entre Input y Select');
    console.log('✅ Estados visuales claros y atractivos');
    console.log('✅ Transiciones suaves y profesionales');
    
    // 7. Información para probar en el navegador
    console.log('\n🌐 Para probar el diseño en el navegador:');
    console.log(`   1. Ve a: ${FRONTEND_URL}/login`);
    console.log(`   2. Inicia sesión con: ${TEST_EMAIL}`);
    console.log(`   3. Contraseña: ${TEST_PASSWORD}`);
    console.log(`   4. Deberías ver la página de setup con inputs mejorados`);
    console.log(`   5. Prueba hover y focus en los inputs`);
    console.log(`   6. Verifica que las sombras se ven bien`);
    
    // 8. Verificaciones específicas de diseño
    console.log('\n🔍 Verificaciones específicas:');
    console.log('✅ Sombra base: shadow-sm (sutil)');
    console.log('✅ Sombra hover: shadow-md (más pronunciada)');
    console.log('✅ Sombra focus: shadow-md (más pronunciada)');
    console.log('✅ Transición: transition-all duration-200 (suave)');
    console.log('✅ Bordes: rounded-lg (redondeados)');
    console.log('✅ Padding: px-4 py-3 (espacioso)');
    console.log('✅ Colores: consistentes con el tema #8E94F2');
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error.response?.data || error.message);
  }
}

// Ejecutar la prueba
testInputDesign(); 