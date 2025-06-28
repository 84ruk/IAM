const axios = require('axios');

const API_URL = 'http://localhost:3001';
let authToken = '';
let testProductId = null;

// Función para hacer login y obtener token
async function login() {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@elpeso.com',
      password: 'admin123'
    });
    
    authToken = response.data.token;
    console.log('✅ Login exitoso');
    console.log('🔑 Token obtenido:', authToken ? 'SÍ' : 'NO');
    console.log('📝 Respuesta completa:', JSON.stringify(response.data, null, 2));
    return authToken;
  } catch (error) {
    console.error('❌ Error en login:', error.response?.data || error.message);
    throw error;
  }
}

// Función para crear un producto de prueba
async function createTestProduct() {
  try {
    console.log('🔑 Usando token:', authToken ? 'SÍ' : 'NO');
    const response = await axios.post(`${API_URL}/productos`, {
      nombre: 'Producto Test Soft Delete',
      descripcion: 'Producto para probar soft delete',
      precioCompra: 10.50,
      precioVenta: 15.00,
      stock: 100,
      stockMinimo: 10,
      codigoBarras: 'TEST123456789',
      etiqueta: 'ALIMENTO',
      unidad: 'UNIDAD'
    }, {
      headers: { 
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    testProductId = response.data.id;
    console.log('✅ Producto de prueba creado con ID:', testProductId);
    return response.data;
  } catch (error) {
    console.error('❌ Error creando producto de prueba:', error.response?.data || error.message);
    console.error('🔍 Status:', error.response?.status);
    console.error('🔍 Headers enviados:', error.config?.headers);
    throw error;
  }
}

// Función para listar productos activos
async function listActiveProducts() {
  try {
    const response = await axios.get(`${API_URL}/productos`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Productos activos:', response.data.length);
    return response.data;
  } catch (error) {
    console.error('❌ Error listando productos activos:', error.response?.data || error.message);
    throw error;
  }
}

// Función para desactivar producto (soft delete)
async function deactivateProduct() {
  try {
    const response = await axios.delete(`${API_URL}/productos/${testProductId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Producto desactivado:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error desactivando producto:', error.response?.data || error.message);
    throw error;
  }
}

// Función para listar productos inactivos
async function listInactiveProducts() {
  try {
    const response = await axios.get(`${API_URL}/productos/inactivos`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Productos inactivos:', response.data.length);
    return response.data;
  } catch (error) {
    console.error('❌ Error listando productos inactivos:', error.response?.data || error.message);
    throw error;
  }
}

// Función para reactivar producto
async function reactivateProduct() {
  try {
    const response = await axios.patch(`${API_URL}/productos/${testProductId}/reactivar`, {}, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Producto reactivado:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error reactivando producto:', error.response?.data || error.message);
    throw error;
  }
}

// Función para eliminar permanentemente (solo admin)
async function permanentlyDeleteProduct() {
  try {
    const response = await axios.delete(`${API_URL}/productos/${testProductId}/permanent`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Producto eliminado permanentemente:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error eliminando producto permanentemente:', error.response?.data || error.message);
    throw error;
  }
}

// Función para probar permisos insuficientes
async function testInsufficientPermissions() {
  try {
    // Intentar eliminar permanentemente sin ser admin (usando token de usuario normal)
    const userResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'user@elpeso.com',
      password: 'user123'
    });
    
    const userToken = userResponse.data.token;
    
    await axios.delete(`${API_URL}/productos/999/permanent`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    
    console.log('❌ No debería haber llegado aquí - falta validación de permisos');
  } catch (error) {
    if (error.response?.status === 403) {
      console.log('✅ Permisos insuficientes correctamente manejados:', error.response.data);
    } else {
      console.error('❌ Error inesperado en prueba de permisos:', error.response?.data || error.message);
    }
  }
}

// Función principal de pruebas
async function runTests() {
  console.log('🚀 Iniciando pruebas de operaciones de productos...\n');
  
  try {
    // 1. Login
    await login();
    
    // 2. Crear producto de prueba
    await createTestProduct();
    
    // 3. Listar productos activos
    await listActiveProducts();
    
    // 4. Desactivar producto (soft delete)
    await deactivateProduct();
    
    // 5. Verificar que no aparece en productos activos
    await listActiveProducts();
    
    // 6. Listar productos inactivos
    await listInactiveProducts();
    
    // 7. Reactivar producto
    await reactivateProduct();
    
    // 8. Verificar que aparece de nuevo en productos activos
    await listActiveProducts();
    
    // 9. Eliminar permanentemente
    await permanentlyDeleteProduct();
    
    // 10. Probar permisos insuficientes
    await testInsufficientPermissions();
    
    console.log('\n🎉 Todas las pruebas completadas exitosamente!');
    
  } catch (error) {
    console.error('\n💥 Error en las pruebas:', error.message);
  }
}

// Ejecutar pruebas
runTests(); 