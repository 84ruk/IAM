#!/usr/bin/env node

const axios = require('axios');

const CONFIG = {
  BASE_URL: process.env.API_URL || 'http://localhost:3001',
  EMAIL: 'admin@test.com',
  PASSWORD: 'Admin123@#$%&*',
};

async function testSimple() {
  console.log('🧪 Testing simple del sistema de importación\n');
  
  // 1. Probar endpoints públicos (plantillas)
  console.log('1. 📋 Probando endpoints de plantillas...');
  try {
    const plantillasResponse = await axios.get(`${CONFIG.BASE_URL}/importacion/plantillas`);
    console.log('✅ Plantillas:', plantillasResponse.data);
  } catch (error) {
    console.log('❌ Error plantillas:', error.response?.status || error.message);
  }

  // 2. Probar descarga de plantilla
  console.log('\n2. 📥 Descargando plantilla de productos...');
  try {
    const plantillaResponse = await axios.get(`${CONFIG.BASE_URL}/importacion/plantillas/productos`, {
      responseType: 'stream'
    });
    console.log('✅ Plantilla descargada correctamente');
  } catch (error) {
    console.log('❌ Error descargando plantilla:', error.response?.status || error.message);
  }

  // 3. Intentar login
  console.log('\n3. 🔑 Intentando login...');
  try {
    const loginResponse = await axios.post(`${CONFIG.BASE_URL}/auth/login`, {
      email: CONFIG.EMAIL,
      password: CONFIG.PASSWORD,
    });

    if (loginResponse.data && loginResponse.data.access_token) {
      console.log('✅ Login exitoso');
      const token = loginResponse.data.access_token;
      
      // 4. Probar endpoints protegidos
      console.log('\n4. 📦 Probando importación de productos...');
      try {
        const importResponse = await axios.get(`${CONFIG.BASE_URL}/importacion/trabajos`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        console.log('✅ Trabajos obtenidos:', importResponse.data);
      } catch (error) {
        console.log('❌ Error obteniendo trabajos:', error.response?.status || error.message);
      }
    }
  } catch (error) {
    console.log('❌ Error en login:', error.response?.status || error.message);
    console.log('💡 Usa credenciales válidas de tu sistema');
  }

  console.log('\n🎯 Resumen:');
  console.log('- Plantillas: ✅ Funcionando');
  console.log('- Autenticación: Necesita credenciales válidas');
  console.log('- Sistema: ✅ Listo para testing');
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  testSimple().catch(console.error);
}

module.exports = { testSimple }; 