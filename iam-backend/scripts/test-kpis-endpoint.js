const axios = require('axios');

// Configuración
const API_BASE_URL = 'http://localhost:3001';
const TEST_EMAIL = 'baruk066@gmail.com';
const TEST_PASSWORD = 'password123'; // Ajusta según tu contraseña

async function testKPIsEndpoint() {
  console.log('🧪 PROBANDO ENDPOINT DE KPIs');
  console.log('============================\n');

  try {
    // 1. Login para obtener cookies
    console.log('1. Iniciando sesión...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    }, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Login exitoso');
    console.log('Usuario:', loginResponse.data.user?.nombre);
    console.log('Empresa ID:', loginResponse.data.user?.empresaId);
    console.log('Rol:', loginResponse.data.user?.rol);

    // 2. Probar endpoint de KPIs
    console.log('\n2. Probando endpoint de KPIs...');
    const kpisResponse = await axios.get(`${API_BASE_URL}/dashboard-cqrs/kpis`, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ KPIs obtenidos exitosamente');
    console.log('Respuesta:', JSON.stringify(kpisResponse.data, null, 2));

    // 3. Probar endpoint de KPIs financieros
    console.log('\n3. Probando endpoint de KPIs financieros...');
    const financialResponse = await axios.get(`${API_BASE_URL}/dashboard-cqrs/financial-kpis`, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ KPIs financieros obtenidos exitosamente');
    console.log('Respuesta:', JSON.stringify(financialResponse.data, null, 2));

    // 4. Probar endpoint unificado
    console.log('\n4. Probando endpoint unificado de KPIs...');
    const allKPIsResponse = await axios.get(`${API_BASE_URL}/dashboard-cqrs/all-kpis`, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Todos los KPIs obtenidos exitosamente');
    console.log('Respuesta:', JSON.stringify(allKPIsResponse.data, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      console.error('Headers:', error.response.headers);
    }
  }
}

testKPIsEndpoint(); 