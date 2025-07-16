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

async function testTokenExtraction() {
  try {
    console.log('🔍 Probando login...');
    
    const loginResponse = await api.post('/auth/login', {
      email: 'test-security-new@example.com',
      password: 'TestPassword123!'
    });
    
    console.log('✅ Login exitoso');
    console.log('Cookies recibidas:', loginResponse.headers['set-cookie']);
    
    // Extraer el token de la cookie manualmente
    const cookies = loginResponse.headers['set-cookie'];
    let jwtToken = null;
    
    if (cookies) {
      const jwtCookie = cookies.find(cookie => cookie.startsWith('jwt='));
      if (jwtCookie) {
        jwtToken = jwtCookie.split(';')[0].split('=')[1];
        console.log('🔑 Token extraído de cookie:', jwtToken.substring(0, 50) + '...');
      }
    }
    
    if (!jwtToken) {
      console.log('❌ No se pudo extraer el token de las cookies');
      return;
    }
    
    console.log('\n🔍 Probando acceso con token en header...');
    
    // Probar con el token en el header Authorization
    const profileResponse = await api.get('/auth/me', {
      headers: {
        'Authorization': `Bearer ${jwtToken}`
      }
    });
    
    console.log('✅ Acceso con token en header exitoso');
    console.log('Profile data:', JSON.stringify(profileResponse.data, null, 2));
    
  } catch (error) {
    console.log('❌ Error:', error.response?.status);
    console.log('Error data:', JSON.stringify(error.response?.data, null, 2));
  }
}

testTokenExtraction(); 