#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const XLSX = require('xlsx');

// Configuración
const CONFIG = {
  BASE_URL: process.env.API_URL || 'http://localhost:8080',
  TEST_TOKEN: process.env.TEST_TOKEN || '',
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

// Cliente HTTP configurado
const apiClient = axios.create({
  baseURL: CONFIG.BASE_URL,
  timeout: CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Función para crear archivos de prueba
function crearArchivosPrueba() {
  log.header('📁 CREANDO ARCHIVOS DE PRUEBA');

  // Crear directorio de pruebas si no existe
  if (!fs.existsSync(CONFIG.UPLOAD_DIR)) {
    fs.mkdirSync(CONFIG.UPLOAD_DIR, { recursive: true });
  }

  // 1. Archivo de productos de prueba
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
    },
    {
      nombre: 'Jeringa 5ml',
      descripcion: 'Jeringa desechable 5ml',
      codigo: 'JER5ML',
      stock: 200,
      stock_minimo: 30,
      precio_compra: 0.25,
      precio_venta: 0.60,
      categoria: 'Insumos Médicos',
      proveedor: 'Suministros Médicos 123',
      ubicacion: 'Estante B1',
      tipo_producto: 'INSUMO',
      unidad: 'UNIDAD',
      etiquetas: 'jeringa,desechable,insumo'
    }
  ];

  const productosWorkbook = XLSX.utils.book_new();
  const productosWorksheet = XLSX.utils.json_to_sheet(productosData);
  XLSX.utils.book_append_sheet(productosWorkbook, productosWorksheet, 'Productos');
  
  const productosPath = path.join(CONFIG.UPLOAD_DIR, 'productos_test.xlsx');
  XLSX.writeFile(productosWorkbook, productosPath);
  log.success(`Archivo de productos creado: ${productosPath}`);

  // 2. Archivo de proveedores de prueba
  const proveedoresData = [
    {
      nombre: 'Farmacéutica ABC S.A.',
      ruc: '20123456789',
      direccion: 'Av. Principal 123, Lima',
      telefono: '+51 1 234 5678',
      email: 'contacto@farmaceuticaabc.com',
      contacto_principal: 'Juan Pérez',
      telefono_contacto: '+51 999 888 777',
      email_contacto: 'juan.perez@farmaceuticaabc.com',
      categoria: 'Medicamentos',
      condiciones_pago: '30 días',
      estado: 'ACTIVO'
    },
    {
      nombre: 'Suministros Médicos 123',
      ruc: '20123456790',
      direccion: 'Calle Comercial 456, Arequipa',
      telefono: '+51 54 345 6789',
      email: 'ventas@suministros123.com',
      contacto_principal: 'María García',
      telefono_contacto: '+51 988 777 666',
      email_contacto: 'maria.garcia@suministros123.com',
      categoria: 'Insumos Médicos',
      condiciones_pago: '15 días',
      estado: 'ACTIVO'
    }
  ];

  const proveedoresWorkbook = XLSX.utils.book_new();
  const proveedoresWorksheet = XLSX.utils.json_to_sheet(proveedoresData);
  XLSX.utils.book_append_sheet(proveedoresWorkbook, proveedoresWorksheet, 'Proveedores');
  
  const proveedoresPath = path.join(CONFIG.UPLOAD_DIR, 'proveedores_test.xlsx');
  XLSX.writeFile(proveedoresWorkbook, proveedoresPath);
  log.success(`Archivo de proveedores creado: ${proveedoresPath}`);

  // 3. Archivo de movimientos de prueba
  const movimientosData = [
    {
      tipo_movimiento: 'ENTRADA',
      producto_codigo: 'PARA500',
      cantidad: 50,
      fecha_movimiento: '2024-01-15',
      motivo: 'Compra proveedor',
      proveedor: 'Farmacéutica ABC',
      lote: 'LOT001',
      fecha_vencimiento: '2026-12-31',
      precio_unitario: 0.50,
      observaciones: 'Entrada por compra regular'
    },
    {
      tipo_movimiento: 'SALIDA',
      producto_codigo: 'PARA500',
      cantidad: 10,
      fecha_movimiento: '2024-01-16',
      motivo: 'Venta',
      cliente: 'Cliente General',
      lote: 'LOT001',
      precio_unitario: 1.20,
      observaciones: 'Venta al público'
    },
    {
      tipo_movimiento: 'ENTRADA',
      producto_codigo: 'IBUP400',
      cantidad: 30,
      fecha_movimiento: '2024-01-17',
      motivo: 'Compra proveedor',
      proveedor: 'Farmacéutica XYZ',
      lote: 'LOT002',
      fecha_vencimiento: '2026-10-31',
      precio_unitario: 0.75,
      observaciones: 'Reposición de stock'
    }
  ];

  const movimientosWorkbook = XLSX.utils.book_new();
  const movimientosWorksheet = XLSX.utils.json_to_sheet(movimientosData);
  XLSX.utils.book_append_sheet(movimientosWorkbook, movimientosWorksheet, 'Movimientos');
  
  const movimientosPath = path.join(CONFIG.UPLOAD_DIR, 'movimientos_test.xlsx');
  XLSX.writeFile(movimientosWorkbook, movimientosPath);
  log.success(`Archivo de movimientos creado: ${movimientosPath}`);

  return {
    productos: productosPath,
    proveedores: proveedoresPath,
    movimientos: movimientosPath
  };
}

// Función para probar endpoints de plantillas
async function probarPlantillas() {
  log.header('📋 PROBANDO ENDPOINTS DE PLANTILLAS');

  try {
    // Probar descarga de plantilla de productos
    log.subheader('1. Descargando plantilla de productos...');
    const responseProductos = await apiClient.get('/importacion/plantillas/productos', {
      responseType: 'stream'
    });
    log.success('Plantilla de productos descargada correctamente');

    // Probar descarga de plantilla de proveedores
    log.subheader('2. Descargando plantilla de proveedores...');
    const responseProveedores = await apiClient.get('/importacion/plantillas/proveedores', {
      responseType: 'stream'
    });
    log.success('Plantilla de proveedores descargada correctamente');

    // Probar descarga de plantilla de movimientos
    log.subheader('3. Descargando plantilla de movimientos...');
    const responseMovimientos = await apiClient.get('/importacion/plantillas/movimientos', {
      responseType: 'stream'
    });
    log.success('Plantilla de movimientos descargada correctamente');

    // Probar listado de plantillas
    log.subheader('4. Listando plantillas disponibles...');
    const responseLista = await apiClient.get('/importacion/plantillas');
    log.success(`Plantillas disponibles: ${responseLista.data.length}`);

    return true;
  } catch (error) {
    log.error(`Error probando plantillas: ${error.message}`);
    return false;
  }
}

// Función para probar importación de productos
async function probarImportacionProductos(archivoPath) {
  log.header('📦 PROBANDO IMPORTACIÓN DE PRODUCTOS');

  try {
    const formData = new FormData();
    formData.append('archivo', fs.createReadStream(archivoPath));
    formData.append('opciones', JSON.stringify({
      saltarPrimeraFila: true,
      validarStock: true,
      crearProveedores: true,
      actualizarExistentes: false
    }));

    log.subheader('Subiendo archivo de productos...');
    const response = await apiClient.post('/importacion/productos', formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${CONFIG.TEST_TOKEN}`
      }
    });

    log.success(`Trabajo de importación creado: ${response.data.trabajoId}`);
    
    // Esperar y verificar estado
    await verificarEstadoTrabajo(response.data.trabajoId, 'productos');
    
    return response.data.trabajoId;
  } catch (error) {
    log.error(`Error en importación de productos: ${error.message}`);
    if (error.response) {
      log.error(`Respuesta del servidor: ${JSON.stringify(error.response.data)}`);
    }
    return null;
  }
}

// Función para probar importación de proveedores
async function probarImportacionProveedores(archivoPath) {
  log.header('🏢 PROBANDO IMPORTACIÓN DE PROVEEDORES');

  try {
    const formData = new FormData();
    formData.append('archivo', fs.createReadStream(archivoPath));
    formData.append('opciones', JSON.stringify({
      saltarPrimeraFila: true,
      validarContacto: true,
      actualizarExistentes: false
    }));

    log.subheader('Subiendo archivo de proveedores...');
    const response = await apiClient.post('/importacion/proveedores', formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${CONFIG.TEST_TOKEN}`
      }
    });

    log.success(`Trabajo de importación creado: ${response.data.trabajoId}`);
    
    // Esperar y verificar estado
    await verificarEstadoTrabajo(response.data.trabajoId, 'proveedores');
    
    return response.data.trabajoId;
  } catch (error) {
    log.error(`Error en importación de proveedores: ${error.message}`);
    if (error.response) {
      log.error(`Respuesta del servidor: ${JSON.stringify(error.response.data)}`);
    }
    return null;
  }
}

// Función para probar importación de movimientos
async function probarImportacionMovimientos(archivoPath) {
  log.header('📊 PROBANDO IMPORTACIÓN DE MOVIMIENTOS');

  try {
    const formData = new FormData();
    formData.append('archivo', fs.createReadStream(archivoPath));
    formData.append('opciones', JSON.stringify({
      saltarPrimeraFila: true,
      validarStock: true,
      crearProductos: false,
      crearProveedores: false
    }));

    log.subheader('Subiendo archivo de movimientos...');
    const response = await apiClient.post('/importacion/movimientos', formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${CONFIG.TEST_TOKEN}`
      }
    });

    log.success(`Trabajo de importación creado: ${response.data.trabajoId}`);
    
    // Esperar y verificar estado
    await verificarEstadoTrabajo(response.data.trabajoId, 'movimientos');
    
    return response.data.trabajoId;
  } catch (error) {
    log.error(`Error en importación de movimientos: ${error.message}`);
    if (error.response) {
      log.error(`Respuesta del servidor: ${JSON.stringify(error.response.data)}`);
    }
    return null;
  }
}

// Función para verificar estado de trabajo
async function verificarEstadoTrabajo(trabajoId, tipo) {
  log.subheader(`Verificando estado del trabajo ${trabajoId}...`);
  
  let intentos = 0;
  const maxIntentos = 30; // 30 segundos máximo
  
  while (intentos < maxIntentos) {
    try {
      const response = await apiClient.get(`/importacion/trabajos/${trabajoId}`, {
        headers: {
          'Authorization': `Bearer ${CONFIG.TEST_TOKEN}`
        }
      });

      const trabajo = response.data;
      
      if (trabajo.estado === 'COMPLETADO') {
        log.success(`${tipo.toUpperCase()}: ${trabajo.registrosExitosos}/${trabajo.totalRegistros} registros importados`);
        return true;
      } else if (trabajo.estado === 'ERROR') {
        log.error(`${tipo.toUpperCase()}: Trabajo falló con ${trabajo.registrosConError} errores`);
        return false;
      } else if (trabajo.estado === 'CANCELADO') {
        log.warning(`${tipo.toUpperCase()}: Trabajo cancelado`);
        return false;
      }

      log.info(`${tipo.toUpperCase()}: Estado ${trabajo.estado} - Progreso: ${trabajo.progreso}%`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar 1 segundo
      intentos++;
    } catch (error) {
      log.error(`Error verificando estado: ${error.message}`);
      return false;
    }
  }

  log.warning(`${tipo.toUpperCase()}: Tiempo de espera agotado`);
  return false;
}

// Función para probar gestión de trabajos
async function probarGestionTrabajos() {
  log.header('📋 PROBANDO GESTIÓN DE TRABAJOS');

  try {
    // Listar trabajos
    log.subheader('1. Listando trabajos...');
    const responseLista = await apiClient.get('/importacion/trabajos', {
      headers: {
        'Authorization': `Bearer ${CONFIG.TEST_TOKEN}`
      }
    });
    log.success(`Trabajos encontrados: ${responseLista.data.trabajos.length}`);

    // Si hay trabajos, probar obtener estado de uno
    if (responseLista.data.trabajos.length > 0) {
      const primerTrabajo = responseLista.data.trabajos[0];
      log.subheader(`2. Obteniendo estado del trabajo ${primerTrabajo.id}...`);
      
      const responseEstado = await apiClient.get(`/importacion/trabajos/${primerTrabajo.id}`, {
        headers: {
          'Authorization': `Bearer ${CONFIG.TEST_TOKEN}`
        }
      });
      log.success(`Estado: ${responseEstado.data.estado}`);

      // Si hay errores, probar descargar reporte
      if (responseEstado.data.registrosConError > 0) {
        log.subheader('3. Descargando reporte de errores...');
        try {
          const responseErrores = await apiClient.get(`/importacion/trabajos/${primerTrabajo.id}/errores`, {
            headers: {
              'Authorization': `Bearer ${CONFIG.TEST_TOKEN}`
            },
            responseType: 'stream'
          });
          log.success('Reporte de errores descargado correctamente');
        } catch (error) {
          log.warning('No se pudo descargar reporte de errores (puede ser normal)');
        }
      }
    }

    return true;
  } catch (error) {
    log.error(`Error en gestión de trabajos: ${error.message}`);
    return false;
  }
}

// Función para probar validaciones
async function probarValidaciones() {
  log.header('🔍 PROBANDO VALIDACIONES');

  try {
    // Crear archivo con errores
    const datosConErrores = [
      {
        nombre: '', // Nombre vacío
        codigo: 'TEST001',
        stock: -5, // Stock negativo
        precio_compra: 'no_es_numero', // Precio inválido
        precio_venta: 0, // Precio cero
        categoria: 'Categoría Muy Larga Que Excede El Límite Máximo Permitido Por El Sistema', // Muy largo
        proveedor: 'Proveedor Inexistente',
        ubicacion: 'Estante A1',
        tipo_producto: 'TIPO_INVALIDO', // Tipo inválido
        unidad: 'UNIDAD_INVALIDA', // Unidad inválida
        etiquetas: 'tag1,tag2,tag3,tag4,tag5,tag6,tag7,tag8,tag9,tag10,tag11' // Demasiadas etiquetas
      }
    ];

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(datosConErrores);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos con Errores');
    
    const archivoErrores = path.join(CONFIG.UPLOAD_DIR, 'productos_errores.xlsx');
    XLSX.writeFile(workbook, archivoErrores);

    log.subheader('Subiendo archivo con errores de validación...');
    const formData = new FormData();
    formData.append('archivo', fs.createReadStream(archivoErrores));
    formData.append('opciones', JSON.stringify({
      saltarPrimeraFila: true,
      validarStock: true,
      crearProveedores: false,
      actualizarExistentes: false
    }));

    const response = await apiClient.post('/importacion/productos', formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${CONFIG.TEST_TOKEN}`
      }
    });

    log.success(`Trabajo creado para validación: ${response.data.trabajoId}`);
    
    // Verificar que se detecten errores
    await verificarEstadoTrabajo(response.data.trabajoId, 'validación');
    
    return response.data.trabajoId;
  } catch (error) {
    log.error(`Error en pruebas de validación: ${error.message}`);
    return null;
  }
}

// Función principal de testing
async function ejecutarTests() {
  log.header('🧪 INICIANDO TESTS DEL SISTEMA DE IMPORTACIÓN');
  
  console.log(`\n${colors.cyan}Configuración:${colors.reset}`);
  console.log(`- URL Base: ${CONFIG.BASE_URL}`);
  console.log(`- Token: ${CONFIG.TEST_TOKEN ? 'Configurado' : 'No configurado'}`);
  console.log(`- Timeout: ${CONFIG.TIMEOUT}ms`);
  console.log(`- Directorio: ${CONFIG.UPLOAD_DIR}`);

  const resultados = {
    plantillas: false,
    productos: false,
    proveedores: false,
    movimientos: false,
    gestion: false,
    validaciones: false
  };

  try {
    // 1. Crear archivos de prueba
    const archivos = crearArchivosPrueba();

    // 2. Probar plantillas
    resultados.plantillas = await probarPlantillas();

    // 3. Probar importaciones (solo si hay token)
    if (CONFIG.TEST_TOKEN) {
      resultados.productos = await probarImportacionProductos(archivos.productos);
      resultados.proveedores = await probarImportacionProveedores(archivos.proveedores);
      resultados.movimientos = await probarImportacionMovimientos(archivos.movimientos);
      resultados.gestion = await probarGestionTrabajos();
      resultados.validaciones = await probarValidaciones();
    } else {
      log.warning('Token no configurado - Saltando pruebas de importación');
    }

    // 4. Mostrar resumen
    mostrarResumen(resultados);

  } catch (error) {
    log.error(`Error general en tests: ${error.message}`);
  }
}

// Función para mostrar resumen
function mostrarResumen(resultados) {
  log.header('📊 RESUMEN DE TESTS');

  const totalTests = Object.keys(resultados).length;
  const testsExitosos = Object.values(resultados).filter(r => r).length;

  console.log(`\n${colors.bright}Resultados:${colors.reset}`);
  console.log(`- Plantillas: ${resultados.plantillas ? '✅' : '❌'}`);
  console.log(`- Importación Productos: ${resultados.productos ? '✅' : '❌'}`);
  console.log(`- Importación Proveedores: ${resultados.proveedores ? '✅' : '❌'}`);
  console.log(`- Importación Movimientos: ${resultados.movimientos ? '✅' : '❌'}`);
  console.log(`- Gestión de Trabajos: ${resultados.gestion ? '✅' : '❌'}`);
  console.log(`- Validaciones: ${resultados.validaciones ? '✅' : '❌'}`);

  console.log(`\n${colors.bright}Estadísticas:${colors.reset}`);
  console.log(`- Tests ejecutados: ${totalTests}`);
  console.log(`- Tests exitosos: ${testsExitosos}`);
  console.log(`- Tests fallidos: ${totalTests - testsExitosos}`);
  console.log(`- Tasa de éxito: ${((testsExitosos / totalTests) * 100).toFixed(1)}%`);

  if (testsExitosos === totalTests) {
    log.success('🎉 ¡Todos los tests pasaron exitosamente!');
  } else {
    log.warning('⚠️  Algunos tests fallaron. Revisa los logs para más detalles.');
  }

  console.log(`\n${colors.cyan}Archivos de prueba creados en: ${CONFIG.UPLOAD_DIR}${colors.reset}`);
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  ejecutarTests().catch(console.error);
}

module.exports = {
  ejecutarTests,
  crearArchivosPrueba,
  probarPlantillas,
  probarImportacionProductos,
  probarImportacionProveedores,
  probarImportacionMovimientos,
  probarGestionTrabajos,
  probarValidaciones
}; 