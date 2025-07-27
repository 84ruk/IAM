const XLSX = require('xlsx');
const path = require('path');

// Configuración basada en el schema de Prisma
const PRODUCTO_FIELDS = [
  { name: 'nombre', required: true, type: 'string', description: 'Nombre del producto' },
  { name: 'descripcion', required: false, type: 'string', description: 'Descripción del producto' },
  { name: 'stock', required: true, type: 'number', description: 'Cantidad en stock (número entero)' },
  { name: 'precioCompra', required: true, type: 'number', description: 'Precio de compra (decimal)' },
  { name: 'precioVenta', required: true, type: 'number', description: 'Precio de venta (decimal)' },
  { name: 'stockMinimo', required: false, type: 'number', description: 'Stock mínimo (número entero, default: 10)' },
  { name: 'codigoBarras', required: false, type: 'string', description: 'Código de barras (único)' },
  { name: 'sku', required: false, type: 'string', description: 'SKU del producto (único)' },
  { name: 'tipoProducto', required: false, type: 'enum', description: 'Tipo de producto', options: [
    'GENERICO', 'ROPA', 'ALIMENTO', 'ELECTRONICO', 'MEDICAMENTO', 'SUPLEMENTO', 
    'EQUIPO_MEDICO', 'CUIDADO_PERSONAL', 'BIOLOGICO', 'MATERIAL_QUIRURGICO', 'SOFTWARE', 'HARDWARE'
  ]},
  { name: 'unidad', required: false, type: 'enum', description: 'Unidad de medida', options: [
    'UNIDAD', 'KILO', 'KILOGRAMO', 'LITRO', 'LITROS', 'CAJA', 'PAQUETE', 'METRO', 
    'METROS', 'GRAMO', 'GRAMOS', 'MILILITRO', 'MILILITROS', 'CENTIMETRO', 'CENTIMETROS', 'LICENCIA'
  ]},
  { name: 'estado', required: false, type: 'enum', description: 'Estado del producto', options: ['ACTIVO', 'INACTIVO']},
  { name: 'etiquetas', required: false, type: 'array', description: 'Etiquetas separadas por comas' },
  { name: 'color', required: false, type: 'string', description: 'Color del producto' },
  { name: 'talla', required: false, type: 'string', description: 'Talla del producto' },
  { name: 'ubicacion', required: false, type: 'string', description: 'Ubicación en almacén' },
  { name: 'temperaturaOptima', required: false, type: 'number', description: 'Temperatura óptima (decimal)' },
  { name: 'humedadOptima', required: false, type: 'number', description: 'Humedad óptima (decimal)' },
  { name: 'rfid', required: false, type: 'string', description: 'Código RFID (único)' },
];

const PROVEEDOR_FIELDS = [
  { name: 'nombre', required: true, type: 'string', description: 'Nombre del proveedor' },
  { name: 'email', required: false, type: 'email', description: 'Email del proveedor' },
  { name: 'telefono', required: false, type: 'string', description: 'Teléfono del proveedor' },
  { name: 'estado', required: false, type: 'enum', description: 'Estado del proveedor', options: ['ACTIVO', 'INACTIVO']},
];

const MOVIMIENTO_FIELDS = [
  { name: 'productoId', required: true, type: 'number', description: 'ID del producto (número entero)' },
  { name: 'cantidad', required: true, type: 'number', description: 'Cantidad del movimiento (número entero)' },
  { name: 'tipo', required: true, type: 'enum', description: 'Tipo de movimiento', options: ['ENTRADA', 'SALIDA']},
  { name: 'motivo', required: false, type: 'string', description: 'Motivo del movimiento' },
  { name: 'descripcion', required: false, type: 'string', description: 'Descripción adicional' },
  { name: 'fecha', required: false, type: 'date', description: 'Fecha del movimiento (YYYY-MM-DD HH:MM:SS)' },
  { name: 'estado', required: false, type: 'enum', description: 'Estado del movimiento', options: ['ACTIVO']},
];

function createWorkbook() {
  return XLSX.utils.book_new();
}

function createWorksheet(data, sheetName) {
  return XLSX.utils.json_to_sheet(data);
}

function addWorksheet(workbook, worksheet, sheetName) {
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
}

function setColumnWidths(worksheet, widths) {
  worksheet['!cols'] = widths.map(width => ({ width }));
}

function addStyles(worksheet, data) {
  // Agregar estilos básicos
  const range = XLSX.utils.decode_range(worksheet['!ref']);
  
  // Estilo para encabezados
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    if (worksheet[cellAddress]) {
      worksheet[cellAddress].s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "366092" } },
        alignment: { horizontal: "center", vertical: "center" }
      };
    }
  }
}

function generateProductosTemplate() {
  console.log('Generando plantilla de productos...');
  
  const workbook = createWorkbook();
  
  // Crear datos de ejemplo
  const exampleData = [
    {
      nombre: 'Ejemplo Producto 1',
      descripcion: 'Descripción del producto ejemplo',
      stock: 100,
      precioCompra: 50.00,
      precioVenta: 75.00,
      stockMinimo: 10,
      codigoBarras: '1234567890123',
      sku: 'PROD-001',
      tipoProducto: 'GENERICO',
      unidad: 'UNIDAD',
      estado: 'ACTIVO',
      etiquetas: 'ejemplo,test,producto',
      color: 'Azul',
      talla: 'M',
      ubicacion: 'Estante A-1',
      temperaturaOptima: 25.0,
      humedadOptima: 60.0,
      rfid: 'RFID-001'
    },
    {
      nombre: 'Ejemplo Producto 2',
      descripcion: 'Otro producto de ejemplo',
      stock: 50,
      precioCompra: 30.00,
      precioVenta: 45.00,
      stockMinimo: 5,
      codigoBarras: '9876543210987',
      sku: 'PROD-002',
      tipoProducto: 'ELECTRONICO',
      unidad: 'UNIDAD',
      estado: 'ACTIVO',
      etiquetas: 'electronico,gadget',
      color: 'Negro',
      talla: '',
      ubicacion: 'Estante B-2',
      temperaturaOptima: 20.0,
      humedadOptima: 50.0,
      rfid: 'RFID-002'
    }
  ];
  
  const worksheet = createWorksheet(exampleData, 'Productos');
  addWorksheet(workbook, worksheet, 'Productos');
  
  // Configurar anchos de columna
  const columnWidths = [
    25, // nombre
    30, // descripcion
    10, // stock
    15, // precioCompra
    15, // precioVenta
    12, // stockMinimo
    15, // codigoBarras
    12, // sku
    15, // tipoProducto
    12, // unidad
    10, // estado
    20, // etiquetas
    10, // color
    10, // talla
    15, // ubicacion
    15, // temperaturaOptima
    15, // humedadOptima
    12  // rfid
  ];
  
  setColumnWidths(worksheet, columnWidths);
  
  // Crear hoja de instrucciones
  const instructions = [
    { Campo: 'nombre', Requerido: 'SÍ', Tipo: 'Texto', Descripción: 'Nombre del producto', Ejemplo: 'Laptop HP Pavilion' },
    { Campo: 'descripcion', Requerido: 'NO', Tipo: 'Texto', Descripción: 'Descripción detallada', Ejemplo: 'Laptop de 15 pulgadas con procesador Intel i5' },
    { Campo: 'stock', Requerido: 'SÍ', Tipo: 'Número entero', Descripción: 'Cantidad disponible', Ejemplo: '25' },
    { Campo: 'precioCompra', Requerido: 'SÍ', Tipo: 'Decimal', Descripción: 'Precio de compra', Ejemplo: '450.00' },
    { Campo: 'precioVenta', Requerido: 'SÍ', Tipo: 'Decimal', Descripción: 'Precio de venta', Ejemplo: '600.00' },
    { Campo: 'stockMinimo', Requerido: 'NO', Tipo: 'Número entero', Descripción: 'Stock mínimo (default: 10)', Ejemplo: '5' },
    { Campo: 'codigoBarras', Requerido: 'NO', Tipo: 'Texto', Descripción: 'Código de barras único', Ejemplo: '1234567890123' },
    { Campo: 'sku', Requerido: 'NO', Tipo: 'Texto', Descripción: 'SKU único del producto', Ejemplo: 'LAP-HP-001' },
    { Campo: 'tipoProducto', Requerido: 'NO', Tipo: 'Lista', Descripción: 'Tipo de producto', Opciones: 'GENERICO, ROPA, ALIMENTO, ELECTRONICO, MEDICAMENTO, etc.' },
    { Campo: 'unidad', Requerido: 'NO', Tipo: 'Lista', Descripción: 'Unidad de medida', Opciones: 'UNIDAD, KILO, LITRO, CAJA, etc.' },
    { Campo: 'estado', Requerido: 'NO', Tipo: 'Lista', Descripción: 'Estado del producto', Opciones: 'ACTIVO, INACTIVO' },
    { Campo: 'etiquetas', Requerido: 'NO', Tipo: 'Texto', Descripción: 'Etiquetas separadas por comas', Ejemplo: 'laptop,computadora,tecnologia' },
    { Campo: 'color', Requerido: 'NO', Tipo: 'Texto', Descripción: 'Color del producto', Ejemplo: 'Negro' },
    { Campo: 'talla', Requerido: 'NO', Tipo: 'Texto', Descripción: 'Talla del producto', Ejemplo: 'M' },
    { Campo: 'ubicacion', Requerido: 'NO', Tipo: 'Texto', Descripción: 'Ubicación en almacén', Ejemplo: 'Estante A-1' },
    { Campo: 'temperaturaOptima', Requerido: 'NO', Tipo: 'Decimal', Descripción: 'Temperatura óptima', Ejemplo: '25.0' },
    { Campo: 'humedadOptima', Requerido: 'NO', Tipo: 'Decimal', Descripción: 'Humedad óptima', Ejemplo: '60.0' },
    { Campo: 'rfid', Requerido: 'NO', Tipo: 'Texto', Descripción: 'Código RFID único', Ejemplo: 'RFID-001' }
  ];
  
  const instructionsWorksheet = createWorksheet(instructions, 'Instrucciones');
  addWorksheet(workbook, instructionsWorksheet, 'Instrucciones');
  setColumnWidths(instructionsWorksheet, [20, 10, 15, 40, 20]);
  
  // Guardar archivo
  const filePath = path.join(__dirname, '../uploads/plantillas/plantilla-productos-mejorada-v2.xlsx');
  XLSX.writeFile(workbook, filePath);
  
  console.log(`✅ Plantilla de productos generada: ${filePath}`);
  return filePath;
}

function generateProveedoresTemplate() {
  console.log('Generando plantilla de proveedores...');
  
  const workbook = createWorkbook();
  
  // Crear datos de ejemplo
  const exampleData = [
    {
      nombre: 'Proveedor Ejemplo 1',
      email: 'contacto@proveedor1.com',
      telefono: '+52 55 1234 5678',
      estado: 'ACTIVO'
    },
    {
      nombre: 'Proveedor Ejemplo 2',
      email: 'ventas@proveedor2.com',
      telefono: '+52 55 9876 5432',
      estado: 'ACTIVO'
    }
  ];
  
  const worksheet = createWorksheet(exampleData, 'Proveedores');
  addWorksheet(workbook, worksheet, 'Proveedores');
  
  // Configurar anchos de columna
  const columnWidths = [30, 25, 20, 12];
  setColumnWidths(worksheet, columnWidths);
  
  // Crear hoja de instrucciones
  const instructions = [
    { Campo: 'nombre', Requerido: 'SÍ', Tipo: 'Texto', Descripción: 'Nombre del proveedor', Ejemplo: 'Distribuidora ABC' },
    { Campo: 'email', Requerido: 'NO', Tipo: 'Email', Descripción: 'Email de contacto', Ejemplo: 'contacto@distribuidora.com' },
    { Campo: 'telefono', Requerido: 'NO', Tipo: 'Texto', Descripción: 'Teléfono de contacto', Ejemplo: '+52 55 1234 5678' },
    { Campo: 'estado', Requerido: 'NO', Tipo: 'Lista', Descripción: 'Estado del proveedor', Opciones: 'ACTIVO, INACTIVO' }
  ];
  
  const instructionsWorksheet = createWorksheet(instructions, 'Instrucciones');
  addWorksheet(workbook, instructionsWorksheet, 'Instrucciones');
  setColumnWidths(instructionsWorksheet, [20, 10, 15, 40, 20]);
  
  // Guardar archivo
  const filePath = path.join(__dirname, '../uploads/plantillas/plantilla-proveedores-mejorada-v2.xlsx');
  XLSX.writeFile(workbook, filePath);
  
  console.log(`✅ Plantilla de proveedores generada: ${filePath}`);
  return filePath;
}

function generateMovimientosTemplate() {
  console.log('Generando plantilla de movimientos...');
  
  const workbook = createWorkbook();
  
  // Crear datos de ejemplo
  const exampleData = [
    {
      productoId: 1,
      cantidad: 50,
      tipo: 'ENTRADA',
      motivo: 'Compra inicial',
      descripcion: 'Primera entrada de inventario',
      fecha: '2025-01-15 10:30:00',
      estado: 'ACTIVO'
    },
    {
      productoId: 2,
      cantidad: 25,
      tipo: 'SALIDA',
      motivo: 'Venta',
      descripcion: 'Venta al cliente',
      fecha: '2025-01-16 14:20:00',
      estado: 'ACTIVO'
    }
  ];
  
  const worksheet = createWorksheet(exampleData, 'Movimientos');
  addWorksheet(workbook, worksheet, 'Movimientos');
  
  // Configurar anchos de columna
  const columnWidths = [12, 12, 12, 20, 30, 20, 12];
  setColumnWidths(worksheet, columnWidths);
  
  // Crear hoja de instrucciones
  const instructions = [
    { Campo: 'productoId', Requerido: 'SÍ', Tipo: 'Número entero', Descripción: 'ID del producto (debe existir)', Ejemplo: '1' },
    { Campo: 'cantidad', Requerido: 'SÍ', Tipo: 'Número entero', Descripción: 'Cantidad del movimiento', Ejemplo: '50' },
    { Campo: 'tipo', Requerido: 'SÍ', Tipo: 'Lista', Descripción: 'Tipo de movimiento', Opciones: 'ENTRADA, SALIDA' },
    { Campo: 'motivo', Requerido: 'NO', Tipo: 'Texto', Descripción: 'Motivo del movimiento', Ejemplo: 'Compra inicial' },
    { Campo: 'descripcion', Requerido: 'NO', Tipo: 'Texto', Descripción: 'Descripción adicional', Ejemplo: 'Primera entrada de inventario' },
    { Campo: 'fecha', Requerido: 'NO', Tipo: 'Fecha/Hora', Descripción: 'Fecha del movimiento', Ejemplo: '2025-01-15 10:30:00' },
    { Campo: 'estado', Requerido: 'NO', Tipo: 'Lista', Descripción: 'Estado del movimiento', Opciones: 'ACTIVO' }
  ];
  
  const instructionsWorksheet = createWorksheet(instructions, 'Instrucciones');
  addWorksheet(workbook, instructionsWorksheet, 'Instrucciones');
  setColumnWidths(instructionsWorksheet, [20, 10, 15, 40, 20]);
  
  // Guardar archivo
  const filePath = path.join(__dirname, '../uploads/plantillas/plantilla-movimientos-mejorada-v2.xlsx');
  XLSX.writeFile(workbook, filePath);
  
  console.log(`✅ Plantilla de movimientos generada: ${filePath}`);
  return filePath;
}

// Función principal
function main() {
  console.log('🚀 Generando plantillas de importación mejoradas...\n');
  
  try {
    // Crear directorio si no existe
    const fs = require('fs');
    const plantillasDir = path.join(__dirname, '../uploads/plantillas');
    if (!fs.existsSync(plantillasDir)) {
      fs.mkdirSync(plantillasDir, { recursive: true });
    }
    
    // Generar todas las plantillas
    generateProductosTemplate();
    generateProveedoresTemplate();
    generateMovimientosTemplate();
    
    console.log('\n🎉 ¡Todas las plantillas han sido generadas exitosamente!');
    console.log('\n📁 Ubicación de las plantillas:');
    console.log('   - Productos: uploads/plantillas/plantilla-productos-mejorada-v2.xlsx');
    console.log('   - Proveedores: uploads/plantillas/plantilla-proveedores-mejorada-v2.xlsx');
    console.log('   - Movimientos: uploads/plantillas/plantilla-movimientos-mejorada-v2.xlsx');
    
  } catch (error) {
    console.error('❌ Error generando plantillas:', error);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = {
  generateProductosTemplate,
  generateProveedoresTemplate,
  generateMovimientosTemplate
}; 