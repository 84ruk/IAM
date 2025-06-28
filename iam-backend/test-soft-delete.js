const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000';

// Configurar token de autenticación (necesitarás obtenerlo del login)
const authToken = 'TU_TOKEN_AQUI'; // Reemplazar con un token válido

const headers = {
  'Authorization': `Bearer ${authToken}`,
  'Content-Type': 'application/json'
};

async function testSoftDelete() {
  try {
    console.log('🧪 Iniciando pruebas de eliminado suave...\n');

    // 1. Obtener lista de productos activos
    console.log('1. Obteniendo productos activos...');
    const productosActivos = await axios.get(`${API_BASE_URL}/productos`, { headers });
    console.log(`   ✅ Productos activos encontrados: ${productosActivos.data.length}\n`);

    if (productosActivos.data.length === 0) {
      console.log('❌ No hay productos para probar. Crea algunos productos primero.');
      return;
    }

    const productoId = productosActivos.data[0].id;
    const productoNombre = productosActivos.data[0].nombre;
    console.log(`   📦 Usando producto: ${productoNombre} (ID: ${productoId})\n`);

    // 2. Eliminar producto (soft delete)
    console.log('2. Eliminando producto (soft delete)...');
    await axios.delete(`${API_BASE_URL}/productos/${productoId}`, { headers });
    console.log('   ✅ Producto eliminado exitosamente\n');

    // 3. Verificar que no aparece en productos activos
    console.log('3. Verificando que no aparece en productos activos...');
    const productosActivosPost = await axios.get(`${API_BASE_URL}/productos`, { headers });
    const productoEnActivos = productosActivosPost.data.find(p => p.id === productoId);
    if (!productoEnActivos) {
      console.log('   ✅ El producto ya no aparece en productos activos\n');
    } else {
      console.log('   ❌ ERROR: El producto aún aparece en productos activos\n');
    }

    // 4. Verificar que aparece en productos eliminados
    console.log('4. Verificando que aparece en productos eliminados...');
    const productosEliminados = await axios.get(`${API_BASE_URL}/productos/eliminados`, { headers });
    const productoEnEliminados = productosEliminados.data.find(p => p.id === productoId);
    if (productoEnEliminados) {
      console.log('   ✅ El producto aparece en productos eliminados\n');
    } else {
      console.log('   ❌ ERROR: El producto no aparece en productos eliminados\n');
    }

    // 5. Restaurar producto
    console.log('5. Restaurando producto...');
    await axios.patch(`${API_BASE_URL}/productos/${productoId}/restaurar`, {}, { headers });
    console.log('   ✅ Producto restaurado exitosamente\n');

    // 6. Verificar que vuelve a aparecer en productos activos
    console.log('6. Verificando que vuelve a aparecer en productos activos...');
    const productosActivosRestore = await axios.get(`${API_BASE_URL}/productos`, { headers });
    const productoRestaurado = productosActivosRestore.data.find(p => p.id === productoId);
    if (productoRestaurado) {
      console.log('   ✅ El producto vuelve a aparecer en productos activos\n');
    } else {
      console.log('   ❌ ERROR: El producto no vuelve a aparecer en productos activos\n');
    }

    console.log('🎉 Todas las pruebas completadas exitosamente!');

  } catch (error) {
    console.error('❌ Error en las pruebas:', error.response?.data || error.message);
  }
}

// Ejecutar pruebas si se ejecuta directamente
if (require.main === module) {
  console.log('⚠️  IMPORTANTE: Asegúrate de:');
  console.log('   1. Tener el servidor ejecutándose en localhost:3000');
  console.log('   2. Reemplazar TU_TOKEN_AQUI con un token válido');
  console.log('   3. Tener al menos un producto en la base de datos\n');
  
  // testSoftDelete();
  console.log('Descomenta la línea anterior para ejecutar las pruebas');
}

module.exports = { testSoftDelete }; 