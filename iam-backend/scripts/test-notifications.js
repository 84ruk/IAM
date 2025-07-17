#!/usr/bin/env node

/**
 * 🧪 Script de Prueba para Sistema de Notificaciones
 * 
 * Este script prueba:
 * - Plantillas de email con MJML
 * - Configuración de SendGrid
 * - Endpoints de notificaciones
 * - Historial de alertas
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuración
const BASE_URL = process.env.API_URL || 'http://localhost:3001';
const TEST_EMAIL = process.env.TEST_EMAIL || 'test@example.com';

// Colores para console
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(`🧪 ${title}`, 'cyan');
  console.log('='.repeat(60));
}

function logTest(testName, success, details = '') {
  const status = success ? '✅' : '❌';
  const color = success ? 'green' : 'red';
  log(`${status} ${testName}`, color);
  if (details) {
    log(`   ${details}`, 'yellow');
  }
}

// Función para hacer requests autenticados
async function makeAuthenticatedRequest(method, endpoint, data = null, token = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message,
      status: error.response?.status,
    };
  }
}

// Función para obtener token de autenticación
async function getAuthToken() {
  log('🔐 Obteniendo token de autenticación...', 'blue');
  
  // Intentar login con credenciales de prueba
  const loginData = {
    email: 'admin@test.com',
    password: 'password123'
  };

  const result = await makeAuthenticatedRequest('POST', '/auth/login', loginData);
  
  if (result.success && result.data.access_token) {
    log('✅ Token obtenido exitosamente', 'green');
    return result.data.access_token;
  } else {
    log('❌ No se pudo obtener token, usando modo sin autenticación', 'red');
    return null;
  }
}

// Prueba 1: Verificar que el servidor esté funcionando
async function testServerHealth() {
  logSection('Verificación del Servidor');
  
  const result = await makeAuthenticatedRequest('GET', '/health');
  logTest('Servidor respondiendo', result.success, result.error || 'OK');
  
  if (!result.success) {
    log('⚠️  Asegúrate de que el servidor esté ejecutándose en ' + BASE_URL, 'yellow');
  }
}

// Prueba 2: Probar plantillas de email
async function testEmailTemplates() {
  logSection('Prueba de Plantillas de Email');
  
  const templates = [
    {
      name: 'Password Reset',
      endpoint: '/notifications/test-email',
      data: { email: TEST_EMAIL, tipo: 'password-reset' }
    },
    {
      name: 'Welcome Email',
      endpoint: '/notifications/test-email',
      data: { email: TEST_EMAIL, tipo: 'welcome' }
    },
    {
      name: 'Stock Critical',
      endpoint: '/notifications/test-email',
      data: { email: TEST_EMAIL, tipo: 'stock-critical' }
    },
    {
      name: 'Stockout Prediction',
      endpoint: '/notifications/test-email',
      data: { email: TEST_EMAIL, tipo: 'stockout-prediction' }
    },
    {
      name: 'Sensor Alert',
      endpoint: '/notifications/test-email',
      data: { email: TEST_EMAIL, tipo: 'sensor-alert' }
    },
    {
      name: 'Expiry Alert',
      endpoint: '/notifications/test-email',
      data: { email: TEST_EMAIL, tipo: 'expiry-alert' }
    },
    {
      name: 'KPI Alert',
      endpoint: '/notifications/test-email',
      data: { email: TEST_EMAIL, tipo: 'kpi-alert' }
    }
  ];

  const token = await getAuthToken();
  
  for (const template of templates) {
    const result = await makeAuthenticatedRequest('POST', template.endpoint, template.data, token);
    logTest(
      `Plantilla: ${template.name}`,
      result.success,
      result.success ? 'Email enviado' : result.error
    );
    
    // Esperar un poco entre requests para no sobrecargar
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

// Prueba 3: Probar configuración de alertas
async function testAlertConfiguration() {
  logSection('Prueba de Configuración de Alertas');
  
  const token = await getAuthToken();
  
  // Obtener configuración actual
  const getConfig = await makeAuthenticatedRequest('GET', '/notifications/config', null, token);
  logTest('Obtener configuración', getConfig.success, getConfig.error || `${getConfig.data?.length || 0} configuraciones encontradas`);
  
  if (getConfig.success && getConfig.data.length > 0) {
    const config = getConfig.data[0];
    
    // Actualizar configuración
    const updateData = {
      destinatarios: [TEST_EMAIL],
      activo: true,
      frecuencia: 'INMEDIATA'
    };
    
    const updateConfig = await makeAuthenticatedRequest(
      'PUT',
      `/notifications/config/${config.id}`,
      updateData,
      token
    );
    
    logTest('Actualizar configuración', updateConfig.success, updateConfig.error || 'Configuración actualizada');
  }
}

// Prueba 4: Probar historial de alertas
async function testAlertHistory() {
  logSection('Prueba de Historial de Alertas');
  
  const token = await getAuthToken();
  
  // Obtener historial
  const history = await makeAuthenticatedRequest('GET', '/notifications/history', null, token);
  logTest('Obtener historial', history.success, history.error || `${history.data?.alertas?.length || 0} alertas encontradas`);
  
  // Obtener estadísticas
  const stats = await makeAuthenticatedRequest('GET', '/notifications/stats', null, token);
  logTest('Obtener estadísticas', stats.success, stats.error || 'Estadísticas obtenidas');
  
  // Obtener resumen
  const summary = await makeAuthenticatedRequest('GET', '/notifications/summary', null, token);
  logTest('Obtener resumen', summary.success, summary.error || 'Resumen obtenido');
  
  if (stats.success) {
    log('\n📊 Estadísticas de Notificaciones:', 'cyan');
    log(`   Total enviadas: ${stats.data.totalEnviadas}`, 'blue');
    log(`   Exitosas: ${stats.data.exitosas}`, 'green');
    log(`   Fallidas: ${stats.data.fallidas}`, 'red');
  }
}

// Prueba 5: Verificar variables de entorno
function testEnvironmentVariables() {
  logSection('Verificación de Variables de Entorno');
  
  const requiredVars = [
    'SENDGRID_API_KEY',
    'SMTP_HOST',
    'SMTP_PORT',
    'FROM_EMAIL',
    'FRONTEND_URL'
  ];
  
  const optionalVars = [
    'SMTP_SECURE',
    'SMTP_USER'
  ];
  
  log('🔧 Variables Requeridas:', 'blue');
  for (const varName of requiredVars) {
    const value = process.env[varName];
    const exists = !!value;
    logTest(
      `${varName}`,
      exists,
      exists ? 'Configurada' : 'No configurada'
    );
  }
  
  log('\n🔧 Variables Opcionales:', 'blue');
  for (const varName of optionalVars) {
    const value = process.env[varName];
    const exists = !!value;
    logTest(
      `${varName}`,
      true, // Siempre pasa porque es opcional
      exists ? `Configurada: ${value}` : 'No configurada (usando valor por defecto)'
    );
  }
}

// Prueba 6: Verificar dependencias
function testDependencies() {
  logSection('Verificación de Dependencias');
  
  const dependencies = [
    { name: '@nestjs-modules/mailer', required: true },
    { name: 'mjml', required: true },
    { name: '@types/mjml', required: true }
  ];
  
  for (const dep of dependencies) {
    try {
      require.resolve(dep.name);
      logTest(`Dependencia: ${dep.name}`, true, 'Instalada');
    } catch (error) {
      logTest(`Dependencia: ${dep.name}`, !dep.required, dep.required ? 'No instalada' : 'No instalada (opcional)');
    }
  }
}

// Función principal
async function runTests() {
  log('🚀 Iniciando Pruebas del Sistema de Notificaciones', 'bold');
  log(`📍 URL Base: ${BASE_URL}`, 'blue');
  log(`📧 Email de Prueba: ${TEST_EMAIL}`, 'blue');
  
  try {
    // Pruebas básicas
    testEnvironmentVariables();
    testDependencies();
    await testServerHealth();
    
    // Pruebas de funcionalidad
    await testEmailTemplates();
    await testAlertConfiguration();
    await testAlertHistory();
    
    logSection('Resumen de Pruebas');
    log('✅ Todas las pruebas completadas', 'green');
    log('\n📝 Próximos pasos:', 'cyan');
    log('1. Configura las variables de entorno en tu archivo .env', 'blue');
    log('2. Obtén una API Key de SendGrid', 'blue');
    log('3. Verifica tu dominio de email en SendGrid', 'blue');
    log('4. Ejecuta las pruebas nuevamente', 'blue');
    
  } catch (error) {
    log('❌ Error durante las pruebas:', 'red');
    log(error.message, 'red');
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  runTests();
}

module.exports = {
  runTests,
  testEmailTemplates,
  testAlertConfiguration,
  testAlertHistory
}; 