// Script para obtener un nuevo token de acceso
const axios = require('axios');

const LOGIN_URL = 'http://localhost:3001/auth/login';
const EMAIL = 'test@iam.com';
const PASSWORD = 'PruebaIAM123?';

async function obtenerToken() {
  try {
    console.log('🔐 Obteniendo nuevo token de acceso...');
    
    const response = await axios.post(LOGIN_URL, {
      email: EMAIL,
      password: PASSWORD,
    });
    
    console.log('✅ Login exitoso');
    console.log('📋 Respuesta completa:', JSON.stringify(response.data, null, 2));
    
    // Verificar si hay access_token en la respuesta
    if (response.data.access_token) {
      console.log('\n🔧 Token encontrado:', response.data.access_token);
    } else {
      console.log('\n⚠️ No se encontró access_token en la respuesta');
      console.log('🔍 Verificando cookies...');
      
      // Verificar si el token está en las cookies
      if (response.headers['set-cookie']) {
        console.log('🍪 Cookies encontradas:', response.headers['set-cookie']);
      }
    }
    
    return response.data.access_token;
    
  } catch (error) {
    console.error('❌ Error obteniendo token:', error.message);
    if (error.response) {
      console.error('📋 Respuesta del servidor:', error.response.data);
    }
    return null;
  }
}

// Ejecutar
obtenerToken(); 