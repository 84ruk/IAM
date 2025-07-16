const axios = require('axios');

// Configuración
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'TestPassword123!';

async function testProveedorEmail() {
  console.log('🧪 Probando solución para email inválido en proveedores...\n');

  try {
    // 1. Login para obtener token
    console.log('1️⃣ Iniciando sesión...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    }, {
      withCredentials: true
    });

    console.log('✅ Login exitoso');

    // 2. Probar crear proveedor SIN email (debería funcionar)
    console.log('\n2️⃣ Probando crear proveedor SIN email...');
    try {
      const proveedorSinEmail = await axios.post(`${API_URL}/proveedores`, {
        nombre: 'Proveedor Test Sin Email',
        // email: undefined (no se envía)
        telefono: '123456789'
      }, {
        withCredentials: true
      });

      console.log('✅ Proveedor creado sin email exitosamente');
      console.log('   ID:', proveedorSinEmail.data.id);
      console.log('   Nombre:', proveedorSinEmail.data.nombre);
      console.log('   Email:', proveedorSinEmail.data.email);

      // Limpiar - eliminar el proveedor de prueba
      await axios.delete(`${API_URL}/proveedores/${proveedorSinEmail.data.id}/soft`, {
        withCredentials: true
      });
      console.log('   🧹 Proveedor eliminado');

    } catch (error) {
      console.log('❌ Error al crear proveedor sin email:');
      console.log('   Status:', error.response?.status);
      console.log('   Message:', error.response?.data?.message);
      return false;
    }

    // 3. Probar crear proveedor CON email (debería funcionar)
    console.log('\n3️⃣ Probando crear proveedor CON email...');
    try {
      const proveedorConEmail = await axios.post(`${API_URL}/proveedores`, {
        nombre: 'Proveedor Test Con Email',
        email: 'proveedor@test.com',
        telefono: '987654321'
      }, {
        withCredentials: true
      });

      console.log('✅ Proveedor creado con email exitosamente');
      console.log('   ID:', proveedorConEmail.data.id);
      console.log('   Nombre:', proveedorConEmail.data.nombre);
      console.log('   Email:', proveedorConEmail.data.email);

      // Limpiar - eliminar el proveedor de prueba
      await axios.delete(`${API_URL}/proveedores/${proveedorConEmail.data.id}/soft`, {
        withCredentials: true
      });
      console.log('   🧹 Proveedor eliminado');

    } catch (error) {
      console.log('❌ Error al crear proveedor con email:');
      console.log('   Status:', error.response?.status);
      console.log('   Message:', error.response?.data?.message);
      return false;
    }

    // 4. Probar crear proveedor con email vacío (debería funcionar ahora)
    console.log('\n4️⃣ Probando crear proveedor con email vacío (string vacío)...');
    try {
      const proveedorEmailVacio = await axios.post(`${API_URL}/proveedores`, {
        nombre: 'Proveedor Test Email Vacio',
        email: '', // String vacío
        telefono: '555555555'
      }, {
        withCredentials: true
      });

      console.log('✅ Proveedor creado con email vacío exitosamente');
      console.log('   ID:', proveedorEmailVacio.data.id);
      console.log('   Nombre:', proveedorEmailVacio.data.nombre);
      console.log('   Email:', proveedorEmailVacio.data.email);

      // Limpiar - eliminar el proveedor de prueba
      await axios.delete(`${API_URL}/proveedores/${proveedorEmailVacio.data.id}/soft`, {
        withCredentials: true
      });
      console.log('   🧹 Proveedor eliminado');

    } catch (error) {
      console.log('❌ Error al crear proveedor con email vacío:');
      console.log('   Status:', error.response?.status);
      console.log('   Message:', error.response?.data?.message);
      return false;
    }

    console.log('\n🎉 ¡Todas las pruebas pasaron! El problema del email inválido está resuelto.');
    return true;

  } catch (error) {
    console.log('❌ Error general en las pruebas:');
    console.log('   Message:', error.message);
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Data:', error.response.data);
    }
    return false;
  }
}

// Ejecutar la prueba
if (require.main === module) {
  testProveedorEmail()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Error ejecutando pruebas:', error);
      process.exit(1);
    });
}

module.exports = { testProveedorEmail }; 