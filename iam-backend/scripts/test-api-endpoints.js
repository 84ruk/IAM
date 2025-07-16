const axios = require('axios');

const BASE_URL = process.env.API_URL || 'http://localhost:3001';

// Colores para la consola
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

let authToken = null;
let empresaId = null;

async function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEndpoint(method, endpoint, data = null, expectedStatus = 200) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { 'Authorization': `Bearer ${authToken}` })
      },
      ...(data && { data })
    };

    const response = await axios(config);
    
    if (response.status === expectedStatus) {
      await log(`✅ ${method} ${endpoint} - ${response.status}`, 'green');
      return { success: true, data: response.data };
    } else {
      await log(`❌ ${method} ${endpoint} - Expected ${expectedStatus}, got ${response.status}`, 'red');
      return { success: false, error: `Expected ${expectedStatus}, got ${response.status}` };
    }
  } catch (error) {
    if (error.response && error.response.status === expectedStatus) {
      await log(`✅ ${method} ${endpoint} - ${error.response.status} (Expected error)`, 'green');
      return { success: true, data: error.response.data };
    } else {
      await log(`❌ ${method} ${endpoint} - ${error.response?.status || 'Network Error'}`, 'red');
      return { success: false, error: error.message };
    }
  }
}

async function testAuthentication() {
  await log('\n🔐 Testing Authentication Endpoints...', 'blue');
  
  // Test login
  const loginResult = await testEndpoint('POST', '/auth/login', {
    email: 'admin@test.com',
    password: 'admin123'
  });
  
  if (loginResult.success) {
    authToken = loginResult.data.access_token;
    await log(`✅ Authentication successful, token obtained`, 'green');
  }
  
  // Test protected endpoint
  await testEndpoint('GET', '/auth/profile', null, 200);
  
  // Test invalid token
  const originalToken = authToken;
  authToken = 'invalid-token';
  await testEndpoint('GET', '/auth/profile', null, 401);
  authToken = originalToken;
}

async function testDashboardEndpoints() {
  await log('\n📊 Testing Dashboard Endpoints...', 'blue');
  
  await testEndpoint('GET', '/dashboard/kpis');
  await testEndpoint('GET', '/dashboard/financial-kpis');
  await testEndpoint('GET', '/dashboard/advanced-kpis');
  await testEndpoint('GET', '/dashboard/data');
  await testEndpoint('GET', '/dashboard/productos-kpi');
  await testEndpoint('GET', '/dashboard/movimientos-por-producto');
}

async function testSensorsEndpoints() {
  await log('\n📡 Testing Sensors Endpoints...', 'blue');
  
  // Test sensor reading
  const sensorData = {
    tipo: 'TEMPERATURA',
    valor: 25.5,
    unidad: '°C',
    productoId: 1
  };
  
  await testEndpoint('POST', '/sensores/lectura', sensorData);
  
  // Test analytics (if endpoint exists)
  await testEndpoint('GET', '/sensores/analytics');
  await testEndpoint('GET', '/sensores/alertas');
  await testEndpoint('POST', '/sensores/simular');
}

async function testProductEndpoints() {
  await log('\n📦 Testing Product Endpoints...', 'blue');
  
  const productData = {
    nombre: 'Producto Test API',
    descripcion: 'Producto de prueba para testing',
    stock: 100,
    precioCompra: 10.50,
    precioVenta: 15.00,
    stockMinimo: 10,
    tipoProducto: 'GENERICO',
    unidad: 'UNIDAD'
  };
  
  // Create product
  const createResult = await testEndpoint('POST', '/producto', productData);
  
  if (createResult.success) {
    const productId = createResult.data.id;
    
    // Get product
    await testEndpoint('GET', `/producto/${productId}`);
    
    // Update product
    await testEndpoint('PUT', `/producto/${productId}`, {
      stock: 150,
      precioVenta: 18.00
    });
    
    // Get all products
    await testEndpoint('GET', '/producto');
    
    // Delete product
    await testEndpoint('DELETE', `/producto/${productId}`);
  }
}

async function testMovementEndpoints() {
  await log('\n🔄 Testing Movement Endpoints...', 'blue');
  
  const movementData = {
    tipo: 'ENTRADA',
    cantidad: 50,
    motivo: 'Compra de prueba',
    descripcion: 'Movimiento de prueba para testing',
    productoId: 1
  };
  
  await testEndpoint('POST', '/movimiento', movementData);
  await testEndpoint('GET', '/movimiento');
}

async function testHealthEndpoints() {
  await log('\n🏥 Testing Health Endpoints...', 'blue');
  
  await testEndpoint('GET', '/health');
  await testEndpoint('GET', '/health/detailed');
  await testEndpoint('GET', '/health/database');
  await testEndpoint('GET', '/health/redis');
}

async function testErrorHandling() {
  await log('\n🚨 Testing Error Handling...', 'blue');
  
  // Test 404
  await testEndpoint('GET', '/endpoint-que-no-existe', null, 404);
  
  // Test invalid data
  await testEndpoint('POST', '/producto', { invalid: 'data' }, 400);
  
  // Test unauthorized
  authToken = null;
  await testEndpoint('GET', '/dashboard/kpis', null, 401);
}

async function runAllTests() {
  await log('🚀 Starting API Endpoints Testing...', 'bold');
  await log(`Base URL: ${BASE_URL}`, 'yellow');
  
  try {
    await testHealthEndpoints();
    await testAuthentication();
    await testDashboardEndpoints();
    await testSensorsEndpoints();
    await testProductEndpoints();
    await testMovementEndpoints();
    await testErrorHandling();
    
    await log('\n🎉 All API tests completed!', 'green');
  } catch (error) {
    await log(`\n💥 Test suite failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = { runAllTests, testEndpoint }; 