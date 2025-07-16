const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testEmpresas() {
  console.log('🏭 TESTING MÓDULO DE EMPRESAS');
  console.log('==============================\n');

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

    // 2. Test de obtención de empresa actual
    console.log('\n2️⃣ Probando obtención de empresa actual...');
    const currentEmpresaResponse = await axios.get(`${BASE_URL}/empresa/actual`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Empresa actual obtenida');
    console.log('   - ID:', currentEmpresaResponse.data.id);
    console.log('   - Nombre:', currentEmpresaResponse.data.nombre);
    console.log('   - RFC:', currentEmpresaResponse.data.rfc || 'N/A');

    const empresaId = currentEmpresaResponse.data.id;

    // 3. Test de actualización de empresa
    console.log('\n3️⃣ Probando actualización de empresa...');
    const updateData = {
      nombre: `Empresa Test Actualizada ${Date.now()}`,
      descripcion: 'Descripción actualizada de la empresa',
      direccion: 'Nueva dirección de la empresa',
      telefono: '+1234567890'
    };

    const updateResponse = await axios.patch(`${BASE_URL}/empresa`, updateData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Empresa actualizada');
    console.log('   - Nombre actualizado:', updateResponse.data.nombre);
    console.log('   - Descripción actualizada:', updateResponse.data.descripcion);

    // 4. Test de obtención de empresa por ID
    console.log('\n4️⃣ Probando obtención de empresa por ID...');
    const getByIdResponse = await axios.get(`${BASE_URL}/empresa/${empresaId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Empresa obtenida por ID');
    console.log('   - ID:', getByIdResponse.data.id);
    console.log('   - Nombre:', getByIdResponse.data.nombre);

    // 5. Test de configuración de empresa
    console.log('\n5️⃣ Probando configuración de empresa...');
    const configData = {
      industria: 'TECNOLOGIA',
      configuracion: {
        alertasStock: true,
        notificacionesEmail: true,
        reportesAutomaticos: false
      }
    };

    const configResponse = await axios.post(`${BASE_URL}/empresa/configuracion`, configData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Configuración de empresa establecida');
    console.log('   - Industria:', configResponse.data.industria);
    console.log('   - Configuración guardada:', !!configResponse.data.configuracion);

    // 6. Test de obtención de configuración
    console.log('\n6️⃣ Probando obtención de configuración...');
    const getConfigResponse = await axios.get(`${BASE_URL}/empresa/configuracion`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Configuración obtenida');
    console.log('   - Industria:', getConfigResponse.data.industria);
    console.log('   - Alertas de stock:', getConfigResponse.data.configuracion?.alertasStock);

    // 7. Test de estadísticas de empresa
    console.log('\n7️⃣ Probando estadísticas de empresa...');
    const statsResponse = await axios.get(`${BASE_URL}/empresa/estadisticas`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Estadísticas obtenidas');
    console.log('   - Total de productos:', statsResponse.data.totalProductos);
    console.log('   - Total de movimientos:', statsResponse.data.totalMovimientos);
    console.log('   - Total de proveedores:', statsResponse.data.totalProveedores);

    // 8. Test de validación de RFC
    console.log('\n8️⃣ Probando validación de RFC...');
    const rfcData = {
      rfc: 'XAXX010101000'
    };

    const rfcResponse = await axios.post(`${BASE_URL}/empresa/validar-rfc`, rfcData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Validación de RFC completada');
    console.log('   - RFC válido:', rfcResponse.data.valido);

    console.log('\n🎉 ¡TODOS LOS TESTS DE EMPRESAS PASARON EXITOSAMENTE!');
    console.log('\n📋 Resumen:');
    console.log('   ✅ Obtención de empresa actual');
    console.log('   ✅ Actualización de empresa');
    console.log('   ✅ Obtención de empresa por ID');
    console.log('   ✅ Configuración de empresa');
    console.log('   ✅ Obtención de configuración');
    console.log('   ✅ Estadísticas de empresa');
    console.log('   ✅ Validación de RFC');

  } catch (error) {
    console.error('❌ Error en test de empresas:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('💡 Error de autenticación - verificar credenciales');
    } else if (error.response?.status === 403) {
      console.log('💡 Error de permisos - verificar roles');
    } else if (error.response?.status === 400) {
      console.log('💡 Error de validación - verificar datos enviados');
    }
  }
}

testEmpresas(); 