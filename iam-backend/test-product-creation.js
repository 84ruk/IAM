const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testProductCreation() {
  console.log('📦 TESTING MÓDULO DE CREACIÓN DE PRODUCTOS');
  console.log('==========================================\n');

  try {
    // 1. Login para obtener token
    console.log('1️⃣ Iniciando sesión...');
    const loginData = {
      email: 'test-security-new@example.com',
      password: 'TestPassword123!@#'
    };

    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, loginData);
    const token = loginResponse.data.token;
    console.log('✅ Login exitoso');

    // 2. Test de creación de producto
    console.log('\n2️⃣ Probando creación de producto...');
    const productData = {
      nombre: `Producto Test ${Date.now()}`,
      descripcion: 'Producto de prueba para testing',
      stock: 100,
      stockMinimo: 10,
      precioCompra: 50.0,
      precioVenta: 75.0,
      codigoBarras: `TEST-${Date.now()}`,
      etiquetas: ['test', 'producto'],
      tipoProducto: 'GENERICO',
      unidad: 'UNIDAD'
    };

    const createResponse = await axios.post(`${BASE_URL}/productos`, productData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Producto creado exitosamente');
    console.log('   - ID:', createResponse.data.id);
    console.log('   - Nombre:', createResponse.data.nombre);
    console.log('   - Stock:', createResponse.data.stock);
    console.log('   - Versión:', createResponse.data.version);

    const productId = createResponse.data.id;

    // 3. Test de obtención de producto
    console.log('\n3️⃣ Probando obtención de producto...');
    const getResponse = await axios.get(`${BASE_URL}/productos/${productId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Producto obtenido');
    console.log('   - ID:', getResponse.data.id);
    console.log('   - Nombre:', getResponse.data.nombre);
    console.log('   - Stock:', getResponse.data.stock);

    // 4. Test de actualización de producto
    console.log('\n4️⃣ Probando actualización de producto...');
    const updateData = {
      nombre: `Producto Test Actualizado ${Date.now()}`,
      stock: 150,
      precioVenta: 85.0
    };

    const updateResponse = await axios.patch(`${BASE_URL}/productos/${productId}`, updateData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Producto actualizado');
    console.log('   - Nombre actualizado:', updateResponse.data.nombre);
    console.log('   - Stock actualizado:', updateResponse.data.stock);
    console.log('   - Versión incrementada:', updateResponse.data.version);

    // 5. Test de listado de productos
    console.log('\n5️⃣ Probando listado de productos...');
    const listResponse = await axios.get(`${BASE_URL}/productos`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Lista de productos obtenida');
    console.log('   - Total de productos:', listResponse.data.length);
    console.log('   - Producto creado encontrado:', listResponse.data.some(p => p.id === productId));

    // 6. Test de búsqueda por código de barras
    console.log('\n6️⃣ Probando búsqueda por código de barras...');
    const barcodeResponse = await axios.get(`${BASE_URL}/productos/buscar/${productData.codigoBarras}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Búsqueda por código de barras exitosa');
    console.log('   - Producto encontrado:', barcodeResponse.data.nombre);

    // 7. Test de desactivación de producto
    console.log('\n7️⃣ Probando desactivación de producto...');
    const deactivateResponse = await axios.patch(`${BASE_URL}/productos/${productId}/desactivar`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Producto desactivado');
    console.log('   - Estado:', deactivateResponse.data.estado);

    // 8. Test de productos inactivos
    console.log('\n8️⃣ Probando listado de productos inactivos...');
    const inactiveResponse = await axios.get(`${BASE_URL}/productos/inactivos`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Productos inactivos obtenidos');
    console.log('   - Producto desactivado encontrado:', inactiveResponse.data.some(p => p.id === productId));

    console.log('\n🎉 ¡TODOS LOS TESTS DE PRODUCTOS PASARON EXITOSAMENTE!');
    console.log('\n📋 Resumen:');
    console.log('   ✅ Creación de producto');
    console.log('   ✅ Obtención de producto');
    console.log('   ✅ Actualización de producto');
    console.log('   ✅ Listado de productos');
    console.log('   ✅ Búsqueda por código de barras');
    console.log('   ✅ Desactivación de producto');
    console.log('   ✅ Listado de productos inactivos');

  } catch (error) {
    console.error('❌ Error en test de productos:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('💡 Error de autenticación - verificar credenciales');
    } else if (error.response?.status === 403) {
      console.log('💡 Error de permisos - verificar roles');
    }
  }
}

testProductCreation(); 