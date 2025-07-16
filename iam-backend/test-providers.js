const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testProviders() {
  console.log('🏢 TESTING MÓDULO DE PROVEEDORES');
  console.log('=================================\n');

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

    // 2. Test de creación de proveedor
    console.log('\n2️⃣ Probando creación de proveedor...');
    const providerData = {
      nombre: `Proveedor Test ${Date.now()}`,
      email: `proveedor-${Date.now()}@example.com`,
      telefono: '+1234567890',
      direccion: 'Dirección de prueba 123',
      rfc: `RFC${Date.now()}`,
      descripcion: 'Proveedor de prueba para testing'
    };

    const createResponse = await axios.post(`${BASE_URL}/proveedores`, providerData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Proveedor creado exitosamente');
    console.log('   - ID:', createResponse.data.id);
    console.log('   - Nombre:', createResponse.data.nombre);
    console.log('   - Email:', createResponse.data.email);
    console.log('   - RFC:', createResponse.data.rfc);

    const providerId = createResponse.data.id;

    // 3. Test de obtención de proveedor
    console.log('\n3️⃣ Probando obtención de proveedor...');
    const getResponse = await axios.get(`${BASE_URL}/proveedores/${providerId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Proveedor obtenido');
    console.log('   - ID:', getResponse.data.id);
    console.log('   - Nombre:', getResponse.data.nombre);
    console.log('   - Estado:', getResponse.data.estado);

    // 4. Test de actualización de proveedor
    console.log('\n4️⃣ Probando actualización de proveedor...');
    const updateData = {
      nombre: `Proveedor Test Actualizado ${Date.now()}`,
      telefono: '+0987654321',
      descripcion: 'Descripción actualizada'
    };

    const updateResponse = await axios.put(`${BASE_URL}/proveedores/${providerId}`, updateData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Proveedor actualizado');
    console.log('   - Nombre actualizado:', updateResponse.data.nombre);
    console.log('   - Teléfono actualizado:', updateResponse.data.telefono);

    // 5. Test de listado de proveedores
    console.log('\n5️⃣ Probando listado de proveedores...');
    const listResponse = await axios.get(`${BASE_URL}/proveedores`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Lista de proveedores obtenida');
    console.log('   - Total de proveedores:', listResponse.data.length);
    console.log('   - Proveedor creado encontrado:', listResponse.data.some(p => p.id === providerId));

    // 6. Test de desactivación de proveedor
    console.log('\n6️⃣ Probando desactivación de proveedor...');
    const deactivateResponse = await axios.patch(`${BASE_URL}/proveedores/${providerId}/desactivar`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Proveedor desactivado');
    console.log('   - Estado:', deactivateResponse.data.estado);

    // 7. Test de reactivación de proveedor
    console.log('\n7️⃣ Probando reactivación de proveedor...');
    const reactivateResponse = await axios.patch(`${BASE_URL}/proveedores/${providerId}/reactivar`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Proveedor reactivado');
    console.log('   - Estado:', reactivateResponse.data.estado);

    // 8. Test de eliminación suave de proveedor
    console.log('\n8️⃣ Probando eliminación suave de proveedor...');
    const softDeleteResponse = await axios.delete(`${BASE_URL}/proveedores/${providerId}/soft`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Proveedor eliminado suavemente');
    console.log('   - Estado:', softDeleteResponse.data.estado);

    // 9. Test de restauración de proveedor
    console.log('\n9️⃣ Probando restauración de proveedor...');
    const restoreResponse = await axios.patch(`${BASE_URL}/proveedores/${providerId}/restaurar`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Proveedor restaurado');
    console.log('   - Estado:', restoreResponse.data.estado);

    console.log('\n🎉 ¡TODOS LOS TESTS DE PROVEEDORES PASARON EXITOSAMENTE!');
    console.log('\n📋 Resumen:');
    console.log('   ✅ Creación de proveedor');
    console.log('   ✅ Obtención de proveedor');
    console.log('   ✅ Actualización de proveedor');
    console.log('   ✅ Listado de proveedores');
    console.log('   ✅ Desactivación de proveedor');
    console.log('   ✅ Reactivación de proveedor');
    console.log('   ✅ Eliminación suave de proveedor');
    console.log('   ✅ Restauración de proveedor');

  } catch (error) {
    console.error('❌ Error en test de proveedores:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('💡 Error de autenticación - verificar credenciales');
    } else if (error.response?.status === 403) {
      console.log('💡 Error de permisos - verificar roles');
    } else if (error.response?.status === 400) {
      console.log('💡 Error de validación - verificar datos enviados');
    }
  }
}

testProviders(); 