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

async function getCurrentUser() {
  try {
    const response = await axios.get(`${BASE_URL}/auth/me`, {
      headers: { Cookie: currentCookies }
    });
    return response.data;
  } catch (error) {
    throw new Error(`Error obteniendo usuario: ${error.response?.data?.message || error.message}`);
  }
}

async function setupEmpresa() {
  log('\n⚙️ Configurando empresa para el usuario...', 'blue');
  
  try {
    const user = await getCurrentUser();
    log(`Usuario actual: ${user.email} (ID: ${user.id})`, 'yellow');
    
    // Usar el endpoint correcto de setup de empresa
    const setupData = {
      nombreEmpresa: 'Empresa de Prueba IAM',
      tipoIndustria: 'GENERICA',
      direccion: 'Dirección de Prueba 123',
      telefono: '+51 999 999 999'
    };
    
    const response = await axios.post(`${BASE_URL}/auth/setup-empresa`, setupData, {
      headers: { Cookie: currentCookies }
    });
    
    // Actualizar cookies si se recibieron nuevas
    const newCookies = response.headers['set-cookie'];
    if (newCookies) {
      currentCookies = newCookies.join('; ');
    }
    
    log('✅ Empresa configurada exitosamente', 'green');
    log(`   Empresa ID: ${response.data.empresa.id}`, 'yellow');
    log(`   Empresa Nombre: ${response.data.empresa.nombre}`, 'yellow');
    log(`   Setup Completado: ${response.data.user.setupCompletado}`, 'yellow');
    
    return response.data;
  } catch (error) {
    throw new Error(`Error configurando empresa: ${error.response?.data?.message || error.message}`);
  }
}

async function verifySetup() {
  log('\n🔍 Verificando configuración...', 'blue');
  
  try {
    const user = await getCurrentUser();
    
    log('📋 Estado actual del usuario:', 'blue');
    log(`   ID: ${user.id}`, 'yellow');
    log(`   Email: ${user.email}`, 'yellow');
    log(`   Rol: ${user.rol}`, 'yellow');
    log(`   Empresa ID: ${user.empresaId}`, 'yellow');
    log(`   Setup Completado: ${user.setupCompletado}`, 'yellow');
    
    if (user.empresaId && user.setupCompletado) {
      log('✅ Usuario correctamente configurado', 'green');
      return true;
    } else {
      log('❌ Usuario no configurado correctamente', 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Error verificando configuración: ${error.message}`, 'red');
    return false;
  }
}

async function testProtectedEndpoints() {
  log('\n🔒 Probando endpoints protegidos...', 'blue');
  
  const endpoints = [
    { path: '/dashboard/kpis', description: 'KPIs del Dashboard' },
    { path: '/inventario/kpis', description: 'KPIs de Inventario' },
    { path: '/inventario/alertas', description: 'Alertas de Inventario' },
    { path: '/movimientos', method: 'GET', description: 'Movimientos' },
    { path: '/proveedores', method: 'GET', description: 'Proveedores' },
    { path: '/pedidos', method: 'GET', description: 'Pedidos' }
  ];
  
  let successCount = 0;
  
  for (const endpoint of endpoints) {
    try {
      const method = endpoint.method || 'GET';
      const response = await axios({
        method,
        url: `${BASE_URL}${endpoint.path}`,
        headers: { Cookie: currentCookies }
      });
      log(`✅ ${endpoint.description} - Status: ${response.status}`, 'green');
      successCount++;
    } catch (error) {
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message;
      log(`❌ ${endpoint.description} - Status: ${status} - ${message}`, 'red');
    }
  }
  
  log(`\n📊 Resultado: ${successCount}/${endpoints.length} endpoints funcionando`, successCount === endpoints.length ? 'green' : 'yellow');
  return successCount === endpoints.length;
}

async function runSetup() {
  log('🚀 CONFIGURANDO EMPRESA PARA USUARIO DE PRUEBA', 'bold');
  log('==============================================', 'bold');
  
  try {
    // 1. Login
    log('\n🔐 Iniciando sesión...', 'blue');
    await login();
    log('✅ Login exitoso', 'green');
    
    // 2. Verificar estado actual
    log('\n📋 Estado inicial del usuario:', 'blue');
    const initialUser = await getCurrentUser();
    log(`   Empresa ID: ${initialUser.empresaId || 'No configurada'}`, 'yellow');
    log(`   Setup Completado: ${initialUser.setupCompletado || false}`, 'yellow');
    
    // 3. Configurar empresa si es necesario
    if (!initialUser.empresaId || !initialUser.setupCompletado) {
      await setupEmpresa();
    } else {
      log('✅ Usuario ya tiene empresa configurada', 'green');
    }
    
    // 4. Verificar configuración
    const setupOk = await verifySetup();
    
    if (setupOk) {
      // 5. Probar endpoints protegidos
      const endpointsOk = await testProtectedEndpoints();
      
      if (endpointsOk) {
        log('\n🎉 ¡CONFIGURACIÓN COMPLETADA EXITOSAMENTE!', 'bold');
        log('Todos los módulos están funcionando correctamente', 'green');
      } else {
        log('\n⚠️ Configuración completada pero algunos endpoints fallan', 'yellow');
      }
    } else {
      log('\n❌ Error en la configuración', 'red');
    }
    
  } catch (error) {
    log(`❌ Error durante la configuración: ${error.message}`, 'red');
  }
}

// Manejar errores no capturados
process.on('unhandledRejection', (error) => {
  log(`❌ Error no manejado: ${error.message}`, 'red');
  process.exit(1);
});

// Ejecutar setup
runSetup().catch(error => {
  log(`❌ Error fatal: ${error.message}`, 'red');
  process.exit(1);
}); 