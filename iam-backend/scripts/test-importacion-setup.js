#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

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

// Función para crear directorios necesarios
function crearDirectorios() {
  log.header('📁 CREANDO DIRECTORIOS NECESARIOS');
  
  const directorios = [
    '../uploads/test',
    '../uploads/import',
    '../uploads/plantillas',
    '../logs'
  ];
  
  directorios.forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      log.success(`Directorio creado: ${dirPath}`);
    } else {
      log.info(`Directorio ya existe: ${dirPath}`);
    }
  });
}

// Función para crear archivo de configuración
async function crearConfiguracion() {
  log.header('⚙️  CONFIGURANDO VARIABLES DE ENTORNO');
  
  const configPath = path.join(__dirname, '../.env.test');
  
  log.subheader('Configuración para testing:');
  const baseUrl = await preguntar('URL del servidor (default: http://localhost:8080): ') || 'http://localhost:8080';
  const token = await preguntar('Token JWT para testing (opcional): ') || '';
  const timeout = await preguntar('Timeout en ms (default: 30000): ') || '30000';
  
  const config = `# Configuración para testing del sistema de importación
# Generado automáticamente por test-importacion-setup.js

# URL del servidor
API_URL=${baseUrl}

# Token JWT para testing (opcional)
TEST_TOKEN=${token}

# Timeout para requests
TIMEOUT=${timeout}

# Configuración de Redis (para colas)
REDIS_URL=redis://localhost:6379

# Configuración de base de datos
DATABASE_URL="postgresql://usuario:password@localhost:5432/iam_db"

# Configuración de logging
LOG_LEVEL=debug
NODE_ENV=development

# Configuración de archivos
MAX_FILE_SIZE=52428800
ALLOWED_FILE_TYPES=.xlsx,.xls,.csv

# Configuración de colas
QUEUE_CONCURRENCY=2
QUEUE_MAX_ATTEMPTS=3
QUEUE_BACKOFF_DELAY=2000

# Configuración de validación
VALIDATION_STRICT_MODE=true
VALIDATION_SKIP_MISSING_PROPERTIES=false

# Configuración de reportes
REPORT_MAX_ERRORS=1000
REPORT_INCLUDE_STACK_TRACE=false
`;

  fs.writeFileSync(configPath, config);
  log.success(`Archivo de configuración creado: ${configPath}`);
  
  return { baseUrl, token, timeout };
}

// Función para verificar dependencias
function verificarDependencias() {
  log.header('🔍 VERIFICANDO DEPENDENCIAS');
  
  const dependencias = [
    'axios',
    'form-data',
    'xlsx',
    'ioredis',
    'bullmq'
  ];
  
  const packageJsonPath = path.join(__dirname, '../package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    log.error('package.json no encontrado');
    return false;
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  let todasInstaladas = true;
  
  dependencias.forEach(dep => {
    if (deps[dep]) {
      log.success(`${dep}: ${deps[dep]}`);
    } else {
      log.error(`${dep}: No instalada`);
      todasInstaladas = false;
    }
  });
  
  if (!todasInstaladas) {
    log.warning('Algunas dependencias faltan. Ejecuta: npm install');
  }
  
  return todasInstaladas;
}

// Función para crear archivos de ejemplo
function crearArchivosEjemplo() {
  log.header('📄 CREANDO ARCHIVOS DE EJEMPLO');
  
  const ejemplosDir = path.join(__dirname, '../uploads/test/ejemplos');
  if (!fs.existsSync(ejemplosDir)) {
    fs.mkdirSync(ejemplosDir, { recursive: true });
  }
  
  // Archivo README de ejemplos
  const readmeContent = `# Archivos de Ejemplo para Testing

Este directorio contiene archivos de ejemplo para probar el sistema de importación.

## Estructura de Archivos

### productos_ejemplo.xlsx
- Contiene datos de ejemplo para productos
- Incluye todos los campos requeridos y opcionales
- Datos válidos para testing

### productos_errores.xlsx
- Contiene datos con errores de validación
- Útil para probar el sistema de validación
- Incluye casos edge y datos inválidos

### proveedores_ejemplo.xlsx
- Datos de ejemplo para proveedores
- Incluye información de contacto completa
- Estructura correcta para importación

### movimientos_ejemplo.xlsx
- Movimientos de inventario de ejemplo
- Incluye entradas y salidas
- Referencias a productos existentes

## Uso

1. Usa estos archivos para probar la importación
2. Modifica los datos según tus necesidades
3. Verifica que los productos referenciados existan en la base de datos

## Notas

- Los archivos están en formato Excel (.xlsx)
- Mantén la estructura de columnas
- Respeta las validaciones definidas en el sistema
`;

  fs.writeFileSync(path.join(ejemplosDir, 'README.md'), readmeContent);
  log.success('README de ejemplos creado');
  
  // Archivo de configuración de testing
  const testConfigContent = `{
  "archivos": {
    "productos": {
      "ruta": "./uploads/test/ejemplos/productos_ejemplo.xlsx",
      "opciones": {
        "saltarPrimeraFila": true,
        "validarStock": true,
        "crearProveedores": true,
        "actualizarExistentes": false
      }
    },
    "proveedores": {
      "ruta": "./uploads/test/ejemplos/proveedores_ejemplo.xlsx",
      "opciones": {
        "saltarPrimeraFila": true,
        "validarContacto": true,
        "actualizarExistentes": false
      }
    },
    "movimientos": {
      "ruta": "./uploads/test/ejemplos/movimientos_ejemplo.xlsx",
      "opciones": {
        "saltarPrimeraFila": true,
        "validarStock": true,
        "crearProductos": false,
        "crearProveedores": false
      }
    }
  },
  "validaciones": {
    "productos": {
      "campos_requeridos": ["nombre", "codigo", "stock", "precio_compra", "precio_venta"],
      "campos_opcionales": ["descripcion", "categoria", "proveedor", "ubicacion", "etiquetas"],
      "reglas": {
        "stock": ">= 0",
        "precio_compra": "> 0",
        "precio_venta": "> precio_compra",
        "nombre": "max 100 caracteres",
        "codigo": "único por empresa"
      }
    },
    "proveedores": {
      "campos_requeridos": ["nombre", "ruc"],
      "campos_opcionales": ["direccion", "telefono", "email", "contacto_principal"],
      "reglas": {
        "ruc": "11 dígitos",
        "email": "formato válido",
        "telefono": "formato válido"
      }
    },
    "movimientos": {
      "campos_requeridos": ["tipo_movimiento", "producto_codigo", "cantidad", "fecha_movimiento"],
      "campos_opcionales": ["motivo", "proveedor", "lote", "observaciones"],
      "reglas": {
        "cantidad": "> 0",
        "tipo_movimiento": "ENTRADA|SALIDA|AJUSTE",
        "fecha_movimiento": "fecha válida"
      }
    }
  }
}`;

  fs.writeFileSync(path.join(ejemplosDir, 'test-config.json'), testConfigContent);
  log.success('Configuración de testing creada');
}

// Función para crear script de testing rápido
function crearScriptRapido() {
  log.header('⚡ CREANDO SCRIPT DE TESTING RÁPIDO');
  
  const scriptContent = `#!/usr/bin/env node

// Script de testing rápido para el sistema de importación
// Uso: node test-rapido.js

const { ejecutarTests } = require('./test-importacion.js');

console.log('🚀 Iniciando testing rápido...');

// Configurar variables de entorno para testing
process.env.API_URL = process.env.API_URL || 'http://localhost:8080';
process.env.TIMEOUT = process.env.TIMEOUT || '30000';

// Ejecutar tests
ejecutarTests()
  .then(() => {
    console.log('✅ Testing rápido completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error en testing rápido:', error);
    process.exit(1);
  });
`;

  const scriptPath = path.join(__dirname, 'test-rapido.js');
  fs.writeFileSync(scriptPath, scriptContent);
  fs.chmodSync(scriptPath, '755'); // Hacer ejecutable
  log.success(`Script de testing rápido creado: ${scriptPath}`);
}

// Función para mostrar instrucciones
function mostrarInstrucciones(config) {
  log.header('📋 INSTRUCCIONES DE USO');
  
  console.log(`${colors.bright}Configuración completada exitosamente!${colors.reset}\n`);
  
  console.log(`${colors.cyan}Próximos pasos:${colors.reset}`);
  console.log('1. Asegúrate de que el servidor esté corriendo');
  console.log('2. Configura las variables de entorno si es necesario');
  console.log('3. Ejecuta los tests');
  
  console.log(`\n${colors.cyan}Comandos útiles:${colors.reset}`);
  console.log(`- Testing automático: ${colors.yellow}node scripts/test-importacion.js${colors.reset}`);
  console.log(`- Testing manual: ${colors.yellow}node scripts/test-importacion-manual.js${colors.reset}`);
  console.log(`- Testing rápido: ${colors.yellow}node scripts/test-rapido.js${colors.reset}`);
  
  console.log(`\n${colors.cyan}Configuración actual:${colors.reset}`);
  console.log(`- URL Base: ${colors.green}${config.baseUrl}${colors.reset}`);
  console.log(`- Token: ${config.token ? colors.green + 'Configurado' + colors.reset : colors.yellow + 'No configurado' + colors.reset}`);
  console.log(`- Timeout: ${colors.green}${config.timeout}ms${colors.reset}`);
  
  console.log(`\n${colors.cyan}Archivos creados:${colors.reset}`);
  console.log(`- Configuración: ${colors.green}.env.test${colors.reset}`);
  console.log(`- Directorios: ${colors.green}uploads/test, uploads/import, uploads/plantillas${colors.reset}`);
  console.log(`- Scripts: ${colors.green}test-importacion.js, test-importacion-manual.js, test-rapido.js${colors.reset}`);
  
  console.log(`\n${colors.yellow}Nota:${colors.reset} Si necesitas configurar un token JWT, edita el archivo .env.test`);
}

// Función principal
async function main() {
  console.log(`${colors.bright}${colors.cyan}🔧 SETUP DEL SISTEMA DE TESTING DE IMPORTACIÓN${colors.reset}\n`);
  
  try {
    // 1. Verificar dependencias
    const depsOk = verificarDependencias();
    if (!depsOk) {
      log.warning('Algunas dependencias faltan. Continúa con el setup...');
    }
    
    // 2. Crear directorios
    crearDirectorios();
    
    // 3. Crear configuración
    const config = await crearConfiguracion();
    
    // 4. Crear archivos de ejemplo
    crearArchivosEjemplo();
    
    // 5. Crear script rápido
    crearScriptRapido();
    
    // 6. Mostrar instrucciones
    mostrarInstrucciones(config);
    
    log.success('Setup completado exitosamente!');
    
  } catch (error) {
    log.error(`Error en setup: ${error.message}`);
  } finally {
    rl.close();
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  main,
  crearDirectorios,
  crearConfiguracion,
  verificarDependencias,
  crearArchivosEjemplo,
  crearScriptRapido
}; 