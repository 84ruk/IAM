const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function createTestUser() {
  try {
    console.log('🔍 Creando usuario de prueba...');
    
    const userData = {
      email: 'test-security-new@example.com',
      password: 'TestPassword123!',
      nombre: 'Test Security User'
    };
    
    const response = await axios.post(`${BASE_URL}/auth/register`, userData);
    
    console.log('✅ Usuario creado exitosamente');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    return userData;
  } catch (error) {
    console.log('❌ Error creando usuario:', error.response?.status);
    console.log('Error data:', JSON.stringify(error.response?.data, null, 2));
    return null;
  }
}

createTestUser(); 