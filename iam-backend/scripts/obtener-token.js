#!/usr/bin/env node

const axios = require('axios');

const CONFIG = {
  BASE_URL: process.env.API_URL || 'http://localhost:3001',
  EMAIL: process.env.TEST_EMAIL || 'admin@test.com',
  PASSWORD: process.env.TEST_PASSWORD || 'admin123',
};

async function obtenerToken() {
  console.log('🔑 Obteniendo token JWT para testing...\n');
  
  try {
    const response = await axios.post(`${CONFIG.BASE_URL}/auth/login`, {
      email: CONFIG.EMAIL,
      password: CONFIG.PASSWORD,
    });

    if (response.data && response.data.access_token) {
      console.log('✅ Token obtenido exitosamente');
      console.log(`Token: ${response.data.access_token}`);
      console.log(`\nPara usar en testing:`);
      console.log(`export TEST_TOKEN="${response.data.access_token}"`);
      console.log(`\nO ejecutar:`);
      console.log(`TEST_TOKEN="${response.data.access_token}" node scripts/test-importacion.js`);
      
      return response.data.access_token;
    } else {
      console.log('❌ No se pudo obtener el token');
      console.log('Respuesta:', response.data);
      return null;
    }
  } catch (error) {
    console.log('❌ Error obteniendo token:');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
    } else {
      console.log('Error:', error.message);
    }
    
    console.log('\n💡 Sugerencias:');
    console.log('1. Verifica que el servidor esté corriendo');
    console.log('2. Verifica las credenciales de prueba');
    console.log('3. Asegúrate de que el usuario exista en la base de datos');
    
    return null;
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  obtenerToken().catch(console.error);
}

module.exports = { obtenerToken }; 