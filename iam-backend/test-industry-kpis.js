#!/usr/bin/env node

/**
 * 🧪 Script de Prueba para KPIs Específicos por Industria
 * 
 * Este script prueba todos los nuevos endpoints de KPIs implementados
 * para verificar que funcionan correctamente.
 */

const axios = require('axios');

// Configuración
const BASE_URL = process.env.API_URL || 'http://localhost:3000';
const TEST_EMPRESA_ID = 1; // Cambiar según tu empresa de prueba

// Colores para la consola
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

// Función para imprimir con colores
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Función para hacer requests
async function makeRequest(endpoint, description) {
  try {
    log(`\n🔍 Probando: ${description}`, 'cyan');
    log(`📍 Endpoint: ${endpoint}`, 'blue');
    
    const response = await axios.get(`${BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 10000
    });

    if (response.status === 200) {
      log(`✅ Éxito: ${description}`, 'green');
      log(`📊 Datos recibidos: ${Object.keys(response.data).length} propiedades`, 'green');
      
      // Mostrar estructura de datos
      if (response.data && typeof response.data === 'object') {
        const keys = Object.keys(response.data);
        if (keys.length > 0) {
          log(`📋 Estructura: ${keys.slice(0, 5).join(', ')}${keys.length > 5 ? '...' : ''}`, 'yellow');
        }
      }
      
      return { success: true, data: response.data };
    } else {
      log(`❌ Error: ${response.status} - ${response.statusText}`, 'red');
      return { success: false, error: response.statusText };
    }
  } catch (error) {
    log(`❌ Error en ${description}:`, 'red');
    if (error.response) {
      log(`   Status: ${error.response.status}`, 'red');
      log(`   Message: ${error.response.data?.message || error.message}`, 'red');
    } else {
      log(`   Message: ${error.message}`, 'red');
    }
    return { success: false, error: error.message };
  }
}

// Tests específicos por industria
const industryTests = [
  {
    name: 'ALIMENTOS',
    endpoints: [
      '/dashboard/alimentos-kpis',
      '/dashboard/industry-kpis?industry=ALIMENTOS'
    ]
  },
  {
    name: 'FARMACIA',
    endpoints: [
      '/dashboard/farmacia-kpis',
      '/dashboard/industry-kpis?industry=FARMACIA'
    ]
  },
  {
    name: 'ROPA',
    endpoints: [
      '/dashboard/ropa-kpis',
      '/dashboard/industry-kpis?industry=ROPA'
    ]
  },
  {
    name: 'ELECTRONICA',
    endpoints: [
      '/dashboard/electronica-kpis',
      '/dashboard/industry-kpis?industry=ELECTRONICA'
    ]
  }
];

// Tests operacionales
const operationalTests = [
  {
    endpoint: '/dashboard/operational-kpis',
    description: 'KPIs Operacionales'
  },
  {
    endpoint: '/dashboard/supplier-kpis',
    description: 'KPIs de Proveedores'
  },
  {
    endpoint: '/dashboard/profitability-kpis',
    description: 'KPIs de Rentabilidad'
  },
  {
    endpoint: '/dashboard/sensor-kpis',
    description: 'KPIs de Sensores'
  }
];

// Tests predictivos
const predictiveTests = [
  {
    endpoint: '/dashboard/predictive-kpis',
    description: 'KPIs Predictivos'
  },
  {
    endpoint: '/dashboard/demand-forecast?days=30',
    description: 'Forecast de Demanda (30 días)'
  },
  {
    endpoint: '/dashboard/expiry-alerts?days=30',
    description: 'Alertas de Caducidad (30 días)'
  }
];

// Tests de servicios de industria
const industryServiceTests = [
  {
    endpoint: '/dashboard/industry-summary',
    description: 'Resumen de Industria'
  },
  {
    endpoint: '/dashboard/industry-validation',
    description: 'Validación de Productos por Industria'
  },
  {
    endpoint: '/dashboard/industry-recommendations',
    description: 'Recomendaciones de Industria'
  }
];

// Función principal de pruebas
async function runTests() {
  log('\n🚀 INICIANDO PRUEBAS DE KPIs ESPECÍFICOS POR INDUSTRIA', 'bold');
  log('=' .repeat(60), 'blue');
  
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    details: []
  };

  // 1. Probar KPIs básicos existentes
  log('\n📊 PRUEBA 1: KPIs Básicos Existentes', 'bold');
  const basicTests = [
    { endpoint: '/dashboard/kpis', description: 'KPIs Básicos' },
    { endpoint: '/dashboard/financial-kpis', description: 'KPIs Financieros' },
    { endpoint: '/dashboard/advanced-kpis', description: 'KPIs Avanzados' }
  ];

  for (const test of basicTests) {
    results.total++;
    const result = await makeRequest(test.endpoint, test.description);
    if (result.success) {
      results.passed++;
    } else {
      results.failed++;
    }
    results.details.push({ test: test.description, ...result });
  }

  // 2. Probar KPIs específicos por industria
  log('\n🏭 PRUEBA 2: KPIs Específicos por Industria', 'bold');
  for (const industry of industryTests) {
    log(`\n🎯 Probando industria: ${industry.name}`, 'magenta');
    
    for (const endpoint of industry.endpoints) {
      results.total++;
      const result = await makeRequest(endpoint, `${industry.name} - ${endpoint.split('/').pop()}`);
      if (result.success) {
        results.passed++;
      } else {
        results.failed++;
      }
      results.details.push({ test: `${industry.name} - ${endpoint.split('/').pop()}`, ...result });
    }
  }

  // 3. Probar KPIs operacionales
  log('\n⚙️ PRUEBA 3: KPIs Operacionales', 'bold');
  for (const test of operationalTests) {
    results.total++;
    const result = await makeRequest(test.endpoint, test.description);
    if (result.success) {
      results.passed++;
    } else {
      results.failed++;
    }
    results.details.push({ test: test.description, ...result });
  }

  // 4. Probar KPIs predictivos
  log('\n🔮 PRUEBA 4: KPIs Predictivos', 'bold');
  for (const test of predictiveTests) {
    results.total++;
    const result = await makeRequest(test.endpoint, test.description);
    if (result.success) {
      results.passed++;
    } else {
      results.failed++;
    }
    results.details.push({ test: test.description, ...result });
  }

  // 5. Probar servicios de industria
  log('\n🏭 PRUEBA 5: Servicios de Industria', 'bold');
  for (const test of industryServiceTests) {
    results.total++;
    const result = await makeRequest(test.endpoint, test.description);
    if (result.success) {
      results.passed++;
    } else {
      results.failed++;
    }
    results.details.push({ test: test.description, ...result });
  }

  // Mostrar resumen final
  log('\n' + '='.repeat(60), 'blue');
  log('📋 RESUMEN FINAL DE PRUEBAS', 'bold');
  log('='.repeat(60), 'blue');
  
  log(`\n📊 Total de pruebas: ${results.total}`, 'cyan');
  log(`✅ Exitosas: ${results.passed}`, 'green');
  log(`❌ Fallidas: ${results.failed}`, 'red');
  log(`📈 Porcentaje de éxito: ${((results.passed / results.total) * 100).toFixed(1)}%`, 'yellow');

  if (results.failed > 0) {
    log('\n❌ PRUEBAS FALLIDAS:', 'red');
    results.details
      .filter(r => !r.success)
      .forEach(r => {
        log(`   • ${r.test}: ${r.error}`, 'red');
      });
  }

  if (results.passed > 0) {
    log('\n✅ PRUEBAS EXITOSAS:', 'green');
    results.details
      .filter(r => r.success)
      .slice(0, 10) // Mostrar solo las primeras 10
      .forEach(r => {
        log(`   • ${r.test}`, 'green');
      });
    
    if (results.details.filter(r => r.success).length > 10) {
      log(`   ... y ${results.details.filter(r => r.success).length - 10} más`, 'green');
    }
  }

  log('\n🎯 RECOMENDACIONES:', 'yellow');
  if (results.failed === 0) {
    log('   ✅ Todos los KPIs están funcionando correctamente', 'green');
    log('   🚀 El sistema está listo para producción', 'green');
  } else {
    log('   🔧 Revisar los endpoints que fallaron', 'yellow');
    log('   📝 Verificar la configuración de la base de datos', 'yellow');
    log('   🔍 Revisar los logs del servidor', 'yellow');
  }

  log('\n' + '='.repeat(60), 'blue');
  log('🏁 FIN DE PRUEBAS', 'bold');
  log('='.repeat(60), 'blue');
}

// Ejecutar pruebas si el script se ejecuta directamente
if (require.main === module) {
  runTests().catch(error => {
    log(`\n💥 Error fatal en las pruebas: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { runTests, makeRequest }; 