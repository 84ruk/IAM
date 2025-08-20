const axios = require('axios');

async function verificarSesion() {
  console.log('🔐 Verificando estado de la sesión...\n');

  try {
    // 1. Verificar endpoint de salud
    console.log('1️⃣ Verificando backend...');
    const healthResponse = await axios.get('http://localhost:3001/health');
    console.log('✅ Backend funcionando:', healthResponse.data.status);
    console.log('');

    // 2. Verificar si hay sesión activa
    console.log('2️⃣ Verificando sesión activa...');
    try {
      const sessionResponse = await axios.get('http://localhost:3001/auth/me', {
        withCredentials: true
      });
      console.log('✅ Sesión activa encontrada');
      console.log('   Usuario:', sessionResponse.data.email);
      console.log('   Rol:', sessionResponse.data.rol);
      console.log('   Empresa ID:', sessionResponse.data.empresaId);
      console.log('');
      
      // 3. Probar endpoint de alertas con sesión activa
      console.log('3️⃣ Probando endpoint de alertas con sesión activa...');
      try {
        const alertasResponse = await axios.get('http://localhost:3001/sensores/25/alertas/configuracion', {
          withCredentials: true
        });
        console.log('✅ Endpoint de alertas accesible');
        console.log('   Datos:', alertasResponse.data);
      } catch (error) {
        if (error.response?.status === 404) {
          console.log('✅ Endpoint accesible (404 - Configuración no encontrada)');
        } else {
          console.log('❌ Error en endpoint de alertas:', error.response?.status);
          console.log('   Mensaje:', error.response?.data?.message);
        }
      }
      
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('❌ No hay sesión activa (401 Unauthorized)');
        console.log('   Mensaje:', error.response.data.message);
        console.log('');
        console.log('💡 SOLUCIÓN:');
        console.log('   1. Ve a http://localhost:3000/login');
        console.log('   2. Inicia sesión con Google');
        console.log('   3. Vuelve a ejecutar este script');
      } else {
        console.log('❌ Error inesperado:', error.response?.status);
      }
    }

  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

verificarSesion();
