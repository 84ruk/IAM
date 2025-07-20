const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Simular un token JWT válido (en producción esto vendría del login)
const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoiYWRtaW5AdGVzdC5jb20iLCJyb2wiOiJBRE1JTiIsImVtcHJlc2FJZCI6MSwiaWF0IjoxNzM0NzI4MDAwLCJleHAiOjE3MzQ4MTQ0MDB9.mock';

async function testEndpoints() {
  console.log('🧪 Probando endpoints del backend...\n');

  const headers = {
    'Authorization': `Bearer ${mockToken}`,
    'Content-Type': 'application/json'
  };

  try {
    // 1. Probar endpoint de movimientos diarios
    console.log('1️⃣ Probando /dashboard-cqrs/daily-movements...');
    const dailyMovements = await axios.get(`${BASE_URL}/dashboard-cqrs/daily-movements?days=7`, { headers });
    console.log('✅ Movimientos diarios:', {
      totalDays: dailyMovements.data.meta.totalDays,
      dataPoints: dailyMovements.data.data.length,
      summary: dailyMovements.data.summary
    });

    // 2. Probar endpoint de opciones de filtro
    console.log('\n2️⃣ Probando /dashboard-cqrs/filter-options...');
    const filterOptions = await axios.get(`${BASE_URL}/dashboard-cqrs/filter-options`, { headers });
    console.log('✅ Opciones de filtro:', {
      products: filterOptions.data.products.length,
      suppliers: filterOptions.data.suppliers.length,
      categories: filterOptions.data.categories.length,
      reasons: filterOptions.data.reasons.length,
      users: filterOptions.data.users.length
    });

    // 3. Probar endpoint de productos
    console.log('\n3️⃣ Probando /productos...');
    const productos = await axios.get(`${BASE_URL}/productos`, { headers });
    console.log('✅ Productos:', {
      total: productos.data.total,
      productos: productos.data.productos.length
    });

    // 4. Probar endpoint de movimientos
    console.log('\n4️⃣ Probando /movimientos...');
    const movimientos = await axios.get(`${BASE_URL}/movimientos`, { headers });
    console.log('✅ Movimientos:', {
      total: movimientos.data.estadisticas.total,
      entradas: movimientos.data.estadisticas.entradas,
      salidas: movimientos.data.estadisticas.salidas
    });

    // 5. Probar endpoint de proveedores
    console.log('\n5️⃣ Probando /proveedores...');
    const proveedores = await axios.get(`${BASE_URL}/proveedores`, { headers });
    console.log('✅ Proveedores:', {
      total: proveedores.data.length
    });

    console.log('\n🎉 ¡Todos los endpoints funcionan correctamente!');
    console.log('\n📊 Resumen de datos disponibles:');
    console.log(`- Productos: ${productos.data.total}`);
    console.log(`- Movimientos: ${movimientos.data.estadisticas.total}`);
    console.log(`- Proveedores: ${proveedores.data.length}`);
    console.log(`- Días de datos: ${dailyMovements.data.meta.totalDays}`);

  } catch (error) {
    console.error('❌ Error probando endpoints:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n💡 El error 401 indica que necesitas un token JWT válido.');
      console.log('   Para obtener un token, primero debes hacer login en el frontend.');
    }
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testEndpoints();
}

module.exports = { testEndpoints }; 