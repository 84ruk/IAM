const axios = require('axios');

const BASE_URL = 'http://localhost:3001';
const USER = {
  email: 'test-security-new@example.com',
  password: 'TestPassword123!'
};

let currentCookies = '';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function login() {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, USER, {
      withCredentials: true
    });
    
    const cookies = response.headers['set-cookie'];
    if (cookies) {
      currentCookies = cookies.join('; ');
    }
    
    return response.data;
  } catch (error) {
    throw new Error(`Login falló: ${error.response?.data?.message || error.message}`);
  }
}

async function debugUserProfile() {
  log('\n🔍 DEBUGGEANDO PERFIL DE USUARIO', 'bold');
  
  try {
    const profileResponse = await axios.get(`${BASE_URL}/auth/me`, {
      headers: { Cookie: currentCookies }
    });
    
    const user = profileResponse.data;
    log('📋 Información del Usuario:', 'blue');
    log(`   ID: ${user.id}`, 'yellow');
    log(`   Email: ${user.email}`, 'yellow');
    log(`   Nombre: ${user.nombre}`, 'yellow');
    log(`   Rol: ${user.rol}`, 'yellow');
    log(`   Empresa ID: ${user.empresaId}`, 'yellow');
    log(`   Empresa Configurada: ${user.empresaConfigurada}`, 'yellow');
    log(`   Setup Completado: ${user.setupCompletado}`, 'yellow');
    log(`   Activo: ${user.activo}`, 'yellow');
    log(`   Fecha Creación: ${user.createdAt}`, 'yellow');
    
    return user;
  } catch (error) {
    log(`❌ Error obteniendo perfil: ${error.response?.data?.message || error.message}`, 'red');
    return null;
  }
}

async function testEndpointWithDetails(endpoint, method = 'GET', data = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: { Cookie: currentCookies }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    log(`✅ ${method} ${endpoint} - Status: ${response.status}`, 'green');
    return { success: true, status: response.status, data: response.data };
  } catch (error) {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;
    log(`❌ ${method} ${endpoint} - Status: ${status} - ${message}`, 'red');
    return { success: false, status, message };
  }
}

async function debugAllEndpoints() {
  log('\n🔍 PROBANDO TODOS LOS ENDPOINTS', 'bold');
  
  const endpoints = [
    { path: '/users', method: 'GET', description: 'Lista de usuarios' },
    { path: '/users/stats', method: 'GET', description: 'Estadísticas de usuarios' },
    { path: '/dashboard', method: 'GET', description: 'Dashboard principal' },
    { path: '/dashboard/kpis', method: 'GET', description: 'KPIs del dashboard' },
    { path: '/inventario/kpis', method: 'GET', description: 'KPIs de inventario' },
    { path: '/inventario/alertas', method: 'GET', description: 'Alertas de inventario' },
    { path: '/movimientos', method: 'GET', description: 'Lista de movimientos' },
    { path: '/proveedores', method: 'GET', description: 'Lista de proveedores' },
    { path: '/pedidos', method: 'GET', description: 'Lista de pedidos' },
    { path: '/admin/stats', method: 'GET', description: 'Estadísticas de admin' },
    { path: '/auth/status', method: 'GET', description: 'Estado de autenticación' },
    { path: '/auth/2fa/status', method: 'GET', description: 'Estado 2FA' }
  ];
  
  const results = [];
  
  for (const endpoint of endpoints) {
    log(`\n🔍 Probando: ${endpoint.description}`, 'blue');
    const result = await testEndpointWithDetails(endpoint.path, endpoint.method);
    results.push({ ...endpoint, ...result });
  }
  
  return results;
}

async function checkDatabaseConnection() {
  log('\n🗄️ VERIFICANDO CONEXIÓN A BASE DE DATOS', 'bold');
  
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    log('✅ Health check exitoso', 'green');
    log(`   Status: ${response.status}`, 'yellow');
    log(`   Data: ${JSON.stringify(response.data)}`, 'yellow');
    return true;
  } catch (error) {
    log(`❌ Health check falló: ${error.message}`, 'red');
    return false;
  }
}

async function runDebug() {
  log('🚀 INICIANDO DEBUG COMPLETO', 'bold');
  log('==========================', 'bold');
  
  // 1. Login
  log('\n🔐 Iniciando sesión...', 'blue');
  const loginData = await login();
  log('✅ Login exitoso', 'green');
  
  // 2. Obtener perfil del usuario
  const user = await debugUserProfile();
  
  // 3. Verificar conexión a BD
  await checkDatabaseConnection();
  
  // 4. Probar todos los endpoints
  const results = await debugAllEndpoints();
  
  // 5. Análisis de resultados
  log('\n📊 ANÁLISIS DE RESULTADOS', 'bold');
  log('========================', 'bold');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  log(`✅ Endpoints exitosos: ${successful.length}/${results.length}`, 'green');
  log(`❌ Endpoints fallidos: ${failed.length}/${results.length}`, 'red');
  
  if (failed.length > 0) {
    log('\n🔍 ENDPOINTS FALLIDOS:', 'bold');
    failed.forEach(endpoint => {
      log(`   ${endpoint.method} ${endpoint.path} - ${endpoint.status}: ${endpoint.message}`, 'red');
    });
  }
  
  // 6. Recomendaciones
  log('\n💡 RECOMENDACIONES:', 'bold');
  
  if (user) {
    if (!user.empresaId) {
      log('⚠️ Usuario sin empresa asignada - configurar empresa', 'yellow');
    }
    if (!user.setupCompletado) {
      log('⚠️ Setup no completado - completar configuración inicial', 'yellow');
    }
    if (user.rol === 'USUARIO') {
      log('⚠️ Usuario con rol básico - verificar permisos', 'yellow');
    }
  }
  
  const forbiddenCount = failed.filter(r => r.status === 403).length;
  if (forbiddenCount > 0) {
    log(`⚠️ ${forbiddenCount} endpoints con error 403 - verificar permisos de usuario`, 'yellow');
  }
  
  const notFoundCount = failed.filter(r => r.status === 404).length;
  if (notFoundCount > 0) {
    log(`⚠️ ${notFoundCount} endpoints no encontrados - verificar rutas`, 'yellow');
  }
}

// Manejar errores no capturados
process.on('unhandledRejection', (error) => {
  log(`❌ Error no manejado: ${error.message}`, 'red');
  process.exit(1);
});

// Ejecutar debug
runDebug().catch(error => {
  log(`❌ Error fatal: ${error.message}`, 'red');
  process.exit(1);
}); 