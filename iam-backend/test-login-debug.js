const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testLogin() {
  try {
    console.log('🔍 Probando login...');
    
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'test-security@example.com',
      password: 'TestPassword123!'
    });
    
    console.log('✅ Login exitoso');
    console.log('Response status:', loginResponse.status);
    console.log('Response data:', JSON.stringify(loginResponse.data, null, 2));
    
    const authToken = loginResponse.data.access_token;
    const refreshToken = loginResponse.data.refresh_token;
    
    console.log('\n🔍 Probando acceso con token...');
    
    const profileResponse = await axios.get(`${BASE_URL}/users/profile`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Acceso con token exitoso');
    console.log('Profile data:', JSON.stringify(profileResponse.data, null, 2));
    
    return { authToken, refreshToken };
  } catch (error) {
    console.log('❌ Error en login:', error.response?.status);
    console.log('Error data:', JSON.stringify(error.response?.data, null, 2));
    return null;
  }
}

testLogin(); 