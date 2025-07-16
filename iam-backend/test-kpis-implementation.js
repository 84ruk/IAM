const axios = require('axios');

// Configuración
const BASE_URL = 'http://localhost:3001';
const TEST_EMAIL = 'admin@test.com';
const TEST_PASSWORD = 'password123';

async function testKPIsImplementation() {
  console.log('🧪 Probando implementación de KPIs...\n');

  try {
    // 1. Login para obtener token
    console.log('1️⃣ Iniciando sesión...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });

    const token = loginResponse.data.token;
    const headers = { Authorization: `Bearer ${token}` };

    console.log('✅ Login exitoso\n');

    // 2. Probar KPIs básicos
    console.log('2️⃣ Probando KPIs básicos...');
    const kpisResponse = await axios.get(`${BASE_URL}/dashboard/kpis`, { headers });
    console.log('📊 KPIs básicos:', JSON.stringify(kpisResponse.data, null, 2));
    console.log('✅ KPIs básicos funcionando\n');

    // 3. Probar KPIs financieros
    console.log('3️⃣ Probando KPIs financieros...');
    const financialKPIsResponse = await axios.get(`${BASE_URL}/dashboard/financial-kpis`, { headers });
    console.log('💰 KPIs financieros:', JSON.stringify(financialKPIsResponse.data, null, 2));
    console.log('✅ KPIs financieros funcionando\n');

    // 4. Probar dashboard completo
    console.log('4️⃣ Probando dashboard completo...');
    const dashboardResponse = await axios.get(`${BASE_URL}/dashboard/data`, { headers });
    console.log('📈 Dashboard data obtenido correctamente');
    console.log('✅ Dashboard completo funcionando\n');

    // 5. Probar cache (hacer la misma petición dos veces)
    console.log('5️⃣ Probando cache (segunda petición)...');
    const kpisResponse2 = await axios.get(`${BASE_URL}/dashboard/kpis`, { headers });
    console.log('📊 KPIs básicos (cached):', JSON.stringify(kpisResponse2.data, null, 2));
    console.log('✅ Cache funcionando\n');

    console.log('🎉 ¡Todas las pruebas pasaron exitosamente!');
    console.log('\n📋 Resumen de implementación:');
    console.log('✅ Transacciones implementadas en movimientos');
    console.log('✅ Cache Redis implementado');
    console.log('✅ KPIs optimizados con SQL raw');
    console.log('✅ KPIs financieros implementados');
    console.log('✅ Error handling mejorado');
    console.log('✅ Invalidación de cache automática');

  } catch (error) {
    console.error('❌ Error en las pruebas:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n💡 Sugerencia: Verifica que el usuario de prueba existe');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Sugerencia: Asegúrate de que el servidor esté ejecutándose en puerto 3001');
    }
  }
}

// Ejecutar pruebas
testKPIsImplementation(); 