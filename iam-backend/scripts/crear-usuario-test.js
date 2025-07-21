#!/usr/bin/env node

const axios = require('axios');

const CONFIG = {
  BASE_URL: process.env.API_URL || 'http://localhost:3001',
  EMAIL: 'test@importacion.com',
  PASSWORD: 'Test123456@#$%&*',
  NOMBRE: 'Usuario Test',
};

async function crearUsuarioTest() {
  console.log('👤 Creando usuario de prueba...\n');
  
  try {
    // 1. Registrar usuario
    console.log('1. Registrando usuario...');
    const registroResponse = await axios.post(`${CONFIG.BASE_URL}/auth/register`, {
      email: CONFIG.EMAIL,
      password: CONFIG.PASSWORD,
      nombre: CONFIG.NOMBRE,
    });

    console.log('✅ Usuario registrado exitosamente');
    console.log('Usuario ID:', registroResponse.data.user.id);
    console.log('Empresa ID:', registroResponse.data.user.empresaId);

    // 2. Hacer login para obtener token
    console.log('\n2. Obteniendo token...');
    const loginResponse = await axios.post(`${CONFIG.BASE_URL}/auth/login`, {
      email: CONFIG.EMAIL,
      password: CONFIG.PASSWORD,
    });

    if (loginResponse.data && loginResponse.data.access_token) {
      console.log('✅ Token obtenido exitosamente');
      console.log(`Token: ${loginResponse.data.access_token}`);
      console.log(`\n📋 Configuración para testing:`);
      console.log(`export TEST_TOKEN="${loginResponse.data.access_token}"`);
      console.log(`export API_URL="${CONFIG.BASE_URL}"`);
      console.log(`\n🚀 Comando completo:`);
      console.log(`TEST_TOKEN="${loginResponse.data.access_token}" API_URL="${CONFIG.BASE_URL}" node scripts/test-importacion.js`);
      
      return {
        token: loginResponse.data.access_token,
        user: registroResponse.data.user,
      };
    }
  } catch (error) {
    console.log('❌ Error creando usuario de prueba:');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
      
      // Si el usuario ya existe, intentar hacer login
      if (error.response.status === 409) {
        console.log('\n🔄 Usuario ya existe, intentando login...');
        try {
          const loginResponse = await axios.post(`${CONFIG.BASE_URL}/auth/login`, {
            email: CONFIG.EMAIL,
            password: CONFIG.PASSWORD,
          });

          if (loginResponse.data && loginResponse.data.access_token) {
            console.log('✅ Login exitoso con usuario existente');
            console.log(`Token: ${loginResponse.data.access_token}`);
            console.log(`\n📋 Configuración para testing:`);
            console.log(`export TEST_TOKEN="${loginResponse.data.access_token}"`);
            console.log(`export API_URL="${CONFIG.BASE_URL}"`);
            console.log(`\n🚀 Comando completo:`);
            console.log(`TEST_TOKEN="${loginResponse.data.access_token}" API_URL="${CONFIG.BASE_URL}" node scripts/test-importacion.js`);
            
            return {
              token: loginResponse.data.access_token,
              user: { email: CONFIG.EMAIL },
            };
          }
        } catch (loginError) {
          console.log('❌ Error en login:', loginError.response?.data || loginError.message);
        }
      }
    } else {
      console.log('Error:', error.message);
    }
    
    console.log('\n💡 Sugerencias:');
    console.log('1. Verifica que el servidor esté corriendo');
    console.log('2. Verifica que la base de datos esté configurada');
    console.log('3. Verifica que las migraciones estén ejecutadas');
    
    return null;
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  crearUsuarioTest().catch(console.error);
}

module.exports = { crearUsuarioTest }; 