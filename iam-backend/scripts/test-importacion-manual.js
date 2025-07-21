#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const axios = require('axios');
const FormData = require('form-data');
const XLSX = require('xlsx');

// Configuración
const CONFIG = {
  BASE_URL: process.env.API_URL || 'http://localhost:8080',
  TEST_TOKEN: process.env.TEST_TOKEN || '',
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
  input: (msg) => console.log(`${colors.yellow}❓ ${msg}${colors.reset}`),
};

// Cliente HTTP
const apiClient = axios.create({
  baseURL: CONFIG.BASE_URL,
  timeout: 30000,
});

// Interface de lectura
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Función para preguntar al usuario
function preguntar(pregunta) {
  return new Promise((resolve) => {
    rl.question(pregunta, (respuesta) => {
      resolve(respuesta.trim());
    });
  });
}

// Función para mostrar menú principal
function mostrarMenu() {
  log.header('🧪 TESTING MANUAL DEL SISTEMA DE IMPORTACIÓN');
  
  console.log(`${colors.bright}Opciones disponibles:${colors.reset}`);
  console.log('1. 📋 Descargar plantillas');
  console.log('2. 📦 Probar importación de productos');
  console.log('3. 🏢 Probar importación de proveedores');
  console.log('4. 📊 Probar importación de movimientos');
  console.log('5. 📋 Gestionar trabajos');
  console.log('6. 🔍 Probar validaciones');
  console.log('7. 📁 Crear archivos de prueba');
  console.log('8. 🔧 Configurar token');
  console.log('9. 📊 Ver estado del servidor');
  console.log('0. 🚪 Salir');
  console.log('');
}

// Función para descargar plantillas
async function descargarPlantillas() {
  log.header('📋 DESCARGANDO PLANTILLAS');
  
  try {
    const tipos = ['productos', 'proveedores', 'movimientos'];
    
    for (const tipo of tipos) {
      log.subheader(`Descargando plantilla de ${tipo}...`);
      
      const response = await apiClient.get(`/importacion/plantillas/${tipo}`, {
        responseType: 'stream'
      });
      
      const fileName = `plantilla_${tipo}_${new Date().toISOString().split('T')[0]}.xlsx`;
      const filePath = path.join(CONFIG.UPLOAD_DIR, fileName);
      
      // Crear directorio si no existe
      if (!fs.existsSync(CONFIG.UPLOAD_DIR)) {
        fs.mkdirSync(CONFIG.UPLOAD_DIR, { recursive: true });
      }
      
      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);
      
      await new Promise((resolve, reject) => {
        writer.on('finish', () => {
          log.success(`Plantilla guardada: ${filePath}`);
          resolve();
        });
        writer.on('error', reject);
      });
    }
    
    log.success('Todas las plantillas descargadas correctamente');
  } catch (error) {
    log.error(`Error descargando plantillas: ${error.message}`);
  }
}

// Función para probar importación
async function probarImportacion(tipo) {
  log.header(`📦 PROBANDO IMPORTACIÓN DE ${tipo.toUpperCase()}`);
  
  if (!CONFIG.TEST_TOKEN) {
    log.error('Token no configurado. Usa la opción 8 para configurar el token.');
    return;
  }
  
  try {
    // Preguntar por el archivo
    const archivoPath = await preguntar(`Ruta del archivo ${tipo} (.xlsx): `);
    
    if (!fs.existsSync(archivoPath)) {
      log.error('Archivo no encontrado');
      return;
    }
    
    // Preguntar por opciones
    log.subheader('Opciones de importación:');
    const saltarPrimeraFila = await preguntar('¿Saltar primera fila? (s/n): ') === 's';
    const validarStock = await preguntar('¿Validar stock? (s/n): ') === 's';
    const crearProveedores = await preguntar('¿Crear proveedores automáticamente? (s/n): ') === 's';
    const actualizarExistentes = await preguntar('¿Actualizar registros existentes? (s/n): ') === 's';
    
    // Crear FormData
    const formData = new FormData();
    formData.append('archivo', fs.createReadStream(archivoPath));
    formData.append('opciones', JSON.stringify({
      saltarPrimeraFila,
      validarStock,
      crearProveedores,
      actualizarExistentes
    }));
    
    log.subheader('Subiendo archivo...');
    const response = await apiClient.post(`/importacion/${tipo}`, formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${CONFIG.TEST_TOKEN}`
      }
    });
    
    log.success(`Trabajo creado: ${response.data.trabajoId}`);
    
    // Preguntar si quiere monitorear el progreso
    const monitorear = await preguntar('¿Monitorear progreso? (s/n): ') === 's';
    
    if (monitorear) {
      await monitorearTrabajo(response.data.trabajoId);
    }
    
  } catch (error) {
    log.error(`Error en importación: ${error.message}`);
    if (error.response) {
      log.error(`Respuesta del servidor: ${JSON.stringify(error.response.data)}`);
    }
  }
}

// Función para monitorear trabajo
async function monitorearTrabajo(trabajoId) {
  log.subheader(`Monitoreando trabajo ${trabajoId}...`);
  
  let intentos = 0;
  const maxIntentos = 60; // 1 minuto
  
  while (intentos < maxIntentos) {
    try {
      const response = await apiClient.get(`/importacion/trabajos/${trabajoId}`, {
        headers: {
          'Authorization': `Bearer ${CONFIG.TEST_TOKEN}`
        }
      });
      
      const trabajo = response.data;
      
      console.log(`Estado: ${trabajo.estado} | Progreso: ${trabajo.progreso}% | Registros: ${trabajo.registrosProcesados}/${trabajo.totalRegistros}`);
      
      if (trabajo.estado === 'COMPLETADO') {
        log.success(`✅ Trabajo completado: ${trabajo.registrosExitosos} exitosos, ${trabajo.registrosConError} errores`);
        break;
      } else if (trabajo.estado === 'ERROR') {
        log.error(`❌ Trabajo falló: ${trabajo.registrosConError} errores`);
        break;
      } else if (trabajo.estado === 'CANCELADO') {
        log.warning(`⚠️ Trabajo cancelado`);
        break;
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000)); // Esperar 2 segundos
      intentos++;
    } catch (error) {
      log.error(`Error monitoreando trabajo: ${error.message}`);
      break;
    }
  }
}

// Función para gestionar trabajos
async function gestionarTrabajos() {
  log.header('📋 GESTIÓN DE TRABAJOS');
  
  if (!CONFIG.TEST_TOKEN) {
    log.error('Token no configurado');
    return;
  }
  
  try {
    // Listar trabajos
    const response = await apiClient.get('/importacion/trabajos', {
      headers: {
        'Authorization': `Bearer ${CONFIG.TEST_TOKEN}`
      }
    });
    
    const trabajos = response.data.trabajos;
    
    if (trabajos.length === 0) {
      log.info('No hay trabajos disponibles');
      return;
    }
    
    console.log('\nTrabajos disponibles:');
    trabajos.forEach((trabajo, index) => {
      console.log(`${index + 1}. ${trabajo.id} - ${trabajo.tipo} - ${trabajo.estado} - ${trabajo.progreso}%`);
    });
    
    const seleccion = await preguntar('\nSelecciona un trabajo (número) o 0 para volver: ');
    const index = parseInt(seleccion) - 1;
    
    if (index < 0 || index >= trabajos.length) {
      return;
    }
    
    const trabajo = trabajos[index];
    
    // Mostrar opciones del trabajo
    console.log(`\nOpciones para trabajo ${trabajo.id}:`);
    console.log('1. Ver detalles');
    console.log('2. Descargar errores');
    console.log('3. Cancelar trabajo');
    
    const opcion = await preguntar('Selecciona opción: ');
    
    switch (opcion) {
      case '1':
        await verDetallesTrabajo(trabajo.id);
        break;
      case '2':
        await descargarErrores(trabajo.id);
        break;
      case '3':
        await cancelarTrabajo(trabajo.id);
        break;
    }
    
  } catch (error) {
    log.error(`Error gestionando trabajos: ${error.message}`);
  }
}

// Función para ver detalles de trabajo
async function verDetallesTrabajo(trabajoId) {
  try {
    const response = await apiClient.get(`/importacion/trabajos/${trabajoId}`, {
      headers: {
        'Authorization': `Bearer ${CONFIG.TEST_TOKEN}`
      }
    });
    
    const trabajo = response.data;
    
    console.log('\nDetalles del trabajo:');
    console.log(`ID: ${trabajo.id}`);
    console.log(`Tipo: ${trabajo.tipo}`);
    console.log(`Estado: ${trabajo.estado}`);
    console.log(`Progreso: ${trabajo.progreso}%`);
    console.log(`Total registros: ${trabajo.totalRegistros}`);
    console.log(`Registros procesados: ${trabajo.registrosProcesados}`);
    console.log(`Registros exitosos: ${trabajo.registrosExitosos}`);
    console.log(`Registros con error: ${trabajo.registrosConError}`);
    console.log(`Fecha creación: ${trabajo.fechaCreacion}`);
    if (trabajo.fechaInicio) console.log(`Fecha inicio: ${trabajo.fechaInicio}`);
    if (trabajo.fechaFin) console.log(`Fecha fin: ${trabajo.fechaFin}`);
    
  } catch (error) {
    log.error(`Error obteniendo detalles: ${error.message}`);
  }
}

// Función para descargar errores
async function descargarErrores(trabajoId) {
  try {
    const response = await apiClient.get(`/importacion/trabajos/${trabajoId}/errores`, {
      headers: {
        'Authorization': `Bearer ${CONFIG.TEST_TOKEN}`
      },
      responseType: 'stream'
    });
    
    const fileName = `errores_${trabajoId}_${new Date().toISOString().split('T')[0]}.xlsx`;
    const filePath = path.join(CONFIG.UPLOAD_DIR, fileName);
    
    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);
    
    await new Promise((resolve, reject) => {
      writer.on('finish', () => {
        log.success(`Reporte de errores guardado: ${filePath}`);
        resolve();
      });
      writer.on('error', reject);
    });
    
  } catch (error) {
    log.error(`Error descargando errores: ${error.message}`);
  }
}

// Función para cancelar trabajo
async function cancelarTrabajo(trabajoId) {
  try {
    await apiClient.delete(`/importacion/trabajos/${trabajoId}`, {
      headers: {
        'Authorization': `Bearer ${CONFIG.TEST_TOKEN}`
      }
    });
    
    log.success(`Trabajo ${trabajoId} cancelado`);
  } catch (error) {
    log.error(`Error cancelando trabajo: ${error.message}`);
  }
}

// Función para configurar token
async function configurarToken() {
  log.header('🔧 CONFIGURAR TOKEN');
  
  const token = await preguntar('Ingresa tu token JWT: ');
  
  if (token) {
    CONFIG.TEST_TOKEN = token;
    log.success('Token configurado correctamente');
  } else {
    log.warning('Token no ingresado');
  }
}

// Función para ver estado del servidor
async function verEstadoServidor() {
  log.header('📊 ESTADO DEL SERVIDOR');
  
  try {
    const response = await apiClient.get('/health');
    log.success('Servidor respondiendo correctamente');
    console.log('Estado:', response.data);
  } catch (error) {
    log.error(`Error conectando al servidor: ${error.message}`);
  }
}

// Función para crear archivos de prueba
function crearArchivosPrueba() {
  log.header('📁 CREANDO ARCHIVOS DE PRUEBA');
  
  // Crear directorio si no existe
  if (!fs.existsSync(CONFIG.UPLOAD_DIR)) {
    fs.mkdirSync(CONFIG.UPLOAD_DIR, { recursive: true });
  }
  
  // Datos de ejemplo
  const productosData = [
    {
      nombre: 'Producto Test 1',
      descripcion: 'Descripción del producto test',
      codigo: 'TEST001',
      stock: 100,
      stock_minimo: 10,
      precio_compra: 1.00,
      precio_venta: 2.00,
      categoria: 'Test',
      proveedor: 'Proveedor Test',
      ubicacion: 'Estante Test',
      tipo_producto: 'GENERICO',
      unidad: 'UNIDAD',
      etiquetas: 'test,ejemplo'
    }
  ];
  
  const proveedoresData = [
    {
      nombre: 'Proveedor Test S.A.',
      ruc: '20123456789',
      direccion: 'Dirección Test',
      telefono: '+51 123 456 789',
      email: 'test@proveedor.com',
      contacto_principal: 'Contacto Test',
      telefono_contacto: '+51 987 654 321',
      email_contacto: 'contacto@proveedor.com',
      categoria: 'Test',
      condiciones_pago: '30 días',
      estado: 'ACTIVO'
    }
  ];
  
  const movimientosData = [
    {
      tipo_movimiento: 'ENTRADA',
      producto_codigo: 'TEST001',
      cantidad: 50,
      fecha_movimiento: new Date().toISOString().split('T')[0],
      motivo: 'Test',
      proveedor: 'Proveedor Test',
      lote: 'LOT001',
      fecha_vencimiento: '2026-12-31',
      precio_unitario: 1.00,
      observaciones: 'Movimiento de prueba'
    }
  ];
  
  // Crear archivos
  const archivos = [
    { nombre: 'productos_test.xlsx', datos: productosData },
    { nombre: 'proveedores_test.xlsx', datos: proveedoresData },
    { nombre: 'movimientos_test.xlsx', datos: movimientosData }
  ];
  
  archivos.forEach(archivo => {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(archivo.datos);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos');
    
    const filePath = path.join(CONFIG.UPLOAD_DIR, archivo.nombre);
    XLSX.writeFile(workbook, filePath);
    log.success(`Archivo creado: ${filePath}`);
  });
  
  log.success('Todos los archivos de prueba creados');
}

// Función principal
async function main() {
  console.log(`${colors.bright}${colors.cyan}🧪 TESTING MANUAL DEL SISTEMA DE IMPORTACIÓN${colors.reset}`);
  console.log(`URL Base: ${CONFIG.BASE_URL}`);
  console.log(`Token: ${CONFIG.TEST_TOKEN ? 'Configurado' : 'No configurado'}`);
  
  while (true) {
    mostrarMenu();
    
    const opcion = await preguntar('Selecciona una opción: ');
    
    switch (opcion) {
      case '1':
        await descargarPlantillas();
        break;
      case '2':
        await probarImportacion('productos');
        break;
      case '3':
        await probarImportacion('proveedores');
        break;
      case '4':
        await probarImportacion('movimientos');
        break;
      case '5':
        await gestionarTrabajos();
        break;
      case '6':
        await probarImportacion('productos'); // Para validaciones
        break;
      case '7':
        crearArchivosPrueba();
        break;
      case '8':
        await configurarToken();
        break;
      case '9':
        await verEstadoServidor();
        break;
      case '0':
        log.info('¡Hasta luego!');
        rl.close();
        return;
      default:
        log.warning('Opción no válida');
    }
    
    await preguntar('\nPresiona Enter para continuar...');
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  main,
  descargarPlantillas,
  probarImportacion,
  gestionarTrabajos,
  configurarToken,
  verEstadoServidor,
  crearArchivosPrueba
}; 