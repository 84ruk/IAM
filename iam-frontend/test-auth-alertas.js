const axios = require('axios');

async function testAuthAlertas() {
  console.log('🔍 Probando autenticación y endpoint de alertas...\n');

  try {
    // 1. Verificar que el backend esté funcionando
    console.log('1️⃣ Verificando estado del backend...');
    const healthResponse = await axios.get('http://localhost:3001/health');
    console.log('✅ Backend funcionando:', healthResponse.data.status);
    console.log('');

    // 2. Probar endpoint sin autenticación (debería fallar)
    console.log('2️⃣ Probando endpoint sin autenticación...');
    try {
      await axios.get('http://localhost:3001/sensores/25/alertas/configuracion');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Endpoint protegido correctamente (401 Unauthorized)');
        console.log('   Mensaje:', error.response.data.message);
      } else {
        console.log('❌ Error inesperado:', error.response?.status);
      }
    }
    console.log('');

    // 3. Verificar si hay cookies de sesión
    console.log('3️⃣ Verificando cookies de sesión...');
    const cookies = await axios.get('http://localhost:3001/auth/me', {
      withCredentials: true
    }).catch(err => {
      if (err.response?.status === 401) {
        console.log('❌ No hay sesión activa (401 Unauthorized)');
        return null;
      }
      console.log('❌ Error inesperado:', err.response?.status);
      return null;
    });

    if (cookies) {
      console.log('✅ Sesión activa encontrada');
      console.log('   Usuario:', cookies.data);
    }
    console.log('');

    // 4. Probar endpoint con credenciales
    console.log('4️⃣ Probando endpoint con credenciales...');
    try {
      const response = await axios.get('http://localhost:3001/sensores/25/alertas/configuracion', {
        withCredentials: true
      });
      console.log('✅ Endpoint accesible con credenciales');
      console.log('   Datos:', response.data);
    } catch (error) {
      console.log('❌ Error al acceder con credenciales:', error.response?.status);
      console.log('   Mensaje:', error.response?.data?.message);
    }
    console.log('');

    // 5. Verificar configuración de CORS
    console.log('5️⃣ Verificando configuración de CORS...');
    try {
      const corsResponse = await axios.options('http://localhost:3001/sensores/25/alertas/configuracion');
      console.log('✅ CORS configurado correctamente');
      console.log('   Headers CORS:', corsResponse.headers['access-control-allow-origin']);
    } catch (error) {
      console.log('❌ Error en CORS:', error.message);
    }

  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

testAuthAlertas();
