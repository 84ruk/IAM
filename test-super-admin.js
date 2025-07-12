#!/usr/bin/env node

/**
 * Script de prueba para el Dashboard de Super Admin
 * Verifica que todos los endpoints funcionen correctamente
 */

const API_URL = process.env.API_URL || 'http://localhost:3001';

// Colores para la consola
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

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Función para hacer requests HTTP
async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    const data = await response.json();
    
    return {
      ok: response.ok,
      status: response.status,
      data
    };
  } catch (error) {
    return {
      ok: false,
      error: error.message
    };
  }
}

// Función para simular login de Super Admin
async function loginAsSuperAdmin() {
  logInfo('Iniciando sesión como Super Admin...');
  
  const loginData = {
    email: 'superadmin@iam.com', // Asegúrate de que este usuario existe
    password: 'superadmin123'
  };

  const response = await makeRequest(`${API_URL}/auth/login`, {
    method: 'POST',
    body: JSON.stringify(loginData)
  });

  if (!response.ok) {
    logError(`Error en login: ${response.status} - ${JSON.stringify(response.data)}`);
    return null;
  }

  logSuccess('Login exitoso como Super Admin');
  return response.data;
}

// Función para probar endpoints de Super Admin
async function testSuperAdminEndpoints(cookies) {
  const headers = {
    Cookie: `jwt=${cookies.jwt}`
  };

  logInfo('Probando endpoints de Super Admin...');

  // 1. Dashboard stats
  logInfo('1. Probando GET /super-admin/dashboard');
  const dashboardResponse = await makeRequest(`${API_URL}/super-admin/dashboard`, { headers });
  if (dashboardResponse.ok) {
    logSuccess('Dashboard stats cargados correctamente');
    console.log('   - Total usuarios:', dashboardResponse.data.overview?.totalUsers);
    console.log('   - Total empresas:', dashboardResponse.data.overview?.totalEmpresas);
  } else {
    logError(`Error en dashboard: ${dashboardResponse.status}`);
  }

  // 2. Usuarios globales
  logInfo('2. Probando GET /super-admin/users');
  const usersResponse = await makeRequest(`${API_URL}/super-admin/users`, { headers });
  if (usersResponse.ok) {
    logSuccess('Usuarios globales cargados correctamente');
    console.log('   - Total usuarios:', usersResponse.data.pagination?.total);
  } else {
    logError(`Error en usuarios: ${usersResponse.status}`);
  }

  // 3. Empresas
  logInfo('3. Probando GET /super-admin/empresas');
  const empresasResponse = await makeRequest(`${API_URL}/super-admin/empresas`, { headers });
  if (empresasResponse.ok) {
    logSuccess('Empresas cargadas correctamente');
    console.log('   - Total empresas:', empresasResponse.data?.length);
  } else {
    logError(`Error en empresas: ${empresasResponse.status}`);
  }

  // 4. Estadísticas del sistema
  logInfo('4. Probando GET /super-admin/system-stats');
  const statsResponse = await makeRequest(`${API_URL}/super-admin/system-stats`, { headers });
  if (statsResponse.ok) {
    logSuccess('Estadísticas del sistema cargadas correctamente');
    console.log('   - Salud del sistema:', statsResponse.data.systemHealth);
  } else {
    logError(`Error en stats: ${statsResponse.status}`);
  }

  // 5. Configuración del sistema
  logInfo('5. Probando GET /super-admin/system-config');
  const configResponse = await makeRequest(`${API_URL}/super-admin/system-config`, { headers });
  if (configResponse.ok) {
    logSuccess('Configuración del sistema cargada correctamente');
    console.log('   - Versión:', configResponse.data.systemVersion);
  } else {
    logError(`Error en config: ${configResponse.status}`);
  }

  // 6. Crear un usuario de prueba
  logInfo('6. Probando POST /super-admin/users');
  const newUser = {
    nombre: 'Usuario Prueba SuperAdmin',
    email: 'test-superadmin@example.com',
    password: 'test123456',
    rol: 'EMPLEADO',
    empresaId: '1'
  };

  const createUserResponse = await makeRequest(`${API_URL}/super-admin/users`, {
    method: 'POST',
    headers,
    body: JSON.stringify(newUser)
  });

  if (createUserResponse.ok) {
    logSuccess('Usuario creado correctamente');
    const userId = createUserResponse.data.id;
    
    // 7. Probar activar/desactivar usuario
    logInfo('7. Probando PATCH /super-admin/users/:id/deactivate');
    const deactivateResponse = await makeRequest(`${API_URL}/super-admin/users/${userId}/deactivate`, {
      method: 'PATCH',
      headers
    });
    
    if (deactivateResponse.ok) {
      logSuccess('Usuario desactivado correctamente');
    } else {
      logError(`Error al desactivar usuario: ${deactivateResponse.status}`);
    }

    // 8. Probar activar usuario
    logInfo('8. Probando PATCH /super-admin/users/:id/activate');
    const activateResponse = await makeRequest(`${API_URL}/super-admin/users/${userId}/activate`, {
      method: 'PATCH',
      headers
    });
    
    if (activateResponse.ok) {
      logSuccess('Usuario activado correctamente');
    } else {
      logError(`Error al activar usuario: ${activateResponse.status}`);
    }

    // 9. Eliminar usuario de prueba
    logInfo('9. Probando DELETE /super-admin/users/:id');
    const deleteResponse = await makeRequest(`${API_URL}/super-admin/users/${userId}`, {
      method: 'DELETE',
      headers
    });
    
    if (deleteResponse.ok) {
      logSuccess('Usuario eliminado correctamente');
    } else {
      logError(`Error al eliminar usuario: ${deleteResponse.status}`);
    }
  } else {
    logError(`Error al crear usuario: ${createUserResponse.status}`);
  }
}

// Función principal
async function main() {
  log('🚀 Iniciando pruebas del Dashboard de Super Admin', 'bold');
  log(`📡 API URL: ${API_URL}`, 'blue');
  console.log('');

  try {
    // Login como Super Admin
    const loginResult = await loginAsSuperAdmin();
    if (!loginResult) {
      logError('No se pudo iniciar sesión como Super Admin');
      logWarning('Asegúrate de que existe un usuario con rol SUPERADMIN');
      process.exit(1);
    }

    console.log('');
    
    // Probar endpoints
    await testSuperAdminEndpoints(loginResult);

    console.log('');
    logSuccess('🎉 Todas las pruebas completadas exitosamente!');
    logInfo('El dashboard de Super Admin está funcionando correctamente');

  } catch (error) {
    logError(`Error general: ${error.message}`);
    process.exit(1);
  }
}

// Ejecutar si es el archivo principal
if (require.main === module) {
  main();
}

module.exports = { testSuperAdminEndpoints, loginAsSuperAdmin }; 