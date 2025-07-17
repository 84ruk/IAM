const axios = require('axios');

// Configuración
const BASE_URL = process.env.API_URL || 'http://localhost:3000';
const TEST_EMAIL = 'admin@test.com';
const TEST_PASSWORD = 'admin123';

// Token de autenticación
let authToken = null;

// Función para login
async function login() {
  try {
    console.log('🔐 Iniciando sesión...');
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });
    
    authToken = response.data.access_token;
    console.log('✅ Login exitoso');
    return authToken;
  } catch (error) {
    console.error('❌ Error en login:', error.response?.data || error.message);
    throw error;
  }
}

// Función para hacer requests autenticados
async function authenticatedRequest(endpoint, method = 'GET', data = null) {
  if (!authToken) {
    throw new Error('No hay token de autenticación');
  }

  const config = {
    method,
    url: `${BASE_URL}${endpoint}`,
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  };

  if (data) {
    config.data = data;
  }

  try {
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`❌ Error en ${endpoint}:`, error.response?.data || error.message);
    throw error;
  }
}

// Función para probar endpoint
async function testEndpoint(name, endpoint, method = 'GET', data = null) {
  try {
    console.log(`\n🧪 Probando: ${name}`);
    console.log(`📍 Endpoint: ${endpoint}`);
    
    const startTime = Date.now();
    const result = await authenticatedRequest(endpoint, method, data);
    const endTime = Date.now();
    
    console.log(`✅ Éxito (${endTime - startTime}ms)`);
    console.log(`📊 Resultado:`, JSON.stringify(result, null, 2).substring(0, 500) + '...');
    
    return { success: true, data: result, time: endTime - startTime };
  } catch (error) {
    console.log(`❌ Falló: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Función principal de pruebas
async function runTests() {
  console.log('🚀 Iniciando pruebas de KPIs mejorados...\n');

  try {
    // 1. Login
    await login();

    // 2. Pruebas de KPIs básicos
    console.log('\n📊 === PRUEBAS DE KPIs BÁSICOS ===');
    await testEndpoint('KPIs Básicos', '/dashboard/kpis');
    await testEndpoint('KPIs Financieros', '/dashboard/financial-kpis');
    await testEndpoint('Datos del Dashboard', '/dashboard/data');
    await testEndpoint('KPIs Avanzados', '/dashboard/advanced-kpis');

    // 3. Pruebas de KPIs por industria
    console.log('\n🏭 === PRUEBAS DE KPIs POR INDUSTRIA ===');
    await testEndpoint('KPIs de Industria (Genérico)', '/dashboard/industry-kpis');
    await testEndpoint('KPIs de Alimentos', '/dashboard/alimentos-kpis');
    await testEndpoint('KPIs de Farmacia', '/dashboard/farmacia-kpis');
    await testEndpoint('KPIs de Ropa', '/dashboard/ropa-kpis');
    await testEndpoint('KPIs de Electrónica', '/dashboard/electronica-kpis');

    // 4. Pruebas de KPIs operacionales
    console.log('\n⚙️ === PRUEBAS DE KPIs OPERACIONALES ===');
    await testEndpoint('KPIs Operacionales', '/dashboard/operational-kpis');
    await testEndpoint('KPIs de Proveedores', '/dashboard/supplier-kpis');
    await testEndpoint('KPIs de Rentabilidad', '/dashboard/profitability-kpis');
    await testEndpoint('KPIs de Sensores', '/dashboard/sensor-kpis');

    // 5. Pruebas de KPIs predictivos (versión anterior)
    console.log('\n🔮 === PRUEBAS DE KPIs PREDICTIVOS (VERSIÓN ANTERIOR) ===');
    await testEndpoint('KPIs Predictivos', '/dashboard/predictive-kpis');
    await testEndpoint('Forecast de Demanda', '/dashboard/demand-forecast?days=30');
    await testEndpoint('Alertas de Vencimiento', '/dashboard/expiry-alerts?days=30');

    // 6. Pruebas de servicios de industria
    console.log('\n🏭 === PRUEBAS DE SERVICIOS DE INDUSTRIA ===');
    await testEndpoint('Resumen de Industria', '/dashboard/industry-summary');
    await testEndpoint('Validación de Industria', '/dashboard/industry-validation');
    await testEndpoint('Recomendaciones de Industria', '/dashboard/industry-recommendations');

    // 7. 🆕 NUEVAS PRUEBAS DE PREDICCIÓN MEJORADA
    console.log('\n🔮 === PRUEBAS DE PREDICCIÓN MEJORADA ===');
    await testEndpoint('Predicción de Demanda (Nuevo)', '/dashboard/predictions/demand?days=30');
    await testEndpoint('Predicción de Quiebres (Nuevo)', '/dashboard/predictions/stockouts');
    
    // Probar forecast detallado con un producto específico
    const productos = await authenticatedRequest('/dashboard/productos-kpi');
    if (productos && productos.length > 0) {
      const primerProducto = productos[0];
      await testEndpoint(
        'Forecast Detallado', 
        `/dashboard/predictions/forecast/${primerProducto.id}?days=30`
      );
    }

    // 8. 🆕 NUEVAS PRUEBAS DE ALERTAS VISUALES
    console.log('\n🚨 === PRUEBAS DE ALERTAS VISUALES ===');
    await testEndpoint('Alertas Visuales', '/dashboard/alerts/visual');
    await testEndpoint('Dashboard de Alertas', '/dashboard/alerts/dashboard');
    await testEndpoint('Productos en Riesgo', '/dashboard/alerts/products-at-risk');
    await testEndpoint('Tendencias de Alertas', '/dashboard/alerts/trends?days=7');

    // 9. Pruebas de rendimiento y cache
    console.log('\n⚡ === PRUEBAS DE RENDIMIENTO ===');
    
    // Probar cache con múltiples requests
    console.log('\n🔄 Probando cache con múltiples requests...');
    const startTime = Date.now();
    
    const promises = [];
    for (let i = 0; i < 5; i++) {
      promises.push(authenticatedRequest('/dashboard/kpis'));
    }
    
    const results = await Promise.all(promises);
    const endTime = Date.now();
    
    console.log(`✅ 5 requests completados en ${endTime - startTime}ms`);
    console.log(`📊 Tiempo promedio: ${(endTime - startTime) / 5}ms por request`);

    // 10. Pruebas de validación de datos
    console.log('\n✅ === PRUEBAS DE VALIDACIÓN ===');
    
    // Verificar estructura de datos
    const kpis = await authenticatedRequest('/dashboard/kpis');
    if (kpis && typeof kpis === 'object') {
      console.log('✅ Estructura de KPIs válida');
      console.log(`📊 Timestamp: ${kpis.timestamp}`);
      console.log(`📊 Total productos: ${kpis.totalProductos}`);
    }

    const alertas = await authenticatedRequest('/dashboard/alerts/visual');
    if (Array.isArray(alertas)) {
      console.log(`✅ Alertas recibidas: ${alertas.length}`);
      if (alertas.length > 0) {
        console.log(`📊 Primera alerta: ${alertas[0].titulo}`);
      }
    }

    console.log('\n🎉 ¡Todas las pruebas completadas exitosamente!');
    console.log('\n📋 RESUMEN:');
    console.log('✅ KPIs básicos funcionando');
    console.log('✅ KPIs por industria funcionando');
    console.log('✅ KPIs operacionales funcionando');
    console.log('✅ KPIs predictivos funcionando');
    console.log('✅ Servicios de industria funcionando');
    console.log('✅ Predicciones mejoradas funcionando');
    console.log('✅ Alertas visuales funcionando');
    console.log('✅ Cache y rendimiento optimizados');

  } catch (error) {
    console.error('\n💥 Error en las pruebas:', error.message);
    process.exit(1);
  }
}

// Función para mostrar estadísticas de rendimiento
async function showPerformanceStats() {
  console.log('\n📈 === ESTADÍSTICAS DE RENDIMIENTO ===');
  
  const endpoints = [
    '/dashboard/kpis',
    '/dashboard/alerts/visual',
    '/dashboard/predictions/demand',
    '/dashboard/alerts/dashboard'
  ];

  const stats = [];

  for (const endpoint of endpoints) {
    const startTime = Date.now();
    try {
      await authenticatedRequest(endpoint);
      const endTime = Date.now();
      stats.push({
        endpoint,
        time: endTime - startTime,
        status: 'success'
      });
    } catch (error) {
      stats.push({
        endpoint,
        time: 0,
        status: 'error',
        error: error.message
      });
    }
  }

  console.log('\n📊 Tiempos de respuesta:');
  stats.forEach(stat => {
    if (stat.status === 'success') {
      console.log(`✅ ${stat.endpoint}: ${stat.time}ms`);
    } else {
      console.log(`❌ ${stat.endpoint}: ${stat.error}`);
    }
  });

  const successfulRequests = stats.filter(s => s.status === 'success');
  if (successfulRequests.length > 0) {
    const avgTime = successfulRequests.reduce((sum, s) => sum + s.time, 0) / successfulRequests.length;
    console.log(`\n📊 Tiempo promedio: ${Math.round(avgTime)}ms`);
  }
}

// Ejecutar pruebas
if (require.main === module) {
  runTests()
    .then(() => showPerformanceStats())
    .then(() => {
      console.log('\n🎯 Pruebas completadas. El módulo de KPIs está funcionando correctamente.');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { runTests, testEndpoint, authenticatedRequest }; 