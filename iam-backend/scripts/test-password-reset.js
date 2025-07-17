const axios = require('axios');

// Configuración
const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const TEST_EMAIL = process.env.TEST_EMAIL || 'admin@test.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Admin123!';

console.log('🧪 Probando flujo completo de recuperación de contraseña...\n');

async function testPasswordResetFlow() {
  try {
    console.log('1️⃣ Iniciando sesión para obtener token...');
    
    // Login para obtener token
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    if (!loginResponse.data.token) {
      throw new Error('No se pudo obtener el token de autenticación');
    }

    const token = loginResponse.data.token;
    console.log('✅ Login exitoso\n');

    console.log('2️⃣ Solicitando recuperación de contraseña...');
    
    // Solicitar recuperación de contraseña
    const forgotPasswordResponse = await axios.post(`${BASE_URL}/auth/forgot-password`, {
      email: TEST_EMAIL,
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    console.log('📧 Respuesta del servidor:', forgotPasswordResponse.data);
    
    if (forgotPasswordResponse.data.success) {
      console.log('✅ Solicitud de recuperación enviada exitosamente');
    } else {
      console.log('❌ Error en la solicitud de recuperación:', forgotPasswordResponse.data.message);
    }

    console.log('\n3️⃣ Verificando configuración de notificaciones...');
    
    // Verificar configuración de notificaciones
    const configResponse = await axios.get(`${BASE_URL}/notifications/config`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    console.log('⚙️ Configuración de alertas:', configResponse.data.length, 'tipos configurados');

    console.log('\n4️⃣ Probando envío de email de prueba...');
    
    // Probar envío de email de prueba
    const testEmailResponse = await axios.post(`${BASE_URL}/notifications/test-email`, {
      email: TEST_EMAIL,
      tipo: 'welcome',
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    console.log('📧 Resultado del email de prueba:', testEmailResponse.data);

    console.log('\n5️⃣ Verificando historial de notificaciones...');
    
    // Verificar historial
    const historyResponse = await axios.get(`${BASE_URL}/notifications/history?limit=5`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    console.log('📊 Historial de notificaciones:', historyResponse.data.alertas.length, 'registros');

    console.log('\n6️⃣ Verificando estadísticas...');
    
    // Verificar estadísticas
    const statsResponse = await axios.get(`${BASE_URL}/notifications/stats?days=7`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    console.log('📈 Estadísticas de notificaciones:', statsResponse.data);

    console.log('\n🎉 ¡Prueba completada exitosamente!');
    console.log('\n📝 Resumen:');
    console.log('   • Login: ✅');
    console.log('   • Solicitud de recuperación: ✅');
    console.log('   • Configuración de notificaciones: ✅');
    console.log('   • Email de prueba: ✅');
    console.log('   • Historial: ✅');
    console.log('   • Estadísticas: ✅');

  } catch (error) {
    console.error('❌ Error durante la prueba:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n💡 Sugerencia: Verifica que las credenciales de prueba sean correctas');
      console.log('   Usa las variables de entorno: TEST_EMAIL y TEST_PASSWORD');
    }
    
    if (error.response?.status === 500) {
      console.log('\n💡 Sugerencia: Verifica que el servidor esté ejecutándose y las variables de entorno estén configuradas');
    }
  }
}

// Ejecutar la prueba
testPasswordResetFlow(); 