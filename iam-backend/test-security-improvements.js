const axios = require('axios');
const crypto = require('crypto');

// Configuración
const BASE_URL = 'http://localhost:3001';
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'TestPassword123!@#';
const WEAK_PASSWORD = '123456';
const STRONG_PASSWORD = 'MySuperSecurePassword123!@#';

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

function logTest(testName, passed, details = '') {
  const status = passed ? '✅ PASÓ' : '❌ FALLÓ';
  const color = passed ? 'green' : 'red';
  log(`${status} ${testName}`, color);
  if (details) {
    log(`   ${details}`, 'yellow');
  }
}

// Función para generar email único
function generateUniqueEmail() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return `test-${timestamp}-${random}@example.com`;
}

// Función para esperar
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Test 1: Validación de contraseñas débiles
async function testPasswordValidation() {
  log('\n🔐 PROBANDO VALIDACIÓN DE CONTRASEÑAS', 'bold');
  
  try {
    // Test contraseña débil
    const weakResponse = await axios.post(`${BASE_URL}/auth/register`, {
      email: generateUniqueEmail(),
      password: WEAK_PASSWORD,
      nombre: 'Test User'
    });
    
    logTest('Contraseña débil rechazada', false, 'Debería haber fallado');
  } catch (error) {
    if (error.response?.status === 400) {
      const errorMessage = error.response.data.message;
      const hasPasswordError = errorMessage.includes('contraseña') || 
                              errorMessage.includes('password') ||
                              errorMessage.includes('mínimo');
      logTest('Contraseña débil rechazada', hasPasswordError, errorMessage);
    } else {
      logTest('Contraseña débil rechazada', false, 'Error inesperado');
    }
  }

  try {
    // Test contraseña con espacios
    const spacePasswordResponse = await axios.post(`${BASE_URL}/auth/register`, {
      email: generateUniqueEmail(),
      password: 'Password With Spaces 123!@#',
      nombre: 'Test User'
    });
    
    logTest('Contraseña con espacios rechazada', false, 'Debería haber fallado');
  } catch (error) {
    if (error.response?.status === 400) {
      const errorMessage = error.response.data.message;
      const hasSpaceError = errorMessage.includes('espacios') || 
                           errorMessage.includes('spaces') ||
                           errorMessage.includes('caracteres');
      logTest('Contraseña con espacios rechazada', hasSpaceError, errorMessage);
    } else {
      logTest('Contraseña con espacios rechazada', false, 'Error inesperado');
    }
  }
}

// Test 2: Registro exitoso con contraseña fuerte
async function testSuccessfulRegistration() {
  log('\n📝 PROBANDO REGISTRO EXITOSO', 'bold');
  
  const testEmail = generateUniqueEmail();
  
  try {
    const response = await axios.post(`${BASE_URL}/auth/register`, {
      email: testEmail,
      password: STRONG_PASSWORD,
      nombre: 'Test User'
    });
    
    const hasTokens = response.data.accessToken && response.data.refreshToken;
    logTest('Registro exitoso con tokens', hasTokens, 
      hasTokens ? 'Tokens generados correctamente' : 'Faltan tokens');
    
    return {
      email: testEmail,
      accessToken: response.data.accessToken,
      refreshToken: response.data.refreshToken
    };
  } catch (error) {
    logTest('Registro exitoso', false, error.response?.data?.message || error.message);
    return null;
  }
}

// Test 3: Login exitoso
async function testSuccessfulLogin() {
  log('\n🔑 PROBANDO LOGIN EXITOSO', 'bold');
  
  const testEmail = generateUniqueEmail();
  
  try {
    // Primero registrar
    await axios.post(`${BASE_URL}/auth/register`, {
      email: testEmail,
      password: STRONG_PASSWORD,
      nombre: 'Test User'
    });
    
    // Luego hacer login
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: testEmail,
      password: STRONG_PASSWORD
    });
    
    const hasTokens = response.data.accessToken && response.data.refreshToken;
    logTest('Login exitoso con tokens', hasTokens, 
      hasTokens ? 'Tokens generados correctamente' : 'Faltan tokens');
    
    return {
      email: testEmail,
      accessToken: response.data.accessToken,
      refreshToken: response.data.refreshToken
    };
  } catch (error) {
    logTest('Login exitoso', false, error.response?.data?.message || error.message);
    return null;
  }
}

// Test 4: Refresh token
async function testRefreshToken(userData) {
  log('\n🔄 PROBANDO REFRESH TOKEN', 'bold');
  
  if (!userData) {
    logTest('Refresh token', false, 'No hay datos de usuario');
    return null;
  }
  
  try {
    const response = await axios.post(`${BASE_URL}/auth/refresh`, {
      refreshToken: userData.refreshToken
    });
    
    const hasNewTokens = response.data.accessToken && response.data.refreshToken;
    const tokensDifferent = response.data.accessToken !== userData.accessToken;
    
    logTest('Refresh token exitoso', hasNewTokens && tokensDifferent, 
      hasNewTokens ? 'Nuevos tokens generados' : 'Error en refresh');
    
    return {
      ...userData,
      accessToken: response.data.accessToken,
      refreshToken: response.data.refreshToken
    };
  } catch (error) {
    logTest('Refresh token', false, error.response?.data?.message || error.message);
    return userData;
  }
}

// Test 5: Acceso protegido con token
async function testProtectedAccess(userData) {
  log('\n🛡️ PROBANDO ACCESO PROTEGIDO', 'bold');
  
  if (!userData) {
    logTest('Acceso protegido', false, 'No hay datos de usuario');
    return;
  }
  
  try {
    const response = await axios.get(`${BASE_URL}/users/profile`, {
      headers: {
        'Authorization': `Bearer ${userData.accessToken}`
      }
    });
    
    logTest('Acceso protegido exitoso', response.status === 200, 
      'Perfil de usuario accedido correctamente');
  } catch (error) {
    logTest('Acceso protegido', false, error.response?.data?.message || error.message);
  }
}

// Test 6: Logout y revocación de tokens
async function testLogout(userData) {
  log('\n🚪 PROBANDO LOGOUT', 'bold');
  
  if (!userData) {
    logTest('Logout', false, 'No hay datos de usuario');
    return;
  }
  
  try {
    const response = await axios.post(`${BASE_URL}/auth/logout`, {}, {
      headers: {
        'Authorization': `Bearer ${userData.accessToken}`
      }
    });
    
    logTest('Logout exitoso', response.status === 200, 'Usuario deslogueado correctamente');
    
    // Verificar que el token ya no funciona
    try {
      await axios.get(`${BASE_URL}/users/profile`, {
        headers: {
          'Authorization': `Bearer ${userData.accessToken}`
        }
      });
      logTest('Token revocado después de logout', false, 'El token aún funciona');
    } catch (error) {
      if (error.response?.status === 401) {
        logTest('Token revocado después de logout', true, 'Token correctamente invalidado');
      } else {
        logTest('Token revocado después de logout', false, 'Error inesperado');
      }
    }
  } catch (error) {
    logTest('Logout', false, error.response?.data?.message || error.message);
  }
}

// Test 7: Rate limiting
async function testRateLimiting() {
  log('\n⏱️ PROBANDO RATE LIMITING', 'bold');
  
  const requests = [];
  const maxRequests = 50; // Reducir para no bloquear tanto
  
  for (let i = 0; i < maxRequests; i++) {
    requests.push(
      axios.post(`${BASE_URL}/auth/login`, {
        email: `test${i}@example.com`,
        password: 'WrongPassword123!@#'
      }).catch(error => error.response)
    );
  }
  
  const responses = await Promise.all(requests);
  const rateLimited = responses.some(response => response?.status === 429);
  const rateLimitedCount = responses.filter(response => response?.status === 429).length;
  
  logTest('Rate limiting activo', rateLimited, 
    rateLimited ? `${rateLimitedCount} requests fueron limitadas` : 'No se detectó rate limiting');
}

// Test 8: Validación de CORS
async function testCORS() {
  log('\n🌍 PROBANDO CONFIGURACIÓN CORS', 'bold');
  
  try {
    const response = await axios.options(`${BASE_URL}/auth/login`, {
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    
    const hasCORSHeaders = response.headers['access-control-allow-origin'] ||
                          response.headers['access-control-allow-credentials'];
    
    logTest('CORS configurado', hasCORSHeaders, 
      hasCORSHeaders ? 'Headers CORS presentes' : 'Headers CORS faltantes');
  } catch (error) {
    logTest('CORS configurado', false, error.message);
  }
}

// Test 9: Headers de seguridad
async function testSecurityHeaders() {
  log('\n🔒 PROBANDO HEADERS DE SEGURIDAD', 'bold');
  
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    
    const securityHeaders = {
      'X-Content-Type-Options': response.headers['x-content-type-options'],
      'X-Frame-Options': response.headers['x-frame-options'],
      'X-XSS-Protection': response.headers['x-xss-protection'],
      'Strict-Transport-Security': response.headers['strict-transport-security']
    };
    
    const hasSecurityHeaders = Object.values(securityHeaders).some(header => header);
    
    logTest('Headers de seguridad presentes', hasSecurityHeaders, 
      hasSecurityHeaders ? 'Headers de seguridad detectados' : 'Headers de seguridad faltantes');
    
    Object.entries(securityHeaders).forEach(([header, value]) => {
      if (value) {
        logTest(`Header ${header}`, true, value);
      }
    });
  } catch (error) {
    logTest('Headers de seguridad', false, error.message);
  }
}

// Test 10: Validación de JWT
async function testJWTValidation() {
  log('\n🎫 PROBANDO VALIDACIÓN JWT', 'bold');
  
  try {
    // Token inválido
    const invalidToken = 'invalid.token.here';
    
    try {
      await axios.get(`${BASE_URL}/users/profile`, {
        headers: {
          'Authorization': `Bearer ${invalidToken}`
        }
      });
      logTest('Token inválido rechazado', false, 'Token inválido fue aceptado');
    } catch (error) {
      if (error.response?.status === 401) {
        logTest('Token inválido rechazado', true, 'Token inválido correctamente rechazado');
      } else {
        logTest('Token inválido rechazado', false, 'Error inesperado');
      }
    }
    
    // Token malformado
    const malformedToken = 'not.a.valid.jwt.token';
    
    try {
      await axios.get(`${BASE_URL}/users/profile`, {
        headers: {
          'Authorization': `Bearer ${malformedToken}`
        }
      });
      logTest('Token malformado rechazado', false, 'Token malformado fue aceptado');
    } catch (error) {
      if (error.response?.status === 401) {
        logTest('Token malformado rechazado', true, 'Token malformado correctamente rechazado');
      } else {
        logTest('Token malformado rechazado', false, 'Error inesperado');
      }
    }
  } catch (error) {
    logTest('Validación JWT', false, error.message);
  }
}

// Función principal
async function runAllTests() {
  log('🚀 INICIANDO PRUEBAS DE SEGURIDAD', 'bold');
  log('================================', 'blue');
  
  // Verificar que el servidor esté corriendo
  try {
    await axios.get(`${BASE_URL}/health`);
    log('✅ Servidor backend está corriendo', 'green');
  } catch (error) {
    log('❌ Servidor backend no está corriendo', 'red');
    log('Ejecuta: npm run start:dev', 'yellow');
    return;
  }
  
  // Ejecutar tests que no requieren rate limiting
  await testSecurityHeaders();
  await testCORS();
  await testJWTValidation();
  await testPasswordValidation();
  
  // Ejecutar test de rate limiting
  await testRateLimiting();
  
  // Esperar a que se resetee el rate limiting
  log('\n⏳ Esperando a que se resetee el rate limiting...', 'yellow');
  await sleep(2000); // Esperar 2 segundos
  
  // Ejecutar tests que requieren autenticación
  const userData = await testSuccessfulRegistration();
  const loginData = await testSuccessfulLogin();
  
  if (userData) {
    await testProtectedAccess(userData);
    const refreshedData = await testRefreshToken(userData);
    await testLogout(refreshedData || userData);
  }
  
  if (loginData) {
    await testProtectedAccess(loginData);
    const refreshedLoginData = await testRefreshToken(loginData);
    await testLogout(refreshedLoginData || loginData);
  }
  
  log('\n🎉 PRUEBAS COMPLETADAS', 'bold');
  log('================================', 'blue');
  log('Revisa los resultados arriba para verificar que todas las mejoras de seguridad funcionen correctamente.', 'yellow');
}

// Ejecutar tests
runAllTests().catch(error => {
  log(`❌ Error en las pruebas: ${error.message}`, 'red');
  process.exit(1);
}); 