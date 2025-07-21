#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const XLSX = require('xlsx');

// Configuración
const CONFIG = {
  BASE_URL: process.env.API_URL || 'http://localhost:3001',
  EMAIL: process.env.TEST_EMAIL || 'prueba2@iam.com',
  PASSWORD: process.env.TEST_PASSWORD || 'PruebaIAM123?',
  TIMEOUT: 30000,
  UPLOAD_DIR: path.join(__dirname, '../uploads/test'),
  COOKIE_FILE: path.join(__dirname, '../cookies.txt'),
};

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Utilidades de logging
const log = {
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  header: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}`),
  subheader: (msg) => console.log(`${colors.magenta}${msg}${colors.reset}`),
};

// Función para ejecutar curl
function ejecutarCurl(url, opciones = {}) {
  const {
    method = 'GET',
    data = null,
    headers = {},
    cookieFile = CONFIG.COOKIE_FILE,
    outputFile = null,
    formData = null
  } = opciones;

  let comando = `curl -s -X ${method} "${url}"`;

  // Agregar cookies si existe el archivo
  if (fs.existsSync(cookieFile)) {
    comando += ` -b "${cookieFile}"`;
  }

  // Agregar headers
  Object.entries(headers).forEach(([key, value]) => {
    comando += ` -H "${key}: ${value}"`;
  });

  // Agregar data
  if (data) {
    comando += ` -d '${JSON.stringify(data)}'`;
  }

  // Agregar form data
  if (formData) {
    Object.entries(formData).forEach(([key, value]) => {
      if (typeof value === 'string' && value.startsWith('@')) {
        comando += ` -F "${key}=${value}"`;
      } else {
        comando += ` -F "${key}=${value}"`;
      }
    });
  }

  // Agregar output file
  if (outputFile) {
    comando += ` -o "${outputFile}"`;
  }

  // Agregar cookie jar para guardar cookies
  if (method === 'POST' && url.includes('/auth/login')) {
    comando += ` -c "${cookieFile}"`;
  }

  try {
    const resultado = execSync(comando, { encoding: 'utf8' });
    return { success: true, data: resultado };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Función para hacer login
async function hacerLogin() {
  log.info('🔑 Iniciando sesión...');
  
  const resultado = ejecutarCurl(`${CONFIG.BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: {
      email: CONFIG.EMAIL,
      password: CONFIG.PASSWORD,
    }
  });

  if (resultado.success) {
    try {
      const response = JSON.parse(resultado.data);
      if (response.message === 'Login exitoso') {
        log.success('Login exitoso - Cookies guardadas');
        return true;
      }
    } catch (e) {
      log.error('Error parseando respuesta de login');
    }
  }
  
  log.error('Login falló');
  return false;
}

// Función para crear archivos de prueba
function crearArchivosPrueba() {
  log.header('📁 CREANDO ARCHIVOS DE PRUEBA');

  if (!fs.existsSync(CONFIG.UPLOAD_DIR)) {
    fs.mkdirSync(CONFIG.UPLOAD_DIR, { recursive: true });
  }

  // Archivo de productos
  const productosData = [
    {
      nombre: 'Paracetamol 500mg',
      descripcion: 'Analgésico y antipirético',
      codigo: 'PARA500',
      stock: 150,
      stock_minimo: 20,
      precio_compra: 0.50,
      precio_venta: 1.20,
      categoria: 'Analgésicos',
      proveedor: 'Farmacéutica ABC',
      ubicacion: 'Estante A1',
      tipo_producto: 'MEDICAMENTO',
      unidad: 'TABLETA',
      etiquetas: 'dolor,fiebre,analgésico'
    }
  ];

  const productosPath = path.join(CONFIG.UPLOAD_DIR, 'productos_test.xlsx');
  const productosWb = XLSX.utils.book_new();
  const productosWs = XLSX.utils.json_to_sheet(productosData);
  XLSX.utils.book_append_sheet(productosWb, productosWs, 'Productos');
  XLSX.writeFile(productosWb, productosPath);
  log.success(`Archivo de productos creado: ${productosPath}`);

  return { productos: productosPath };
}

// Función para probar plantillas
async function probarPlantillas() {
  log.header('📋 PROBANDO ENDPOINTS DE PLANTILLAS');

  try {
    // Listar plantillas
    log.info('1. Listando plantillas disponibles...');
    const resultado = ejecutarCurl(`${CONFIG.BASE_URL}/importacion/plantillas`);
    
    if (resultado.success) {
      const response = JSON.parse(resultado.data);
      log.success(`Plantillas disponibles: ${JSON.stringify(response)}`);
    } else {
      log.error('Error listando plantillas');
      return false;
    }

    // Descargar plantilla
    log.info('2. Descargando plantilla de productos...');
    const descargaResultado = ejecutarCurl(`${CONFIG.BASE_URL}/importacion/plantillas/productos`, {
      outputFile: path.join(CONFIG.UPLOAD_DIR, 'plantilla_productos.xlsx')
    });
    
    if (descargaResultado.success) {
      log.success('Plantilla de productos descargada correctamente');
    } else {
      log.error('Error descargando plantilla');
      return false;
    }

    return true;
  } catch (error) {
    log.error(`Error probando plantillas: ${error.message}`);
    return false;
  }
}

// Función para probar importación
async function probarImportacion(archivoPath, tipo) {
  log.info(`Subiendo archivo de ${tipo}...`);
  
  try {
    const resultado = ejecutarCurl(`${CONFIG.BASE_URL}/importacion/${tipo}`, {
      method: 'POST',
      formData: {
        archivo: `@${archivoPath}`,
        sobrescribirExistentes: 'false',
        validarSolo: 'false',
        notificarEmail: 'false'
      }
    });

    if (resultado.success) {
      try {
        const response = JSON.parse(resultado.data);
        if (response.trabajoId) {
          log.success(`Importación de ${tipo} iniciada - Trabajo ID: ${response.trabajoId}`);
          return true;
        } else {
          log.error(`Respuesta inesperada en importación de ${tipo}`);
          return false;
        }
      } catch (e) {
        log.error(`Error parseando respuesta de importación de ${tipo}`);
        return false;
      }
    } else {
      log.error(`Error en importación de ${tipo}: ${resultado.error}`);
      return false;
    }
  } catch (error) {
    log.error(`Error en importación de ${tipo}: ${error.message}`);
    return false;
  }
}

// Función para probar gestión de trabajos
async function probarGestionTrabajos() {
  log.header('📋 PROBANDO GESTIÓN DE TRABAJOS');

  try {
    log.info('1. Listando trabajos...');
    const resultado = ejecutarCurl(`${CONFIG.BASE_URL}/importacion/trabajos`);
    
    if (resultado.success) {
      try {
        const response = JSON.parse(resultado.data);
        if (response.trabajos && Array.isArray(response.trabajos)) {
          log.success(`Trabajos encontrados: ${response.trabajos.length}`);
          response.trabajos.forEach(trabajo => {
            log.info(`- ID: ${trabajo.id}, Tipo: ${trabajo.tipo}, Estado: ${trabajo.estado}`);
          });
        } else {
          log.success('No hay trabajos pendientes');
        }
        return true;
      } catch (e) {
        log.error('Error parseando respuesta de trabajos');
        return false;
      }
    } else {
      log.error(`Error en gestión de trabajos: ${resultado.error}`);
      return false;
    }
  } catch (error) {
    log.error(`Error en gestión de trabajos: ${error.message}`);
    return false;
  }
}

// Función principal
async function ejecutarTests() {
  log.header('🧪 INICIANDO TESTS DEL SISTEMA DE IMPORTACIÓN');
  
  console.log(`\nConfiguración:`);
  console.log(`- URL Base: ${CONFIG.BASE_URL}`);
  console.log(`- Email: ${CONFIG.EMAIL}`);
  console.log(`- Timeout: ${CONFIG.TIMEOUT}ms`);
  console.log(`- Directorio: ${CONFIG.UPLOAD_DIR}`);

  const resultados = {
    login: false,
    plantillas: false,
    productos: false,
    trabajos: false,
  };

  try {
    // 1. Login
    resultados.login = await hacerLogin();
    if (!resultados.login) {
      log.error('No se pudo hacer login - Abortando tests');
      return;
    }

    // 2. Crear archivos de prueba
    const archivos = crearArchivosPrueba();

    // 3. Probar plantillas
    resultados.plantillas = await probarPlantillas();

    // 4. Probar importación
    resultados.productos = await probarImportacion(archivos.productos, 'productos');

    // 5. Probar gestión de trabajos
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
  console.log(`- Importación Productos: ${resultados.productos ? '✅' : '❌'}`);
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
  } else {
    log.warning('⚠️  Algunos tests fallaron. Revisa los logs para más detalles.');
  }

  console.log(`\nArchivos de prueba creados en: ${CONFIG.UPLOAD_DIR}`);
}

// Limpiar archivo de cookies al salir
process.on('exit', () => {
  if (fs.existsSync(CONFIG.COOKIE_FILE)) {
    fs.unlinkSync(CONFIG.COOKIE_FILE);
  }
});

// Ejecutar si es llamado directamente
if (require.main === module) {
  ejecutarTests().catch(console.error);
}

module.exports = { ejecutarTests }; 