#!/usr/bin/env node

const axios = require('axios');

// Configuración
const CONFIG = {
  BASE_URL: process.env.API_URL || 'http://localhost:3001',
  EMAIL: process.env.TEST_EMAIL || 'prueba2@iam.com',
  PASSWORD: process.env.TEST_PASSWORD || 'PruebaIAM123?',
};

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Utilidades de logging
const log = {
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  header: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}`),
};

// Cliente HTTP
const apiClient = axios.create({
  baseURL: CONFIG.BASE_URL,
  timeout: 10000,
  withCredentials: true,
});

// Función para hacer login
async function hacerLogin() {
  log.info('🔑 Iniciando sesión...');
  
  try {
    const response = await apiClient.post('/auth/login', {
      email: CONFIG.EMAIL,
      password: CONFIG.PASSWORD,
    });

    if (response.data && response.data.message === 'Login exitoso') {
      log.success('Login exitoso - Cookies configuradas automáticamente');
      return true;
    } else {
      log.error('Login falló - Respuesta inesperada');
      return false;
    }
  } catch (error) {
    if (error.response?.status === 429) {
      log.warning('Rate limiting activo - Espera 30 minutos o usa otras credenciales');
    } else {
      log.error(`Error en login: ${error.response?.data?.message || error.message}`);
    }
    return false;
  }
}

// Función para probar plantillas
async function probarPlantillas() {
  log.header('📋 PROBANDO ENDPOINTS DE PLANTILLAS');

  try {
    // Listar plantillas
    log.info('1. Listando plantillas disponibles...');
    const response = await apiClient.get('/importacion/plantillas');
    
    if (response.data && response.data.success) {
      log.success(`Plantillas disponibles: ${response.data.plantillas.length} plantillas`);
      response.data.plantillas.forEach(plantilla => {
        log.info(`  - ${plantilla}`);
      });
      return true;
    } else {
      log.error('Error listando plantillas');
      return false;
    }
  } catch (error) {
    log.error(`Error probando plantillas: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// Función para probar gestión de trabajos
async function probarGestionTrabajos() {
  log.header('📋 PROBANDO GESTIÓN DE TRABAJOS');

  try {
    log.info('1. Listando trabajos...');
    const response = await apiClient.get('/importacion/trabajos');
    
    if (response.data) {
      if (response.data.trabajos && Array.isArray(response.data.trabajos)) {
        log.success(`Trabajos encontrados: ${response.data.trabajos.length}`);
        response.data.trabajos.forEach(trabajo => {
          log.info(`  - ID: ${trabajo.id}, Tipo: ${trabajo.tipo}, Estado: ${trabajo.estado}`);
        });
      } else {
        log.success('No hay trabajos pendientes');
      }
      return true;
    } else {
      log.error('Error en gestión de trabajos');
      return false;
    }
  } catch (error) {
    log.error(`Error en gestión de trabajos: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// Función principal
async function ejecutarTests() {
  log.header('🧪 INICIANDO TESTS SIMPLES DEL SISTEMA DE IMPORTACIÓN');
  
  console.log(`\nConfiguración:`);
  console.log(`- URL Base: ${CONFIG.BASE_URL}`);
  console.log(`- Email: ${CONFIG.EMAIL}`);
  console.log(`- Timeout: 10000ms`);

  const resultados = {
    login: false,
    plantillas: false,
    trabajos: false,
  };

  try {
    // 1. Login
    resultados.login = await hacerLogin();
    if (!resultados.login) {
      log.error('No se pudo hacer login - Abortando tests');
      return;
    }

    // 2. Probar plantillas
    resultados.plantillas = await probarPlantillas();

    // 3. Probar gestión de trabajos
    resultados.trabajos = await probarGestionTrabajos();

  } catch (error) {
    log.error(`Error general en tests: ${error.message}`);
  }

  // Mostrar resumen
  mostrarResumen(resultados);
}

// Función para mostrar resumen
function mostrarResumen(resultados) {
  log.header('📊 RESUMEN DE TESTS');

  console.log('\nResultados:');
  console.log(`- Login: ${resultados.login ? '✅' : '❌'}`);
  console.log(`- Plantillas: ${resultados.plantillas ? '✅' : '❌'}`);
  console.log(`- Gestión de Trabajos: ${resultados.trabajos ? '✅' : '❌'}`);

  const totalTests = Object.keys(resultados).length;
  const testsExitosos = Object.values(resultados).filter(Boolean).length;
  const tasaExito = ((testsExitosos / totalTests) * 100).toFixed(1);

  console.log(`\nEstadísticas:`);
  console.log(`- Tests ejecutados: ${totalTests}`);
  console.log(`- Tests exitosos: ${testsExitosos}`);
  console.log(`- Tests fallidos: ${totalTests - testsExitosos}`);
  console.log(`- Tasa de éxito: ${tasaExito}%`);

  if (testsExitosos === totalTests) {
    log.success('🎉 ¡Todos los tests pasaron exitosamente!');
    log.success('✅ El sistema de importación está funcionando correctamente');
  } else {
    log.warning('⚠️  Algunos tests fallaron. Revisa los logs para más detalles.');
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  ejecutarTests().catch(console.error);
}

module.exports = { ejecutarTests }; 