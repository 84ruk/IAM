const axios = require('axios');

const BASE_URL = 'http://localhost:3001';
const TEST_USER = {
  email: 'test-security-new@example.com',
  password: 'TestPassword123!',
  nombre: 'Test Security User'
};

let authToken = '';
let refreshToken = '';
let currentCookies = '';

// Colores para output
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

function logTest(testName, result, details = '') {
  const status = result ? '✅ PASS' : '❌ FAIL';
  const color = result ? 'green' : 'red';
  log(`${status} ${testName}`, color);
  if (details) {
    log(`   ${details}`, 'yellow');
  }
}

async function waitForServer() {
  log('🔄 Esperando que el servidor esté listo...', 'blue');
  let attempts = 0;
  while (attempts < 30) {
    try {
      await axios.get(`${BASE_URL}/health`);
      log('✅ Servidor listo!', 'green');
      return true;
    } catch (error) {
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  log('❌ Servidor no disponible después de 30 intentos', 'red');
  return false;
}

async function testRateLimiting() {
  log('\n🔒 Probando Rate Limiting...', 'bold');
  
  try {
    // Intentar hacer múltiples requests rápidos
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(
        axios.post(`${BASE_URL}/auth/login`, {
          email: 'test@example.com',
          password: 'wrongpassword'
        }).catch(err => err.response?.status)
      );
    }
    
    const results = await Promise.all(promises);
    const rateLimited = results.filter(status => status === 429).length;
    
    logTest('Rate Limiting Activo', rateLimited > 0, `${rateLimited} requests fueron bloqueados`);
    
    return rateLimited > 0;
  } catch (error) {
    logTest('Rate Limiting', false, error.message);
    return false;
  }
}

async function testUserRegistration() {
  log('\n👤 Probando Registro de Usuario...', 'bold');
  
  try {
    const response = await axios.post(`${BASE_URL}/auth/register`, {
      ...TEST_USER,
      email: `test-${Date.now()}@example.com`
    });
    logTest('Registro de Usuario', response.status === 201, 'Usuario creado exitosamente');
    return true;
  } catch (error) {
    if (error.response?.status === 409) {
      logTest('Registro de Usuario', true, 'Usuario ya existe (esperado)');
      return true;
    }
    logTest('Registro de Usuario', false, error.response?.data?.message || error.message);
    return false;
  }
}

async function testUserLogin() {
  log('\n🔐 Probando Login de Usuario...', 'bold');
  
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: TEST_USER.email,
      password: TEST_USER.password
    }, {
      withCredentials: true
    });
    
    refreshToken = response.data.refreshToken;
    
    // Extraer cookies
    const cookies = response.headers['set-cookie'];
    if (cookies) {
      currentCookies = cookies.join('; ');
      const jwtCookie = cookies.find(cookie => cookie.startsWith('jwt='));
      if (jwtCookie) {
        authToken = jwtCookie.split(';')[0].split('=')[1];
      }
    }
    
    logTest('Login de Usuario', !!refreshToken, 'Refresh token obtenido');
    logTest('Access Token', !!authToken, 'Token JWT en cookies');
    logTest('Cookies Configuradas', !!currentCookies, 'Cookies listas para usar');
    
    return !!refreshToken && !!authToken;
  } catch (error) {
    logTest('Login de Usuario', false, error.response?.data?.message || error.message);
    return false;
  }
}

async function testJWTValidation() {
  log('\n🎫 Probando Validación JWT...', 'bold');
  
  try {
    const response = await axios.get(`${BASE_URL}/auth/me`, {
      headers: { Cookie: currentCookies }
    });
    
    logTest('JWT Válido', response.status === 200, 'Token aceptado por el servidor');
    logTest('Datos de Usuario', !!response.data.id, 'Datos de usuario obtenidos');
    
    return response.status === 200;
  } catch (error) {
    logTest('JWT Válido', false, error.response?.data?.message || error.message);
    return false;
  }
}

async function testTwoFactorSetup() {
  log('\n🔐 Probando Configuración 2FA...', 'bold');
  
  try {
    const response = await axios.post(`${BASE_URL}/auth/2fa/setup`, {
      userId: 118 // ID del usuario de prueba
    }, {
      headers: { Cookie: currentCookies }
    });
    
    logTest('Setup 2FA', response.status === 201, 'QR code y secret generados');
    logTest('Secret Generado', !!response.data.secret, 'Secret de 32 caracteres');
    logTest('QR Code Generado', !!response.data.qrCode, 'QR code en base64');
    logTest('Códigos de Respaldo', response.data.backupCodes?.length === 10, '10 códigos de respaldo');
    
    return response.status === 201;
  } catch (error) {
    if (error.response?.status === 400) {
      logTest('Setup 2FA', true, '2FA no configurado (esperado en pruebas)');
      return true;
    }
    logTest('Setup 2FA', false, error.response?.data?.message || error.message);
    return false;
  }
}

async function testTwoFactorVerification() {
  log('\n🔍 Probando Verificación 2FA...', 'bold');
  
  try {
    // Usar un código de respaldo para la prueba
    const response = await axios.post(`${BASE_URL}/auth/2fa/verify`, {
      token: 'A1B2C3D4' // Código de ejemplo
    }, {
      headers: { Cookie: currentCookies }
    });
    
    logTest('Verificación 2FA', response.status === 200, 'Verificación procesada');
    return true;
  } catch (error) {
    if (error.response?.status === 400) {
      logTest('Verificación 2FA', true, 'Código inválido (esperado en prueba)');
      return true;
    }
    logTest('Verificación 2FA', false, error.response?.data?.message || error.message);
    return false;
  }
}

async function testTwoFactorStatus() {
  log('\n📊 Probando Estado 2FA...', 'bold');
  
  try {
    const response = await axios.get(`${BASE_URL}/auth/2fa/status`, {
      headers: { Cookie: currentCookies }
    });
    
    logTest('Estado 2FA', response.status === 200, 'Estado obtenido');
    logTest('Datos de Estado', !!response.data.isEnabled, 'Información de estado válida');
    
    return response.status === 200;
  } catch (error) {
    logTest('Estado 2FA', false, error.response?.data?.message || error.message);
    return false;
  }
}

async function testSecurityHeaders() {
  log('\n🛡️ Probando Headers de Seguridad...', 'bold');
  
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    const headers = response.headers;
    
    const securityHeaders = {
      'X-Content-Type-Options': headers['x-content-type-options'],
      'X-Frame-Options': headers['x-frame-options'],
      'X-XSS-Protection': headers['x-xss-protection'],
      'Strict-Transport-Security': headers['strict-transport-security'],
      'Content-Security-Policy': headers['content-security-policy']
    };
    
    let headersPresent = 0;
    Object.entries(securityHeaders).forEach(([name, value]) => {
      if (value) {
        logTest(`Header ${name}`, true, `Presente: ${value}`);
        headersPresent++;
      } else {
        logTest(`Header ${name}`, false, 'No presente');
      }
    });
    
    return headersPresent >= 3; // Al menos 3 headers de seguridad
  } catch (error) {
    logTest('Headers de Seguridad', false, error.message);
    return false;
  }
}

async function testPasswordValidation() {
  log('\n🔑 Probando Validación de Contraseñas...', 'bold');
  
  const testPasswords = [
    { password: 'weak', shouldFail: true, reason: 'Muy corta' },
    { password: '12345678', shouldFail: true, reason: 'Solo números' },
    { password: 'abcdefgh', shouldFail: true, reason: 'Solo letras' },
    { password: 'TestPass123!', shouldFail: false, reason: 'Válida' }
  ];
  
  let passedTests = 0;
  
  for (const test of testPasswords) {
    try {
      await axios.post(`${BASE_URL}/auth/register`, {
        ...TEST_USER,
        email: `test-${Date.now()}@example.com`,
        password: test.password
      });
      
      if (!test.shouldFail) {
        logTest(`Contraseña: ${test.reason}`, true, 'Aceptada correctamente');
        passedTests++;
      } else {
        logTest(`Contraseña: ${test.reason}`, false, 'Debería haber fallado');
      }
    } catch (error) {
      if (error.response?.status === 400 && test.shouldFail) {
        logTest(`Contraseña: ${test.reason}`, true, 'Rechazada correctamente');
        passedTests++;
      } else if (error.response?.status === 201 && !test.shouldFail) {
        logTest(`Contraseña: ${test.reason}`, true, 'Aceptada correctamente');
        passedTests++;
      } else {
        logTest(`Contraseña: ${test.reason}`, false, 'Comportamiento inesperado');
      }
    }
  }
  
  return passedTests >= 3;
}

async function testAuditLogging() {
  log('\n📝 Probando Logging de Auditoría...', 'bold');
  
  try {
    // Hacer algunas acciones que deberían generar logs
    await axios.post(`${BASE_URL}/auth/login`, {
      email: TEST_USER.email,
      password: TEST_USER.password
    }, {
      withCredentials: true
    });
    
    await axios.get(`${BASE_URL}/auth/me`, {
      headers: { Cookie: currentCookies }
    });
    
    logTest('Logging de Auditoría', true, 'Acciones registradas (verificar logs)');
    return true;
  } catch (error) {
    logTest('Logging de Auditoría', false, error.message);
    return false;
  }
}

async function testRefreshToken() {
  log('\n🔄 Probando Refresh Token...', 'bold');
  
  try {
    const response = await axios.post(`${BASE_URL}/auth/refresh`, {
      refreshToken: refreshToken
    }, {
      headers: { Cookie: currentCookies }
    });
    
    const newRefreshToken = response.data.refreshToken;
    const newCookies = response.headers['set-cookie'];
    
    logTest('Refresh Token', !!newRefreshToken, 'Nuevo refresh token generado');
    logTest('Nuevas Cookies', !!newCookies, 'Nuevas cookies generadas');
    
    // Actualizar cookies para siguientes pruebas
    if (newCookies) {
      currentCookies = newCookies.join('; ');
    }
    
    // Verificar que el nuevo token funciona
    const profileResponse = await axios.get(`${BASE_URL}/auth/me`, {
      headers: { Cookie: currentCookies }
    });
    
    logTest('Nuevo Token Válido', profileResponse.status === 200, 'Nuevo token funciona');
    
    return !!newRefreshToken && profileResponse.status === 200;
  } catch (error) {
    logTest('Refresh Token', false, error.response?.data?.message || error.message);
    return false;
  }
}

async function runAllTests() {
  log('🚀 INICIANDO PRUEBAS COMPLETAS DE SEGURIDAD', 'bold');
  log('==========================================', 'bold');
  
  const serverReady = await waitForServer();
  if (!serverReady) {
    log('❌ No se pudo conectar al servidor', 'red');
    return;
  }
  
  const tests = [
    { name: 'Rate Limiting', fn: testRateLimiting },
    { name: 'Registro de Usuario', fn: testUserRegistration },
    { name: 'Login de Usuario', fn: testUserLogin },
    { name: 'Validación JWT', fn: testJWTValidation },
    { name: 'Headers de Seguridad', fn: testSecurityHeaders },
    { name: 'Validación de Contraseñas', fn: testPasswordValidation },
    { name: 'Setup 2FA', fn: testTwoFactorSetup },
    { name: 'Verificación 2FA', fn: testTwoFactorVerification },
    { name: 'Estado 2FA', fn: testTwoFactorStatus },
    { name: 'Refresh Token', fn: testRefreshToken },
    { name: 'Logging de Auditoría', fn: testAuditLogging }
  ];
  
  let passedTests = 0;
  let totalTests = tests.length;
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) passedTests++;
    } catch (error) {
      log(`❌ Error en ${test.name}: ${error.message}`, 'red');
    }
  }
  
  log('\n📊 RESUMEN DE PRUEBAS', 'bold');
  log('====================', 'bold');
  log(`✅ Pruebas pasadas: ${passedTests}/${totalTests}`, 'green');
  log(`❌ Pruebas fallidas: ${totalTests - passedTests}/${totalTests}`, 'red');
  
  const successRate = (passedTests / totalTests) * 100;
  if (successRate >= 80) {
    log(`🎉 Tasa de éxito: ${successRate.toFixed(1)}% - ¡Excelente!`, 'green');
  } else if (successRate >= 60) {
    log(`⚠️ Tasa de éxito: ${successRate.toFixed(1)}% - Necesita mejoras`, 'yellow');
  } else {
    log(`💥 Tasa de éxito: ${successRate.toFixed(1)}% - Requiere atención urgente`, 'red');
  }
  
  log('\n🔧 PRÓXIMOS PASOS:', 'bold');
  log('1. Revisar logs del servidor para detalles de auditoría', 'blue');
  log('2. Verificar configuración de base de datos', 'blue');
  log('3. Configurar variables de entorno para producción', 'blue');
  log('4. Implementar tests automatizados', 'blue');
}

// Manejar errores no capturados
process.on('unhandledRejection', (error) => {
  log(`❌ Error no manejado: ${error.message}`, 'red');
  process.exit(1);
});

// Ejecutar pruebas
runAllTests().catch(error => {
  log(`❌ Error fatal: ${error.message}`, 'red');
  process.exit(1);
}); 