const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

// Crear una instancia de axios con configuración de cookies
const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  }
});

async function testWithCookies() {
  try {
    console.log('🔍 Probando login con cookies...');
    
    const loginResponse = await api.post('/auth/login', {
      email: 'test-security@example.com',
      password: 'TestPassword123!'
    });
    
    console.log('✅ Login exitoso');
    console.log('Response data:', JSON.stringify(loginResponse.data, null, 2));
    console.log('Cookies recibidas:', loginResponse.headers['set-cookie']);
    
    console.log('\n🔍 Probando acceso con cookies...');
    
    const profileResponse = await api.get('/users/profile');
    
    console.log('✅ Acceso con cookies exitoso');
    console.log('Profile data:', JSON.stringify(profileResponse.data, null, 2));
    
    console.log('\n🔍 Probando 2FA setup...');
    
    const twoFactorResponse = await api.post('/auth/2fa/setup', {
      userId: 1
    });
    
    console.log('✅ 2FA setup exitoso');
    console.log('2FA data:', JSON.stringify(twoFactorResponse.data, null, 2));
    
  } catch (error) {
    console.log('❌ Error:', error.response?.status);
    console.log('Error data:', JSON.stringify(error.response?.data, null, 2));
  }
}

testWithCookies(); 