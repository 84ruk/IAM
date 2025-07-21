#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

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

// Configuración
const UPLOAD_DIR = path.join(__dirname, '../uploads/test');

// Datos de ejemplo para productos
const productosEjemplo = [
  {
    nombre: 'Paracetamol 500mg',
    descripcion: 'Analgésico y antipirético para el alivio del dolor y la fiebre',
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
    descripcion: 'Antiinflamatorio no esteroideo para dolor e inflamación',
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
    descripcion: 'Jeringa desechable 5ml con aguja',
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
  },
  {
    nombre: 'Guantes Látex M',
    descripcion: 'Guantes de látex talla M, caja de 100 unidades',
    codigo: 'GULATEXM',
    stock: 50,
    stock_minimo: 10,
    precio_compra: 15.00,
    precio_venta: 25.00,
    categoria: 'Protección Personal',
    proveedor: 'Suministros Médicos 123',
    ubicacion: 'Estante C1',
    tipo_producto: 'INSUMO',
    unidad: 'CAJA',
    etiquetas: 'guantes,látex,protección'
  },
  {
    nombre: 'Mascarilla N95',
    descripcion: 'Mascarilla de protección N95, caja de 20 unidades',
    codigo: 'MASC95',
    stock: 25,
    stock_minimo: 5,
    precio_compra: 45.00,
    precio_venta: 75.00,
    categoria: 'Protección Personal',
    proveedor: 'Farmacéutica ABC',
    ubicacion: 'Estante C2',
    tipo_producto: 'INSUMO',
    unidad: 'CAJA',
    etiquetas: 'mascarilla,n95,protección'
  }
];

// Datos de ejemplo para proveedores
const proveedoresEjemplo = [
  {
    nombre: 'Farmacéutica ABC S.A.',
    ruc: '20123456789',
    direccion: 'Av. Principal 123, Lima, Perú',
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
    direccion: 'Calle Comercial 456, Arequipa, Perú',
    telefono: '+51 54 345 6789',
    email: 'ventas@suministros123.com',
    contacto_principal: 'María García',
    telefono_contacto: '+51 988 777 666',
    email_contacto: 'maria.garcia@suministros123.com',
    categoria: 'Insumos Médicos',
    condiciones_pago: '15 días',
    estado: 'ACTIVO'
  },
  {
    nombre: 'Distribuidora Farmacéutica XYZ',
    ruc: '20123456791',
    direccion: 'Jr. Industrial 789, Trujillo, Perú',
    telefono: '+51 44 567 8901',
    email: 'info@distribuidoraxyz.com',
    contacto_principal: 'Carlos López',
    telefono_contacto: '+51 977 666 555',
    email_contacto: 'carlos.lopez@distribuidoraxyz.com',
    categoria: 'Distribución',
    condiciones_pago: '45 días',
    estado: 'ACTIVO'
  }
];

// Datos de ejemplo para movimientos
const movimientosEjemplo = [
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
  },
  {
    tipo_movimiento: 'AJUSTE',
    producto_codigo: 'JER5ML',
    cantidad: 5,
    fecha_movimiento: '2024-01-18',
    motivo: 'Ajuste de inventario',
    lote: 'LOT003',
    precio_unitario: 0.25,
    observaciones: 'Ajuste por conteo físico'
  },
  {
    tipo_movimiento: 'ENTRADA',
    producto_codigo: 'GULATEXM',
    cantidad: 10,
    fecha_movimiento: '2024-01-19',
    motivo: 'Compra proveedor',
    proveedor: 'Suministros Médicos 123',
    lote: 'LOT004',
    fecha_vencimiento: '2027-06-30',
    precio_unitario: 15.00,
    observaciones: 'Compra de emergencia'
  }
];

// Datos con errores para testing de validación
const productosConErrores = [
  {
    nombre: '', // Nombre vacío
    descripcion: 'Descripción muy larga que excede el límite máximo permitido por el sistema de validación y debería generar un error de validación',
    codigo: 'TEST001',
    stock: -5, // Stock negativo
    stock_minimo: -10, // Stock mínimo negativo
    precio_compra: 'no_es_numero', // Precio inválido
    precio_venta: 0, // Precio cero
    categoria: 'Categoría Muy Larga Que Excede El Límite Máximo Permitido Por El Sistema De Validación',
    proveedor: 'Proveedor Inexistente',
    ubicacion: 'Estante A1',
    tipo_producto: 'TIPO_INVALIDO', // Tipo inválido
    unidad: 'UNIDAD_INVALIDA', // Unidad inválida
    etiquetas: 'tag1,tag2,tag3,tag4,tag5,tag6,tag7,tag8,tag9,tag10,tag11' // Demasiadas etiquetas
  }
];

// Función para crear directorio si no existe
function crearDirectorio() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    log.success(`Directorio creado: ${UPLOAD_DIR}`);
  } else {
    log.info(`Directorio ya existe: ${UPLOAD_DIR}`);
  }
}

// Función para crear archivo Excel
function crearArchivoExcel(datos, nombreArchivo, nombreHoja) {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(datos);
  
  // Ajustar ancho de columnas
  const columnWidths = [];
  Object.keys(datos[0] || {}).forEach(key => {
    columnWidths.push({ wch: Math.max(key.length, 15) });
  });
  worksheet['!cols'] = columnWidths;
  
  XLSX.utils.book_append_sheet(workbook, worksheet, nombreHoja);
  
  const filePath = path.join(UPLOAD_DIR, nombreArchivo);
  XLSX.writeFile(workbook, filePath);
  
  log.success(`Archivo creado: ${filePath}`);
  return filePath;
}

// Función para crear archivo CSV
function crearArchivoCSV(datos, nombreArchivo) {
  if (datos.length === 0) {
    log.warning(`No hay datos para crear ${nombreArchivo}`);
    return;
  }
  
  const headers = Object.keys(datos[0]);
  const csvContent = [
    headers.join(','),
    ...datos.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escapar comillas y envolver en comillas si contiene coma
        const escaped = String(value).replace(/"/g, '""');
        return escaped.includes(',') ? `"${escaped}"` : escaped;
      }).join(',')
    )
  ].join('\n');
  
  const filePath = path.join(UPLOAD_DIR, nombreArchivo);
  fs.writeFileSync(filePath, csvContent, 'utf8');
  
  log.success(`Archivo creado: ${filePath}`);
  return filePath;
}

// Función para crear README
function crearREADME() {
  const readmeContent = `# Archivos de Ejemplo para Importación

Este directorio contiene archivos de ejemplo para probar el sistema de importación.

## Archivos Disponibles

### Productos
- \`productos_ejemplo.xlsx\` - Datos válidos de productos
- \`productos_errores.xlsx\` - Datos con errores de validación
- \`productos_ejemplo.csv\` - Versión CSV de productos válidos

### Proveedores
- \`proveedores_ejemplo.xlsx\` - Datos válidos de proveedores
- \`proveedores_ejemplo.csv\` - Versión CSV de proveedores válidos

### Movimientos
- \`movimientos_ejemplo.xlsx\` - Datos válidos de movimientos
- \`movimientos_ejemplo.csv\` - Versión CSV de movimientos válidos

## Uso

1. **Para testing básico**: Usa los archivos \`*_ejemplo.xlsx\`
2. **Para testing de validación**: Usa los archivos \`*_errores.xlsx\`
3. **Para testing de formato**: Usa los archivos \`*.csv\`

## Estructura de Datos

### Productos
- \`nombre\`: Nombre del producto (requerido)
- \`codigo\`: Código único (requerido)
- \`stock\`: Cantidad en stock (requerido, >= 0)
- \`precio_compra\`: Precio de compra (requerido, > 0)
- \`precio_venta\`: Precio de venta (requerido, > precio_compra)

### Proveedores
- \`nombre\`: Nombre del proveedor (requerido)
- \`ruc\`: RUC (requerido, 11 dígitos)
- \`email\`: Email de contacto (opcional, formato válido)

### Movimientos
- \`tipo_movimiento\`: ENTRADA/SALIDA/AJUSTE (requerido)
- \`producto_codigo\`: Código del producto (requerido)
- \`cantidad\`: Cantidad (requerido, > 0)
- \`fecha_movimiento\`: Fecha del movimiento (requerido)

## Notas

- Los archivos Excel contienen datos de ejemplo realistas
- Los archivos CSV son compatibles con Excel y otros programas
- Los archivos de errores contienen casos edge para testing de validación
- Todos los archivos respetan la estructura esperada por el sistema

## Testing

Para probar la importación:

\`\`\`bash
# Testing automático
node scripts/test-importacion.js

# Testing manual
node scripts/test-importacion-manual.js
\`\`\`

---
Generado automáticamente el: ${new Date().toLocaleString()}
`;

  const readmePath = path.join(UPLOAD_DIR, 'README.md');
  fs.writeFileSync(readmePath, readmeContent, 'utf8');
  log.success(`README creado: ${readmePath}`);
}

// Función principal
function crearArchivosEjemplo() {
  log.header('📁 CREANDO ARCHIVOS DE EJEMPLO PARA IMPORTACIÓN');
  
  try {
    // 1. Crear directorio
    crearDirectorio();
    
    // 2. Crear archivos de productos
    log.subheader('Creando archivos de productos...');
    crearArchivoExcel(productosEjemplo, 'productos_ejemplo.xlsx', 'Productos');
    crearArchivoExcel(productosConErrores, 'productos_errores.xlsx', 'Productos con Errores');
    crearArchivoCSV(productosEjemplo, 'productos_ejemplo.csv');
    
    // 3. Crear archivos de proveedores
    log.subheader('Creando archivos de proveedores...');
    crearArchivoExcel(proveedoresEjemplo, 'proveedores_ejemplo.xlsx', 'Proveedores');
    crearArchivoCSV(proveedoresEjemplo, 'proveedores_ejemplo.csv');
    
    // 4. Crear archivos de movimientos
    log.subheader('Creando archivos de movimientos...');
    crearArchivoExcel(movimientosEjemplo, 'movimientos_ejemplo.xlsx', 'Movimientos');
    crearArchivoCSV(movimientosEjemplo, 'movimientos_ejemplo.csv');
    
    // 5. Crear README
    log.subheader('Creando documentación...');
    crearREADME();
    
    log.success('🎉 ¡Todos los archivos de ejemplo creados exitosamente!');
    
    console.log(`\n${colors.cyan}Archivos creados en: ${UPLOAD_DIR}${colors.reset}`);
    console.log(`\n${colors.bright}Archivos disponibles:${colors.reset}`);
    console.log('📦 productos_ejemplo.xlsx - Datos válidos de productos');
    console.log('📦 productos_errores.xlsx - Datos con errores de validación');
    console.log('📦 productos_ejemplo.csv - Versión CSV de productos');
    console.log('🏢 proveedores_ejemplo.xlsx - Datos válidos de proveedores');
    console.log('🏢 proveedores_ejemplo.csv - Versión CSV de proveedores');
    console.log('📊 movimientos_ejemplo.xlsx - Datos válidos de movimientos');
    console.log('📊 movimientos_ejemplo.csv - Versión CSV de movimientos');
    console.log('📖 README.md - Documentación de uso');
    
    console.log(`\n${colors.yellow}Próximos pasos:${colors.reset}`);
    console.log('1. Configura un token JWT para testing');
    console.log('2. Ejecuta: node scripts/test-importacion.js');
    console.log('3. O usa: node scripts/test-importacion-manual.js');
    
  } catch (error) {
    log.error(`Error creando archivos: ${error.message}`);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  crearArchivosEjemplo();
}

module.exports = {
  crearArchivosEjemplo,
  productosEjemplo,
  proveedoresEjemplo,
  movimientosEjemplo,
  productosConErrores
}; 