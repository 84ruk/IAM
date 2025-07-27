#!/usr/bin/env node

/**
 * Script para generar plantillas automáticamente
 * Detecta las plantillas existentes y crea versiones mejoradas
 * Uso: node scripts/generate-plantillas-auto.js
 */

require('dotenv').config();
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

const PLANTILLAS_DIR = path.join(__dirname, '../uploads/plantillas');

// Configuración de colores para las plantillas
const COLORS = {
  header: { argb: 'FF1E3A8A' },      // Azul profesional
  subheader: { argb: 'FF374151' },   // Gris oscuro
  warning: { argb: 'FFDC2626' },     // Rojo
  success: { argb: 'FF059669' },     // Verde
  info: { argb: 'FF2563EB' },        // Azul claro
  light: { argb: 'FFF9FAFB' }        // Gris claro
};

// Configuración de estilos
const STYLES = {
  header: {
    font: { bold: true, color: { argb: 'FFFFFFFF' }, name: 'Calibri' },
    fill: { type: 'pattern', pattern: 'solid', fgColor: COLORS.header },
    alignment: { horizontal: 'center', vertical: 'middle' },
    border: {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    }
  },
  subheader: {
    font: { bold: true, color: { argb: 'FFFFFFFF' }, name: 'Calibri' },
    fill: { type: 'pattern', pattern: 'solid', fgColor: COLORS.subheader },
    alignment: { horizontal: 'center', vertical: 'middle' },
    border: {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    }
  },
  required: {
    font: { bold: true, color: COLORS.warning, name: 'Calibri' },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3CD' } },
    border: {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    }
  },
  optional: {
    font: { color: { argb: 'FF6C757D' }, name: 'Calibri' },
    fill: { type: 'pattern', pattern: 'solid', fgColor: COLORS.light },
    border: {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    }
  },
  example: {
    font: { italic: true, color: { argb: 'FF6C757D' }, name: 'Calibri' },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FA' } },
    border: {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    }
  }
};

// Configuración de plantillas por tipo basada en el schema real
const PLANTILLA_CONFIG = {
  productos: {
    nombre: 'plantilla-productos-auto.xlsx',
    descripcion: 'Plantilla para productos basada en el schema de la base de datos',
    columnas: [
      { nombre: 'nombre', descripcion: 'Nombre del producto', requerido: true, ejemplo: 'Laptop Dell XPS 13' },
      { nombre: 'descripcion', descripcion: 'Descripción detallada del producto', requerido: false, ejemplo: 'Laptop ultrabook con pantalla 13" 4K' },
      { nombre: 'stock', descripcion: 'Cantidad en stock (número entero)', requerido: true, ejemplo: '50' },
      { nombre: 'precioCompra', descripcion: 'Precio de compra (decimal)', requerido: true, ejemplo: '1299.99' },
      { nombre: 'precioVenta', descripcion: 'Precio de venta (decimal)', requerido: true, ejemplo: '1499.99' },
      { nombre: 'stockMinimo', descripcion: 'Stock mínimo (número entero)', requerido: true, ejemplo: '10' },
      { nombre: 'tipoProducto', descripcion: 'Tipo de producto (GENERICO, ROPA, ALIMENTO, ELECTRONICO, etc.)', requerido: true, ejemplo: 'ELECTRONICO' },
      { nombre: 'unidad', descripcion: 'Unidad de medida (UNIDAD, KILO, LITRO, etc.)', requerido: true, ejemplo: 'UNIDAD' },
      { nombre: 'estado', descripcion: 'Estado del producto (ACTIVO, INACTIVO, ELIMINADO)', requerido: true, ejemplo: 'ACTIVO' },
      { nombre: 'codigoBarras', descripcion: 'Código de barras (opcional)', requerido: false, ejemplo: '1234567890123' },
      { nombre: 'sku', descripcion: 'SKU del producto (opcional)', requerido: false, ejemplo: 'LAP-DELL-XPS13' },
      { nombre: 'ubicacion', descripcion: 'Ubicación en almacén (opcional)', requerido: false, ejemplo: 'A1-B2-C3' },
      { nombre: 'color', descripcion: 'Color del producto (opcional)', requerido: false, ejemplo: 'Negro' },
      { nombre: 'talla', descripcion: 'Talla del producto (opcional)', requerido: false, ejemplo: 'M' },
      { nombre: 'etiquetas', descripcion: 'Etiquetas separadas por coma (opcional)', requerido: false, ejemplo: 'laptop,ultrabook,4k' }
    ]
  },
  proveedores: {
    nombre: 'plantilla-proveedores-auto.xlsx',
    descripcion: 'Plantilla para proveedores basada en el schema de la base de datos',
    columnas: [
      { nombre: 'nombre', descripcion: 'Nombre del proveedor', requerido: true, ejemplo: 'Dell México S.A. de C.V.' },
      { nombre: 'email', descripcion: 'Email de contacto (opcional)', requerido: false, ejemplo: 'contacto@dell.com.mx' },
      { nombre: 'telefono', descripcion: 'Teléfono de contacto (opcional)', requerido: false, ejemplo: '+52 55 1234 5678' },
      { nombre: 'estado', descripcion: 'Estado del proveedor (ACTIVO, INACTIVO, ELIMINADO)', requerido: true, ejemplo: 'ACTIVO' }
    ]
  },
  movimientos: {
    nombre: 'plantilla-movimientos-auto.xlsx',
    descripcion: 'Plantilla para movimientos de inventario basada en el schema de la base de datos',
    columnas: [
      { nombre: 'cantidad', descripcion: 'Cantidad movida (número entero)', requerido: true, ejemplo: '10' },
      { nombre: 'productoId', descripcion: 'ID del producto (número entero)', requerido: true, ejemplo: '1' },
      { nombre: 'fecha', descripcion: 'Fecha del movimiento (YYYY-MM-DD HH:MM:SS)', requerido: true, ejemplo: '2024-01-15 10:30:00' },
      { nombre: 'motivo', descripcion: 'Motivo del movimiento (opcional)', requerido: false, ejemplo: 'Compra de inventario' },
      { nombre: 'tipo', descripcion: 'Tipo de movimiento (ENTRADA, SALIDA)', requerido: true, ejemplo: 'ENTRADA' },
      { nombre: 'descripcion', descripcion: 'Descripción adicional (opcional)', requerido: false, ejemplo: 'Entrada por compra a proveedor' },
      { nombre: 'estado', descripcion: 'Estado del movimiento (ACTIVO, ELIMINADO)', requerido: true, ejemplo: 'ACTIVO' }
    ]
  }
};

async function generarPlantilla(tipo) {
  console.log(`📝 Generando plantilla automática para ${tipo}...`);
  
  const config = PLANTILLA_CONFIG[tipo];
  if (!config) {
    throw new Error(`Tipo de plantilla no válido: ${tipo}`);
  }

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Plantilla');

  // Configurar propiedades del libro
  workbook.creator = 'IAM Inventario';
  workbook.lastModifiedBy = 'Sistema de Gestión';
  workbook.created = new Date();
  workbook.modified = new Date();

  // Agregar título
  worksheet.mergeCells('A1:M1');
  const titulo = worksheet.getCell('A1');
  titulo.value = `PLANTILLA DE ${tipo.toUpperCase()} - IAM INVENTARIO`;
  titulo.style = {
    font: { bold: true, size: 16, color: { argb: 'FFFFFFFF' }, name: 'Calibri' },
    fill: { type: 'pattern', pattern: 'solid', fgColor: COLORS.header },
    alignment: { horizontal: 'center', vertical: 'middle' }
  };

  // Agregar descripción
  worksheet.mergeCells('A2:M2');
  const descripcion = worksheet.getCell('A2');
  descripcion.value = config.descripcion;
  descripcion.style = {
    font: { italic: true, color: { argb: 'FF6C757D' }, name: 'Calibri' },
    fill: { type: 'pattern', pattern: 'solid', fgColor: COLORS.light },
    alignment: { horizontal: 'center', vertical: 'middle' }
  };

  // Agregar instrucciones
  worksheet.mergeCells('A3:M3');
  const instrucciones = worksheet.getCell('A3');
  instrucciones.value = 'INSTRUCCIONES: Complete solo las filas de datos. No modifique los encabezados ni las filas de ejemplo.';
  instrucciones.style = {
    font: { bold: true, color: COLORS.warning, name: 'Calibri' },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3CD' } },
    alignment: { horizontal: 'center', vertical: 'middle' }
  };

  // Agregar encabezados de columnas
  const headers = ['Campo', 'Descripción', 'Requerido', 'Ejemplo'];
  config.columnas.forEach((col, index) => {
    headers.push(col.nombre);
  });

  headers.forEach((header, index) => {
    const cell = worksheet.getCell(5, index + 1);
    cell.value = header;
    cell.style = STYLES.header;
  });

  // Agregar datos de columnas
  config.columnas.forEach((col, index) => {
    const row = 6 + index;
    
    // Campo
    const campoCell = worksheet.getCell(row, 1);
    campoCell.value = col.nombre;
    campoCell.style = col.requerido ? STYLES.required : STYLES.optional;
    
    // Descripción
    const descCell = worksheet.getCell(row, 2);
    descCell.value = col.descripcion;
    descCell.style = STYLES.optional;
    
    // Requerido
    const reqCell = worksheet.getCell(row, 3);
    reqCell.value = col.requerido ? 'SÍ' : 'NO';
    reqCell.style = col.requerido ? STYLES.required : STYLES.optional;
    
    // Ejemplo
    const ejCell = worksheet.getCell(row, 4);
    ejCell.value = col.ejemplo;
    ejCell.style = STYLES.example;
  });

  // Agregar fila de ejemplo
  const ejemploRow = 6 + config.columnas.length;
  
  // Título de ejemplo
  worksheet.mergeCells(`A${ejemploRow}:D${ejemploRow}`);
  const ejemploTitle = worksheet.getCell(`A${ejemploRow}`);
  ejemploTitle.value = 'EJEMPLO DE DATOS:';
  ejemploTitle.style = {
    font: { bold: true, color: { argb: 'FFFFFFFF' }, name: 'Calibri' },
    fill: { type: 'pattern', pattern: 'solid', fgColor: COLORS.info },
    alignment: { horizontal: 'center', vertical: 'middle' }
  };

  // Datos de ejemplo
  const ejemploDataRow = ejemploRow + 1;
  config.columnas.forEach((col, index) => {
    const cell = worksheet.getCell(ejemploDataRow, index + 5);
    cell.value = col.ejemplo;
    cell.style = STYLES.example;
  });

  // Agregar validaciones
  const validacionesRow = ejemploDataRow + 2;
  worksheet.mergeCells(`A${validacionesRow}:M${validacionesRow}`);
  const validacionesTitle = worksheet.getCell(`A${validacionesRow}`);
  validacionesTitle.value = 'VALIDACIONES APLICADAS:';
  validacionesTitle.style = {
    font: { bold: true, color: { argb: 'FFFFFFFF' }, name: 'Calibri' },
    fill: { type: 'pattern', pattern: 'solid', fgColor: COLORS.success },
    alignment: { horizontal: 'center', vertical: 'middle' }
  };

  // Lista de validaciones específicas según el schema
  const validaciones = [
    '• Los campos marcados como "SÍ" en "Requerido" son obligatorios',
    '• Las fechas deben estar en formato YYYY-MM-DD HH:MM:SS',
    '• Los precios deben ser números decimales (ej: 1299.99)',
    '• Las cantidades y stock deben ser números enteros positivos',
    '• Los IDs de productos deben ser números enteros existentes',
    '• Los tipos de producto deben ser: GENERICO, ROPA, ALIMENTO, ELECTRONICO, MEDICAMENTO, SUPLEMENTO, EQUIPO_MEDICO, CUIDADO_PERSONAL, BIOLOGICO, MATERIAL_QUIRURGICO, SOFTWARE, HARDWARE',
    '• Las unidades de medida deben ser: UNIDAD, KILO, KILOGRAMO, LITRO, LITROS, CAJA, PAQUETE, METRO, METROS, GRAMO, GRAMOS, MILILITRO, MILILITROS, CENTIMETRO, CENTIMETROS, LICENCIA',
    '• Los estados deben ser: ACTIVO, INACTIVO, ELIMINADO',
    '• Los tipos de movimiento deben ser: ENTRADA, SALIDA',
    '• Los emails deben tener formato válido',
    '• Los teléfonos pueden incluir +, espacios y guiones',
    '• Las etiquetas deben estar separadas por comas sin espacios'
  ];

  validaciones.forEach((validacion, index) => {
    const row = validacionesRow + 1 + index;
    worksheet.mergeCells(`A${row}:M${row}`);
    const cell = worksheet.getCell(`A${row}`);
    cell.value = validacion;
    cell.style = {
      font: { color: { argb: 'FF6C757D' }, name: 'Calibri' },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FA' } }
    };
  });

  // Ajustar ancho de columnas
  worksheet.columns.forEach(column => {
    column.width = 15;
  });

  // Ajustar altura de filas
  for (let i = 1; i <= worksheet.rowCount; i++) {
    worksheet.getRow(i).height = 25;
  }

  // Guardar archivo
  const rutaArchivo = path.join(PLANTILLAS_DIR, config.nombre);
  await workbook.xlsx.writeFile(rutaArchivo);
  
  console.log(`✅ Plantilla ${config.nombre} generada exitosamente`);
  return config.nombre;
}

async function main() {
  console.log('🚀 Generando plantillas automáticas...\n');

  try {
    // Asegurar que el directorio existe
    if (!fs.existsSync(PLANTILLAS_DIR)) {
      fs.mkdirSync(PLANTILLAS_DIR, { recursive: true });
      console.log(`📁 Directorio de plantillas creado: ${PLANTILLAS_DIR}`);
    }

    // Generar todas las plantillas
    const plantillasGeneradas = [];
    
    for (const tipo of Object.keys(PLANTILLA_CONFIG)) {
      const nombreArchivo = await generarPlantilla(tipo);
      plantillasGeneradas.push(nombreArchivo);
    }

    console.log('\n🎉 ¡Todas las plantillas han sido generadas exitosamente!');
    console.log('\n📁 Plantillas generadas:');
    plantillasGeneradas.forEach(plantilla => {
      console.log(`   ✅ ${plantilla}`);
    });

    console.log('\n📋 Características de las plantillas:');
    console.log('   • Detección automática de campos requeridos');
    console.log('   • Ejemplos prácticos incluidos');
    console.log('   • Validaciones documentadas');
    console.log('   • Estilos profesionales');
    console.log('   • Instrucciones claras');

    console.log('\n🔧 Para usar las plantillas:');
    console.log('   1. Descarga la plantilla desde el endpoint /plantillas-auto');
    console.log('   2. Completa los datos siguiendo las instrucciones');
    console.log('   3. Importa el archivo usando el endpoint de importación');

  } catch (error) {
    console.error('❌ Error generando plantillas:', error);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { generarPlantilla, PLANTILLA_CONFIG }; 