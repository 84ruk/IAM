#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const XLSX = require('xlsx');

// Configuración
const CONFIG = {
  BASE_URL: process.env.API_URL || 'http://localhost:3001',
  EMAIL: process.env.TEST_EMAIL || 'prueba2@iam.com',
  PASSWORD: process.env.TEST_PASSWORD || 'PruebaIAM123?',
  TIMEOUT: 30000,
  UPLOAD_DIR: path.join(__dirname, '../uploads/test'),
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

// Cliente HTTP configurado con cookies
const apiClient = axios.create({
  baseURL: CONFIG.BASE_URL,
  timeout: CONFIG.TIMEOUT,
  withCredentials: true, // Importante para cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Función para hacer login y obtener cookies
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
    log.error(`Error en login: ${error.response?.data?.message || error.message}`);
    return false;
  }
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
    },
    {
      nombre: 'Ibuprofeno 400mg',
      descripcion: 'Antiinflamatorio no esteroideo',
      codigo: 'IBUP400',
      stock: 80,
      stock_minimo: 15,
      precio_compra: 0.75,
      precio_venta: 1.80,
      categoria: 'Antiinflamatorios',
      proveedor: 'Farmacéutica XYZ',
      ubicacion: 'Estante A2',
      tipo_producto: 'MEDICAMENTO',
      unidad: 'TABLETA',
      etiquetas: 'inflamación,dolor,antiinflamatorio'
    }
  ];

  const productosPath = path.join(CONFIG.UPLOAD_DIR, 'productos_test.xlsx');
  const productosWb = XLSX.utils.book_new();
  const productosWs = XLSX.utils.json_to_sheet(productosData);
  XLSX.utils.book_append_sheet(productosWb, productosWs, 'Productos');
  XLSX.writeFile(productosWb, productosPath);
  log.success(`Archivo de productos creado: ${productosPath}`);

  // Archivo de proveedores
  const proveedoresData = [
    {
      nombre: 'Farmacéutica ABC',
      email: 'contacto@farmaceutica-abc.com',
      telefono: '+52 55 1234 5678',
      direccion: 'Av. Reforma 123, CDMX',
      rfc: 'ABC123456789',
      tipo_proveedor: 'FARMACÉUTICO',
      estado: 'ACTIVO'
    },
    {
      nombre: 'Suministros Médicos 123',
      email: 'ventas@suministros123.com',
      telefono: '+52 55 9876 5432',
      direccion: 'Calle Juárez 456, CDMX',
      rfc: 'SUM987654321',
      tipo_proveedor: 'INSUMOS',
      estado: 'ACTIVO'
    }
  ];

  const proveedoresPath = path.join(CONFIG.UPLOAD_DIR, 'proveedores_test.xlsx');
  const proveedoresWb = XLSX.utils.book_new();
  const proveedoresWs = XLSX.utils.json_to_sheet(proveedoresData);
  XLSX.utils.book_append_sheet(proveedoresWb, proveedoresWs, 'Proveedores');
  XLSX.writeFile(proveedoresWb, proveedoresPath);
  log.success(`Archivo de proveedores creado: ${proveedoresPath}`);

  // Archivo de movimientos
  const movimientosData = [
    {
      tipo: 'ENTRADA',
      producto_codigo: 'PARA500',
      cantidad: 50,
      motivo: 'Compra regular',
      fecha: new Date().toISOString().split('T')[0],
      proveedor: 'Farmacéutica ABC',
      costo_unitario: 0.50,
      ubicacion_origen: 'Proveedor',
      ubicacion_destino: 'Estante A1'
    },
    {
      tipo: 'SALIDA',
      producto_codigo: 'IBUP400',
      cantidad: 10,
      motivo: 'Venta',
      fecha: new Date().toISOString().split('T')[0],
      cliente: 'Cliente General',
      precio_unitario: 1.80,
      ubicacion_origen: 'Estante A2',
      ubicacion_destino: 'Cliente'
    }
  ];

  const movimientosPath = path.join(CONFIG.UPLOAD_DIR, 'movimientos_test.xlsx');
  const movimientosWb = XLSX.utils.book_new();
  const movimientosWs = XLSX.utils.json_to_sheet(movimientosData);
  XLSX.utils.book_append_sheet(movimientosWb, movimientosWs, 'Movimientos');
  XLSX.writeFile(movimientosWb, movimientosPath);
  log.success(`Archivo de movimientos creado: ${movimientosPath}`);

  return {
    productos: productosPath,
    proveedores: proveedoresPath,
    movimientos: movimientosPath
  };
}

// Función para probar plantillas
async function probarPlantillas() {
  log.header('📋 PROBANDO ENDPOINTS DE PLANTILLAS');

  try {
    // Listar plantillas
    log.info('1. Listando plantillas disponibles...');
    const plantillasResponse = await apiClient.get('/importacion/plantillas');
    log.success(`Plantillas disponibles: ${JSON.stringify(plantillasResponse.data)}`);

    // Descargar plantillas
    log.info('2. Descargando plantilla de productos...');
    const productosResponse = await apiClient.get('/importacion/plantillas/productos', {
      responseType: 'stream'
    });
    log.success('Plantilla de productos descargada correctamente');

    log.info('3. Descargando plantilla de proveedores...');
    const proveedoresResponse = await apiClient.get('/importacion/plantillas/proveedores', {
      responseType: 'stream'
    });
    log.success('Plantilla de proveedores descargada correctamente');

    log.info('4. Descargando plantilla de movimientos...');
    const movimientosResponse = await apiClient.get('/importacion/plantillas/movimientos', {
      responseType: 'stream'
    });
    log.success('Plantilla de movimientos descargada correctamente');

    return true;
  } catch (error) {
    log.error(`Error probando plantillas: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// Función para probar importación
async function probarImportacion(archivoPath, tipo) {
  log.info(`Subiendo archivo de ${tipo}...`);
  
  try {
    const formData = new FormData();
    formData.append('archivo', fs.createReadStream(archivoPath));
    formData.append('sobrescribirExistentes', 'false');
    formData.append('validarSolo', 'false');
    formData.append('notificarEmail', 'false');

    const response = await apiClient.post(`/importacion/${tipo}`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
      timeout: 60000, // 60 segundos para importaciones
    });

    if (response.data && response.data.trabajoId) {
      log.success(`Importación de ${tipo} iniciada - Trabajo ID: ${response.data.trabajoId}`);
      
      // Verificar estado del trabajo
      await verificarEstadoTrabajo(response.data.trabajoId, tipo);
      return true;
    } else {
      log.error(`Respuesta inesperada en importación de ${tipo}`);
      return false;
    }
  } catch (error) {
    log.error(`Error en importación de ${tipo}: ${error.response?.data?.message || error.message}`);
    if (error.response?.data) {
      log.error(`Respuesta del servidor: ${JSON.stringify(error.response.data)}`);
    }
    return false;
  }
}

// Función para verificar estado del trabajo
async function verificarEstadoTrabajo(trabajoId, tipo) {
  log.info(`Verificando estado del trabajo ${trabajoId}...`);
  
  let intentos = 0;
  const maxIntentos = 10;
  
  while (intentos < maxIntentos) {
    try {
      const response = await apiClient.get(`/importacion/trabajos/${trabajoId}`);
      
      if (response.data) {
        const estado = response.data.estado;
        log.info(`Estado del trabajo: ${estado}`);
        
        if (estado === 'COMPLETADO') {
          log.success(`Trabajo de ${tipo} completado exitosamente`);
          return true;
        } else if (estado === 'ERROR') {
          log.error(`Trabajo de ${tipo} falló: ${response.data.error || 'Error desconocido'}`);
          return false;
        } else if (estado === 'EN_PROCESO') {
          log.info(`Trabajo de ${tipo} en proceso... (${response.data.progreso || 0}%)`);
        }
      }
      
      // Esperar 2 segundos antes del siguiente intento
      await new Promise(resolve => setTimeout(resolve, 2000));
      intentos++;
    } catch (error) {
      log.error(`Error verificando estado: ${error.response?.data?.message || error.message}`);
      return false;
    }
  }
  
  log.warning(`Tiempo de espera agotado para trabajo de ${tipo}`);
  return false;
}

// Función para probar gestión de trabajos
async function probarGestionTrabajos() {
  log.header('📋 PROBANDO GESTIÓN DE TRABAJOS');

  try {
    log.info('1. Listando trabajos...');
    const response = await apiClient.get('/importacion/trabajos');
    
    if (response.data && Array.isArray(response.data.trabajos)) {
      log.success(`Trabajos encontrados: ${response.data.trabajos.length}`);
      response.data.trabajos.forEach(trabajo => {
        log.info(`- ID: ${trabajo.id}, Tipo: ${trabajo.tipo}, Estado: ${trabajo.estado}`);
      });
    } else {
      log.success('No hay trabajos pendientes');
    }
    
    return true;
  } catch (error) {
    log.error(`Error en gestión de trabajos: ${error.response?.data?.message || error.message}`);
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
    proveedores: false,
    movimientos: false,
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

    // 4. Probar importaciones
    resultados.productos = await probarImportacion(archivos.productos, 'productos');
    resultados.proveedores = await probarImportacion(archivos.proveedores, 'proveedores');
    resultados.movimientos = await probarImportacion(archivos.movimientos, 'movimientos');

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
  console.log(`- Importación Proveedores: ${resultados.proveedores ? '✅' : '❌'}`);
  console.log(`- Importación Movimientos: ${resultados.movimientos ? '✅' : '❌'}`);
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

// Ejecutar si es llamado directamente
if (require.main === module) {
  ejecutarTests().catch(console.error);
}

module.exports = { ejecutarTests }; 