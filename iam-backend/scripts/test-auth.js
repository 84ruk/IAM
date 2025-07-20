const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testAuth() {
  console.log('🔐 Probando autenticación del usuario prueba@iam.com...\n');

  try {
    // 1. Intentar login
    console.log('1️⃣ Intentando login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'prueba@iam.com',
      password: 'PruebaIAM123'
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      withCredentials: true
    });

    console.log('✅ Login exitoso');
    console.log('Token recibido:', loginResponse.data.token ? 'Sí' : 'No');
    console.log('Usuario:', loginResponse.data.user?.email);

    // Extraer cookies de la respuesta
    const cookies = loginResponse.headers['set-cookie'];
    if (cookies) {
      console.log('Cookies recibidas:', cookies.length);
    }

    // 2. Probar endpoint /auth/me
    console.log('\n2️⃣ Probando /auth/me...');
    const meResponse = await axios.get(`${BASE_URL}/auth/me`, {
      headers: {
        'Cookie': cookies ? cookies.join('; ') : '',
        'Content-Type': 'application/json'
      },
      withCredentials: true
    });

    console.log('✅ /auth/me exitoso');
    console.log('Usuario autenticado:', meResponse.data.email);
    console.log('Empresa ID:', meResponse.data.empresaId);
    console.log('Rol:', meResponse.data.rol);

    // 3. Probar endpoint de movimientos diarios
    console.log('\n3️⃣ Probando /dashboard-cqrs/daily-movements...');
    const dailyMovementsResponse = await axios.get(`${BASE_URL}/dashboard-cqrs/daily-movements?days=7`, {
      headers: {
        'Cookie': cookies ? cookies.join('; ') : '',
        'Content-Type': 'application/json'
      },
      withCredentials: true
    });

    console.log('✅ /dashboard-cqrs/daily-movements exitoso');
    console.log('Datos recibidos:', {
      totalDays: dailyMovementsResponse.data.meta?.totalDays,
      dataPoints: dailyMovementsResponse.data.data?.length,
      summary: dailyMovementsResponse.data.summary
    });

    // 4. Probar endpoint de opciones de filtro
    console.log('\n4️⃣ Probando /dashboard-cqrs/filter-options...');
    const filterOptionsResponse = await axios.get(`${BASE_URL}/dashboard-cqrs/filter-options`, {
      headers: {
        'Cookie': cookies ? cookies.join('; ') : '',
        'Content-Type': 'application/json'
      },
      withCredentials: true
    });

    console.log('✅ /dashboard-cqrs/filter-options exitoso');
    console.log('Opciones recibidas:', {
      products: filterOptionsResponse.data.products?.length,
      suppliers: filterOptionsResponse.data.suppliers?.length,
      categories: filterOptionsResponse.data.categories?.length,
      reasons: filterOptionsResponse.data.reasons?.length
    });

    console.log('\n🎉 ¡Todas las pruebas de autenticación exitosas!');
    console.log('\n📋 Resumen:');
    console.log('- Login: ✅');
    console.log('- Autenticación: ✅');
    console.log('- Movimientos diarios: ✅');
    console.log('- Opciones de filtro: ✅');

  } catch (error) {
    console.error('❌ Error en prueba de autenticación:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n💡 Error 401: Credenciales incorrectas');
      console.log('   Verificar que la contraseña sea correcta');
    } else if (error.response?.status === 403) {
      console.log('\n💡 Error 403: Usuario no tiene permisos');
      console.log('   Verificar que el usuario tenga el rol correcto');
    } else if (error.response?.status === 404) {
      console.log('\n💡 Error 404: Endpoint no encontrado');
      console.log('   Verificar que el backend esté corriendo en el puerto correcto');
    }
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testAuth();
}

module.exports = { testAuth }; 