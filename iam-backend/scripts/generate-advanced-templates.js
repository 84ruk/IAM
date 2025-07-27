const XLSX = require('xlsx');
const path = require('path');

// Configuración avanzada basada en el schema de Prisma
const PRODUCTO_SCHEMA = {
  nombre: { required: true, type: 'string', maxLength: 100, minLength: 2 },
  descripcion: { required: false, type: 'string', maxLength: 500 },
  stock: { required: true, type: 'integer', min: 0, max: 999999 },
  precioCompra: { required: true, type: 'decimal', min: 0 },
  precioVenta: { required: true, type: 'decimal', min: 0 },
  stockMinimo: { required: false, type: 'integer', min: 0, max: 999999, default: 10 },
  codigoBarras: { required: false, type: 'string', maxLength: 50, unique: true },
  sku: { required: false, type: 'string', maxLength: 50, unique: true },
  tipoProducto: { 
    required: false, 
    type: 'enum', 
    options: ['GENERICO', 'ROPA', 'ALIMENTO', 'ELECTRONICO', 'MEDICAMENTO', 'SUPLEMENTO', 'EQUIPO_MEDICO', 'CUIDADO_PERSONAL', 'BIOLOGICO', 'MATERIAL_QUIRURGICO', 'SOFTWARE', 'HARDWARE'],
    default: 'GENERICO'
  },
  unidad: { 
    required: false, 
    type: 'enum', 
    options: ['UNIDAD', 'KILO', 'KILOGRAMO', 'LITRO', 'LITROS', 'CAJA', 'PAQUETE', 'METRO', 'METROS', 'GRAMO', 'GRAMOS', 'MILILITRO', 'MILILITROS', 'CENTIMETRO', 'CENTIMETROS', 'LICENCIA'],
    default: 'UNIDAD'
  },
  estado: { 
    required: false, 
    type: 'enum', 
    options: ['ACTIVO', 'INACTIVO'],
    default: 'ACTIVO'
  },
  etiquetas: { required: false, type: 'array', maxLength: 200 },
  color: { required: false, type: 'string', maxLength: 50 },
  talla: { required: false, type: 'string', maxLength: 20 },
  ubicacion: { required: false, type: 'string', maxLength: 100 },
  temperaturaOptima: { required: false, type: 'decimal', min: -50, max: 100 },
  humedadOptima: { required: false, type: 'decimal', min: 0, max: 100 },
  rfid: { required: false, type: 'string', maxLength: 50, unique: true }
};

const PROVEEDOR_SCHEMA = {
  nombre: { required: true, type: 'string', maxLength: 100, minLength: 2 },
  email: { required: false, type: 'email', maxLength: 100 },
  telefono: { required: false, type: 'string', maxLength: 20 },
  estado: { 
    required: false, 
    type: 'enum', 
    options: ['ACTIVO', 'INACTIVO'],
    default: 'ACTIVO'
  }
};

const MOVIMIENTO_SCHEMA = {
  productoId: { required: true, type: 'integer', min: 1 },
  cantidad: { required: true, type: 'integer', min: 1, max: 999999 },
  tipo: { 
    required: true, 
    type: 'enum', 
    options: ['ENTRADA', 'SALIDA']
  },
  motivo: { required: false, type: 'string', maxLength: 200 },
  descripcion: { required: false, type: 'string', maxLength: 500 },
  fecha: { required: false, type: 'datetime', format: 'YYYY-MM-DD HH:MM:SS' },
  estado: { 
    required: false, 
    type: 'enum', 
    options: ['ACTIVO'],
    default: 'ACTIVO'
  }
};

function createAdvancedWorkbook() {
  return XLSX.utils.book_new();
}

function createAdvancedWorksheet(data, sheetName) {
  const worksheet = XLSX.utils.json_to_sheet(data);
  
  // Agregar estilos básicos
  const range = XLSX.utils.decode_range(worksheet['!ref']);
  
  // Estilo para encabezados
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    if (worksheet[cellAddress]) {
      worksheet[cellAddress].s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "366092" } },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" }
        }
      };
    }
  }
  
  return worksheet;
}

function generateAdvancedProductosTemplate() {
  console.log('Generando plantilla avanzada de productos...');
  
  const workbook = createAdvancedWorkbook();
  
  // Crear datos de ejemplo más completos
  const exampleData = [
    {
      nombre: 'Laptop HP Pavilion 15"',
      descripcion: 'Laptop de 15 pulgadas con procesador Intel i5, 8GB RAM, 512GB SSD',
      stock: 25,
      precioCompra: 8500.00,
      precioVenta: 12000.00,
      stockMinimo: 5,
      codigoBarras: '7501234567890',
      sku: 'LAP-HP-PAV-001',
      tipoProducto: 'ELECTRONICO',
      unidad: 'UNIDAD',
      estado: 'ACTIVO',
      etiquetas: 'laptop,computadora,tecnologia,hp',
      color: 'Negro',
      talla: '',
      ubicacion: 'Estante A-1',
      temperaturaOptima: 25.0,
      humedadOptima: 60.0,
      rfid: 'RFID-LAP-001'
    },
    {
      nombre: 'Paracetamol 500mg',
      descripcion: 'Analgésico y antipirético, caja con 20 tabletas',
      stock: 150,
      precioCompra: 2.50,
      precioVenta: 5.00,
      stockMinimo: 20,
      codigoBarras: '7501234567891',
      sku: 'MED-PARA-500',
      tipoProducto: 'MEDICAMENTO',
      unidad: 'CAJA',
      estado: 'ACTIVO',
      etiquetas: 'medicamento,analgesico,farmacia',
      color: '',
      talla: '',
      ubicacion: 'Estante B-2',
      temperaturaOptima: 20.0,
      humedadOptima: 50.0,
      rfid: 'RFID-MED-001'
    },
    {
      nombre: 'Camiseta Algodón M',
      descripcion: 'Camiseta de algodón 100%, talla M, color azul',
      stock: 80,
      precioCompra: 120.00,
      precioVenta: 200.00,
      stockMinimo: 15,
      codigoBarras: '7501234567892',
      sku: 'ROPA-CAM-M-AZ',
      tipoProducto: 'ROPA',
      unidad: 'UNIDAD',
      estado: 'ACTIVO',
      etiquetas: 'ropa,camiseta,algodon',
      color: 'Azul',
      talla: 'M',
      ubicacion: 'Estante C-3',
      temperaturaOptima: 22.0,
      humedadOptima: 55.0,
      rfid: 'RFID-ROPA-001'
    }
  ];
  
  const worksheet = createAdvancedWorksheet(exampleData, 'Productos');
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Productos');
  
  // Configurar anchos de columna optimizados
  const columnWidths = [
    30, // nombre
    40, // descripcion
    10, // stock
    15, // precioCompra
    15, // precioVenta
    12, // stockMinimo
    15, // codigoBarras
    15, // sku
    15, // tipoProducto
    12, // unidad
    10, // estado
    25, // etiquetas
    10, // color
    10, // talla
    15, // ubicacion
    15, // temperaturaOptima
    15, // humedadOptima
    12  // rfid
  ];
  
  worksheet['!cols'] = columnWidths.map(width => ({ width }));
  
  // Crear hoja de instrucciones detalladas
  const instructions = [
    ['PLANTILLA DE IMPORTACIÓN - PRODUCTOS'],
    [''],
    ['INSTRUCCIONES GENERALES:'],
    ['1. Complete los datos en la hoja "Productos"'],
    ['2. No modifique los encabezados de las columnas'],
    ['3. Siga el formato de los ejemplos proporcionados'],
    ['4. Los campos marcados con * son obligatorios'],
    ['5. Revise las validaciones antes de importar'],
    [''],
    ['CAMPOS OBLIGATORIOS:'],
    ['Campo', 'Tipo', 'Descripción', 'Ejemplo', 'Validaciones'],
    ['nombre*', 'Texto', 'Nombre del producto', 'Laptop HP Pavilion', 'Mín 2, Máx 100 caracteres'],
    ['stock*', 'Número entero', 'Cantidad disponible', '25', 'Mín 0, Máx 999,999'],
    ['precioCompra*', 'Decimal', 'Precio de compra', '8500.00', 'Mín 0'],
    ['precioVenta*', 'Decimal', 'Precio de venta', '12000.00', 'Mín 0'],
    [''],
    ['CAMPOS OPCIONALES:'],
    ['Campo', 'Tipo', 'Descripción', 'Ejemplo', 'Opciones/Validaciones'],
    ['descripcion', 'Texto', 'Descripción detallada', 'Laptop de 15 pulgadas...', 'Máx 500 caracteres'],
    ['stockMinimo', 'Número entero', 'Stock mínimo', '5', 'Mín 0, Default: 10'],
    ['codigoBarras', 'Texto', 'Código de barras', '7501234567890', 'Máx 50 caracteres, Único'],
    ['sku', 'Texto', 'SKU del producto', 'LAP-HP-PAV-001', 'Máx 50 caracteres, Único'],
    ['tipoProducto', 'Lista', 'Tipo de producto', 'ELECTRONICO', 'GENERICO, ROPA, ALIMENTO, ELECTRONICO, MEDICAMENTO, etc.'],
    ['unidad', 'Lista', 'Unidad de medida', 'UNIDAD', 'UNIDAD, KILO, LITRO, CAJA, etc.'],
    ['estado', 'Lista', 'Estado del producto', 'ACTIVO', 'ACTIVO, INACTIVO'],
    ['etiquetas', 'Texto', 'Etiquetas separadas por comas', 'laptop,computadora', 'Máx 200 caracteres'],
    ['color', 'Texto', 'Color del producto', 'Negro', 'Máx 50 caracteres'],
    ['talla', 'Texto', 'Talla del producto', 'M', 'Máx 20 caracteres'],
    ['ubicacion', 'Texto', 'Ubicación en almacén', 'Estante A-1', 'Máx 100 caracteres'],
    ['temperaturaOptima', 'Decimal', 'Temperatura óptima', '25.0', 'Entre -50 y 100'],
    ['humedadOptima', 'Decimal', 'Humedad óptima', '60.0', 'Entre 0 y 100'],
    ['rfid', 'Texto', 'Código RFID', 'RFID-LAP-001', 'Máx 50 caracteres, Único'],
    [''],
    ['TIPOS DE PRODUCTO DISPONIBLES:'],
    ['GENERICO', 'ROPA', 'ALIMENTO', 'ELECTRONICO', 'MEDICAMENTO', 'SUPLEMENTO'],
    ['EQUIPO_MEDICO', 'CUIDADO_PERSONAL', 'BIOLOGICO', 'MATERIAL_QUIRURGICO', 'SOFTWARE', 'HARDWARE'],
    [''],
    ['UNIDADES DE MEDIDA DISPONIBLES:'],
    ['UNIDAD', 'KILO', 'KILOGRAMO', 'LITRO', 'LITROS', 'CAJA', 'PAQUETE'],
    ['METRO', 'METROS', 'GRAMO', 'GRAMOS', 'MILILITRO', 'MILILITROS', 'CENTIMETRO', 'CENTIMETROS', 'LICENCIA'],
    [''],
    ['NOTAS IMPORTANTES:'],
    ['- Los códigos de barras, SKU y RFID deben ser únicos'],
    ['- Los precios deben ser números decimales válidos'],
    ['- Las etiquetas se separan por comas sin espacios'],
    ['- La fecha se genera automáticamente al importar'],
    ['- El ID del producto se asigna automáticamente']
  ];
  
  const instructionsWorksheet = XLSX.utils.aoa_to_sheet(instructions);
  XLSX.utils.book_append_sheet(workbook, instructionsWorksheet, 'Instrucciones');
  instructionsWorksheet['!cols'] = [{ width: 20 }, { width: 15 }, { width: 30 }, { width: 25 }, { width: 40 }];
  
  // Guardar archivo
  const filePath = path.join(__dirname, '../uploads/plantillas/plantilla-productos-avanzada.xlsx');
  XLSX.writeFile(workbook, filePath);
  
  console.log(`✅ Plantilla avanzada de productos generada: ${filePath}`);
  return filePath;
}

function generateAdvancedProveedoresTemplate() {
  console.log('Generando plantilla avanzada de proveedores...');
  
  const workbook = createAdvancedWorkbook();
  
  // Crear datos de ejemplo
  const exampleData = [
    {
      nombre: 'Distribuidora ABC S.A. de C.V.',
      email: 'contacto@distribuidoraabc.com',
      telefono: '+52 55 1234 5678',
      estado: 'ACTIVO'
    },
    {
      nombre: 'Proveedor XYZ México',
      email: 'ventas@proveedorxyz.com',
      telefono: '+52 55 9876 5432',
      estado: 'ACTIVO'
    },
    {
      nombre: 'Suministros Industriales del Norte',
      email: 'pedidos@suministrosnorte.com',
      telefono: '+52 81 4567 8901',
      estado: 'ACTIVO'
    }
  ];
  
  const worksheet = createAdvancedWorksheet(exampleData, 'Proveedores');
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Proveedores');
  
  // Configurar anchos de columna
  const columnWidths = [35, 30, 20, 12];
  worksheet['!cols'] = columnWidths.map(width => ({ width }));
  
  // Crear hoja de instrucciones
  const instructions = [
    ['PLANTILLA DE IMPORTACIÓN - PROVEEDORES'],
    [''],
    ['INSTRUCCIONES GENERALES:'],
    ['1. Complete los datos en la hoja "Proveedores"'],
    ['2. No modifique los encabezados de las columnas'],
    ['3. Siga el formato de los ejemplos proporcionados'],
    ['4. Los campos marcados con * son obligatorios'],
    [''],
    ['CAMPOS OBLIGATORIOS:'],
    ['Campo', 'Tipo', 'Descripción', 'Ejemplo', 'Validaciones'],
    ['nombre*', 'Texto', 'Nombre del proveedor', 'Distribuidora ABC S.A.', 'Mín 2, Máx 100 caracteres'],
    [''],
    ['CAMPOS OPCIONALES:'],
    ['Campo', 'Tipo', 'Descripción', 'Ejemplo', 'Validaciones'],
    ['email', 'Email', 'Email de contacto', 'contacto@empresa.com', 'Formato válido, Máx 100 caracteres'],
    ['telefono', 'Texto', 'Teléfono de contacto', '+52 55 1234 5678', 'Máx 20 caracteres'],
    ['estado', 'Lista', 'Estado del proveedor', 'ACTIVO', 'ACTIVO, INACTIVO'],
    [''],
    ['ESTADOS DISPONIBLES:'],
    ['ACTIVO', 'INACTIVO'],
    [''],
    ['NOTAS IMPORTANTES:'],
    ['- El nombre del proveedor debe ser único por empresa'],
    ['- El email debe tener formato válido si se proporciona'],
    ['- El estado por defecto es ACTIVO'],
    ['- El ID del proveedor se asigna automáticamente']
  ];
  
  const instructionsWorksheet = XLSX.utils.aoa_to_sheet(instructions);
  XLSX.utils.book_append_sheet(workbook, instructionsWorksheet, 'Instrucciones');
  instructionsWorksheet['!cols'] = [{ width: 20 }, { width: 15 }, { width: 30 }, { width: 25 }, { width: 40 }];
  
  // Guardar archivo
  const filePath = path.join(__dirname, '../uploads/plantillas/plantilla-proveedores-avanzada.xlsx');
  XLSX.writeFile(workbook, filePath);
  
  console.log(`✅ Plantilla avanzada de proveedores generada: ${filePath}`);
  return filePath;
}

function generateAdvancedMovimientosTemplate() {
  console.log('Generando plantilla avanzada de movimientos...');
  
  const workbook = createAdvancedWorkbook();
  
  // Crear datos de ejemplo
  const exampleData = [
    {
      productoId: 1,
      cantidad: 50,
      tipo: 'ENTRADA',
      motivo: 'Compra inicial de inventario',
      descripcion: 'Primera entrada de productos al almacén',
      fecha: '2025-01-15 10:30:00',
      estado: 'ACTIVO'
    },
    {
      productoId: 2,
      cantidad: 25,
      tipo: 'SALIDA',
      motivo: 'Venta al cliente',
      descripcion: 'Venta de productos a cliente final',
      fecha: '2025-01-16 14:20:00',
      estado: 'ACTIVO'
    },
    {
      productoId: 3,
      cantidad: 100,
      tipo: 'ENTRADA',
      motivo: 'Reabastecimiento',
      descripcion: 'Reabastecimiento de productos con stock bajo',
      fecha: '2025-01-17 09:15:00',
      estado: 'ACTIVO'
    }
  ];
  
  const worksheet = createAdvancedWorksheet(exampleData, 'Movimientos');
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Movimientos');
  
  // Configurar anchos de columna
  const columnWidths = [12, 12, 12, 25, 35, 20, 12];
  worksheet['!cols'] = columnWidths.map(width => ({ width }));
  
  // Crear hoja de instrucciones
  const instructions = [
    ['PLANTILLA DE IMPORTACIÓN - MOVIMIENTOS'],
    [''],
    ['INSTRUCCIONES GENERALES:'],
    ['1. Complete los datos en la hoja "Movimientos"'],
    ['2. No modifique los encabezados de las columnas'],
    ['3. Siga el formato de los ejemplos proporcionados'],
    ['4. Los campos marcados con * son obligatorios'],
    ['5. El productoId debe corresponder a un producto existente'],
    [''],
    ['CAMPOS OBLIGATORIOS:'],
    ['Campo', 'Tipo', 'Descripción', 'Ejemplo', 'Validaciones'],
    ['productoId*', 'Número entero', 'ID del producto', '1', 'Debe existir en la base de datos'],
    ['cantidad*', 'Número entero', 'Cantidad del movimiento', '50', 'Mín 1, Máx 999,999'],
    ['tipo*', 'Lista', 'Tipo de movimiento', 'ENTRADA', 'ENTRADA, SALIDA'],
    [''],
    ['CAMPOS OPCIONALES:'],
    ['Campo', 'Tipo', 'Descripción', 'Ejemplo', 'Validaciones'],
    ['motivo', 'Texto', 'Motivo del movimiento', 'Compra inicial', 'Máx 200 caracteres'],
    ['descripcion', 'Texto', 'Descripción adicional', 'Primera entrada...', 'Máx 500 caracteres'],
    ['fecha', 'Fecha/Hora', 'Fecha del movimiento', '2025-01-15 10:30:00', 'Formato: YYYY-MM-DD HH:MM:SS'],
    ['estado', 'Lista', 'Estado del movimiento', 'ACTIVO', 'ACTIVO'],
    [''],
    ['TIPOS DE MOVIMIENTO:'],
    ['ENTRADA', 'SALIDA'],
    [''],
    ['NOTAS IMPORTANTES:'],
    ['- El productoId debe corresponder a un producto existente en el sistema'],
    ['- Las cantidades deben ser números enteros positivos'],
    ['- Para ENTRADA: aumenta el stock del producto'],
    ['- Para SALIDA: disminuye el stock del producto'],
    ['- La fecha por defecto es la fecha actual si no se especifica'],
    ['- El estado por defecto es ACTIVO'],
    ['- El ID del movimiento se asigna automáticamente'],
    [''],
    ['CONSULTA DE PRODUCTOS:'],
    ['Para conocer los IDs de productos disponibles, consulte la lista de productos en el sistema']
  ];
  
  const instructionsWorksheet = XLSX.utils.aoa_to_sheet(instructions);
  XLSX.utils.book_append_sheet(workbook, instructionsWorksheet, 'Instrucciones');
  instructionsWorksheet['!cols'] = [{ width: 20 }, { width: 15 }, { width: 30 }, { width: 25 }, { width: 40 }];
  
  // Guardar archivo
  const filePath = path.join(__dirname, '../uploads/plantillas/plantilla-movimientos-avanzada.xlsx');
  XLSX.writeFile(workbook, filePath);
  
  console.log(`✅ Plantilla avanzada de movimientos generada: ${filePath}`);
  return filePath;
}

// Función principal
function main() {
  console.log('🚀 Generando plantillas avanzadas de importación...\n');
  
  try {
    // Crear directorio si no existe
    const fs = require('fs');
    const plantillasDir = path.join(__dirname, '../uploads/plantillas');
    if (!fs.existsSync(plantillasDir)) {
      fs.mkdirSync(plantillasDir, { recursive: true });
    }
    
    // Generar todas las plantillas avanzadas
    generateAdvancedProductosTemplate();
    generateAdvancedProveedoresTemplate();
    generateAdvancedMovimientosTemplate();
    
    console.log('\n🎉 ¡Todas las plantillas avanzadas han sido generadas exitosamente!');
    console.log('\n📁 Ubicación de las plantillas avanzadas:');
    console.log('   - Productos: uploads/plantillas/plantilla-productos-avanzada.xlsx');
    console.log('   - Proveedores: uploads/plantillas/plantilla-proveedores-avanzada.xlsx');
    console.log('   - Movimientos: uploads/plantillas/plantilla-movimientos-avanzada.xlsx');
    
  } catch (error) {
    console.error('❌ Error generando plantillas avanzadas:', error);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = {
  generateAdvancedProductosTemplate,
  generateAdvancedProveedoresTemplate,
  generateAdvancedMovimientosTemplate
}; 