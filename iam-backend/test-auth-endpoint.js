const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testAuthEndpoint() {
  console.log('🧪 Probando endpoint de autenticación...\n');

  try {
    // Usar el token JWT válido
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NTQ5MzAzOTcsImp0aSI6ImVkNGZkNDljLTMxYjktNGZhNy04MTllLTRlMzIwNDEzYjdhZCIsInN1YiI6IjIiLCJlbWFpbCI6ImJhcnVrMDY2QGdtYWlsLmNvbSIsInJvbCI6IkFETUlOIiwiZW1wcmVzYUlkIjoyLCJ0aXBvSW5kdXN0cmlhIjoiR0VORVJJQ0EiLCJhdXRoUHJvdmlkZXIiOiJnb29nbGUiLCJleHAiOjE3NTUwMTY3OTcsImF1ZCI6Imh0dHA6Ly9sb2NhbGhvc3Q6MzAwMSIsImlzcyI6Imh0dHA6Ly9sb2NhbGhvc3Q6MzAwMSJ9.asAe5308G62JhQs6_aGT1jgML_BLd8gnh-OH21RX6ww';

    // 1. Probar endpoint /auth/me
    console.log('1️⃣ Probando /auth/me...');
    try {
      const meResponse = await axios.get(`${BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ /auth/me:', meResponse.data);
    } catch (error) {
      console.log('❌ /auth/me:', error.response?.data || error.message);
    }

    // 2. Probar endpoint /auth/needs-setup
    console.log('\n2️⃣ Probando /auth/needs-setup...');
    try {
      const setupResponse = await axios.get(`${BASE_URL}/auth/needs-setup`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ /auth/needs-setup:', setupResponse.data);
    } catch (error) {
      console.log('❌ /auth/needs-setup:', error.response?.data || error.message);
    }

    // 3. Probar endpoint /auth/setup-empresa (debería fallar porque ya tiene setup)
    console.log('\n3️⃣ Probando /auth/setup-empresa (debería fallar)...');
    try {
      const setupEmpresaResponse = await axios.post(`${BASE_URL}/auth/setup-empresa`, {
        nombreEmpresa: 'Empresa Test',
        tipoIndustria: 'GENERICA',
        direccion: 'Dirección Test'
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ /auth/setup-empresa:', setupEmpresaResponse.data);
    } catch (error) {
      console.log('❌ /auth/setup-empresa (esperado):', error.response?.data?.message || error.message);
    }

  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

// Ejecutar test
testAuthEndpoint();
