const axios = require('axios');

async function testEndpoint() {
  console.log('🧪 Probando endpoint de daily-movements...\n');

  try {
    // 1. Login
    console.log('1️⃣ Haciendo login...');
    const loginResponse = await axios.post('http://localhost:3001/auth/login', {
      email: 'prueba@iam.com',
      password: 'PruebaIAM123'
    });

    console.log('✅ Login exitoso');
    console.log('Refresh Token:', loginResponse.data.refreshToken);

    // 2. Obtener access token usando refresh token
    console.log('\n2️⃣ Obteniendo access token...');
    const tokenResponse = await axios.post('http://localhost:3001/auth/refresh', {
      refreshToken: loginResponse.data.refreshToken
    });

    console.log('✅ Access token obtenido');

    // 3. Probar endpoint
    console.log('\n3️⃣ Probando endpoint daily-movements...');
    const response = await axios.get('http://localhost:3001/dashboard-cqrs/daily-movements?days=7&forceRefresh=true', {
      headers: {
        'Authorization': `Bearer ${tokenResponse.data.access_token}`
      }
    });

    console.log('✅ Respuesta del endpoint:');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    }
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testEndpoint();
}

module.exports = { testEndpoint }; 