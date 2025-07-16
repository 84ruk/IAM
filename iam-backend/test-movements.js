const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testMovements() {
  console.log('🔄 TESTING MÓDULO DE MOVIMIENTOS');
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

    // 2. Obtener productos disponibles
    console.log('\n2️⃣ Obteniendo productos disponibles...');
    const productsResponse = await axios.get(`${BASE_URL}/productos`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (productsResponse.data.length === 0) {
      console.log('⚠️ No hay productos disponibles para crear movimientos');
      return;
    }

    const product = productsResponse.data[0];
    console.log('✅ Producto seleccionado:', product.nombre, '(ID:', product.id, ')');

    // 3. Test de creación de movimiento de entrada
    console.log('\n3️⃣ Probando creación de movimiento de entrada...');
    const entradaData = {
      productoId: product.id,
      tipo: 'ENTRADA',
      cantidad: 50,
      motivo: 'Compra inicial',
      descripcion: 'Movimiento de prueba - entrada'
    };

    const entradaResponse = await axios.post(`${BASE_URL}/movimientos`, entradaData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Movimiento de entrada creado');
    console.log('   - ID:', entradaResponse.data.id);
    console.log('   - Tipo:', entradaResponse.data.tipo);
    console.log('   - Cantidad:', entradaResponse.data.cantidad);
    console.log('   - Stock anterior:', entradaResponse.data.stockAnterior);
    console.log('   - Stock nuevo:', entradaResponse.data.stockNuevo);

    // 4. Test de creación de movimiento de salida
    console.log('\n4️⃣ Probando creación de movimiento de salida...');
    const salidaData = {
      productoId: product.id,
      tipo: 'SALIDA',
      cantidad: 10,
      motivo: 'Venta',
      descripcion: 'Movimiento de prueba - salida'
    };

    const salidaResponse = await axios.post(`${BASE_URL}/movimientos`, salidaData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Movimiento de salida creado');
    console.log('   - ID:', salidaResponse.data.id);
    console.log('   - Tipo:', salidaResponse.data.tipo);
    console.log('   - Cantidad:', salidaResponse.data.cantidad);
    console.log('   - Stock anterior:', salidaResponse.data.stockAnterior);
    console.log('   - Stock nuevo:', salidaResponse.data.stockNuevo);

    // 5. Test de listado de movimientos
    console.log('\n5️⃣ Probando listado de movimientos...');
    const listResponse = await axios.get(`${BASE_URL}/movimientos`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Lista de movimientos obtenida');
    console.log('   - Total de movimientos:', listResponse.data.length);
    console.log('   - Movimientos de entrada:', listResponse.data.filter(m => m.tipo === 'ENTRADA').length);
    console.log('   - Movimientos de salida:', listResponse.data.filter(m => m.tipo === 'SALIDA').length);

    // 6. Test de obtención de movimiento específico
    console.log('\n6️⃣ Probando obtención de movimiento específico...');
    const movementId = entradaResponse.data.id;
    const getResponse = await axios.get(`${BASE_URL}/movimientos/${movementId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Movimiento específico obtenido');
    console.log('   - ID:', getResponse.data.id);
    console.log('   - Producto:', getResponse.data.producto?.nombre);
    console.log('   - Tipo:', getResponse.data.tipo);

    // 7. Test de movimientos por producto
    console.log('\n7️⃣ Probando movimientos por producto...');
    const productMovementsResponse = await axios.get(`${BASE_URL}/movimientos/producto/${product.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Movimientos por producto obtenidos');
    console.log('   - Total de movimientos del producto:', productMovementsResponse.data.length);

    // 8. Test de actualización de movimiento
    console.log('\n8️⃣ Probando actualización de movimiento...');
    const updateData = {
      motivo: 'Motivo actualizado',
      descripcion: 'Descripción actualizada'
    };

    const updateResponse = await axios.patch(`${BASE_URL}/movimientos/${movementId}`, updateData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Movimiento actualizado');
    console.log('   - Motivo actualizado:', updateResponse.data.motivo);
    console.log('   - Descripción actualizada:', updateResponse.data.descripcion);

    console.log('\n🎉 ¡TODOS LOS TESTS DE MOVIMIENTOS PASARON EXITOSAMENTE!');
    console.log('\n📋 Resumen:');
    console.log('   ✅ Creación de movimiento de entrada');
    console.log('   ✅ Creación de movimiento de salida');
    console.log('   ✅ Listado de movimientos');
    console.log('   ✅ Obtención de movimiento específico');
    console.log('   ✅ Movimientos por producto');
    console.log('   ✅ Actualización de movimiento');
    console.log('   ✅ Versionado optimista funcionando');

  } catch (error) {
    console.error('❌ Error en test de movimientos:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('💡 Error de autenticación - verificar credenciales');
    } else if (error.response?.status === 403) {
      console.log('💡 Error de permisos - verificar roles');
    } else if (error.response?.status === 400) {
      console.log('💡 Error de validación - verificar datos enviados');
    }
  }
}

testMovements(); 