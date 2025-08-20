const axios = require('axios');

async function testCookies() {
  console.log('🍪 Probando cookies de autenticación...\n');

  try {
    // 1. Verificar si hay cookies en el backend
    console.log('1️⃣ Verificando cookies en el backend...');
    try {
      const response = await axios.get('http://localhost:3001/auth/me', {
        withCredentials: true
      });
      console.log('✅ Sesión activa encontrada');
      console.log('   Usuario:', response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('❌ No hay sesión activa (401 Unauthorized)');
        console.log('   Mensaje:', error.response.data.message);
      } else {
        console.log('❌ Error inesperado:', error.response?.status);
      }
    }
    console.log('');

    // 2. Probar login para crear una nueva sesión
    console.log('2️⃣ Probando login para crear sesión...');
    try {
      const loginResponse = await axios.post('http://localhost:3001/auth/login', {
        email: 'baruk066@gmail.com',
        password: 'test123' // Usar una contraseña de prueba
      }, {
        withCredentials: true
      });
      console.log('✅ Login exitoso');
      console.log('   Usuario:', loginResponse.data.user);
      console.log('   Token:', loginResponse.data.accessToken ? 'Presente' : 'Ausente');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('❌ Credenciales inválidas (401 Unauthorized)');
        console.log('   Mensaje:', error.response.data.message);
      } else {
        console.log('❌ Error en login:', error.response?.status);
        console.log('   Mensaje:', error.response?.data?.message || error.message);
      }
    }
    console.log('');

    // 3. Verificar si el login creó una sesión
    console.log('3️⃣ Verificando sesión después del login...');
    try {
      const sessionResponse = await axios.get('http://localhost:3001/auth/me', {
        withCredentials: true
      });
      console.log('✅ Sesión creada exitosamente');
      console.log('   Usuario:', sessionResponse.data);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('❌ Sesión no se creó correctamente (401 Unauthorized)');
      } else {
        console.log('❌ Error verificando sesión:', error.response?.status);
      }
    }

  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

testCookies();
