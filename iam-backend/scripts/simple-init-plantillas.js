#!/usr/bin/env node

/**
 * Script simple de inicialización de plantillas
 * No depende de otros scripts, genera las plantillas directamente
 */

const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

// Configuración de plantillas basada en schema.prisma
const PLANTILLA_CONFIG = {
  productos: {
    nombre: 'plantilla-productos-auto.xlsx',
    columnas: [
      'nombre', 'descripcion', 'stock', 'precioCompra', 'precioVenta', 
      'stockMinimo', 'tipoProducto', 'unidad', 'estado', 'codigoBarras', 
      'sku', 'ubicacion', 'color', 'talla', 'etiquetas'
    ],
    validaciones: {
      tipoProducto: ['GENERICO', 'ROPA', 'ALIMENTO', 'ELECTRONICO', 'MEDICAMENTO', 'SUPLEMENTO', 'EQUIPO_MEDICO', 'CUIDADO_PERSONAL', 'BIOLOGICO', 'MATERIAL_QUIRURGICO', 'SOFTWARE', 'HARDWARE'],
      unidad: ['UNIDAD', 'KILO', 'KILOGRAMO', 'LITRO', 'LITROS', 'CAJA', 'PAQUETE', 'METRO', 'METROS', 'GRAMO', 'GRAMOS', 'MILILITRO', 'MILILITROS', 'CENTIMETRO', 'CENTIMETROS', 'LICENCIA'],
      estado: ['ACTIVO', 'INACTIVO', 'ELIMINADO']
    }
  },
  proveedores: {
    nombre: 'plantilla-proveedores-auto.xlsx',
    columnas: ['nombre', 'email', 'telefono', 'estado'],
    validaciones: {
      estado: ['ACTIVO', 'INACTIVO', 'ELIMINADO']
    }
  },
  movimientos: {
    nombre: 'plantilla-movimientos-auto.xlsx',
    columnas: ['cantidad', 'productoId', 'fecha', 'motivo', 'tipo', 'descripcion', 'estado'],
    validaciones: {
      tipo: ['ENTRADA', 'SALIDA'],
      estado: ['ACTIVO', 'ELIMINADO']
    }
  }
};

async function generarPlantillaSimple(tipo) {
  const config = PLANTILLA_CONFIG[tipo];
  if (!config) {
    throw new Error(`Tipo de plantilla no válido: ${tipo}`);
  }

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Plantilla');
  
  // Configurar propiedades del workbook
  workbook.creator = 'Sistema de Gestión';
  workbook.lastModifiedBy = 'Sistema de Gestión';
  workbook.created = new Date();
  workbook.modified = new Date();

  // Agregar columnas
  worksheet.columns = config.columnas.map(col => ({
    header: col.charAt(0).toUpperCase() + col.slice(1),
    key: col,
    width: 15
  }));

  // Estilo para el header
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, name: 'Calibri', size: 12 };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' }
  };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

  // Agregar fila de ejemplo
  const exampleRow = worksheet.addRow(config.columnas.map(() => 'Ejemplo'));
  exampleRow.font = { name: 'Calibri', size: 11, italic: true };
  exampleRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF2F2F2' }
  };

  // Agregar validaciones
  Object.entries(config.validaciones).forEach(([campo, valores]) => {
    const colIndex = config.columnas.indexOf(campo) + 1;
    if (colIndex > 0) {
      worksheet.dataValidations.add(`${String.fromCharCode(64 + colIndex)}2:${String.fromCharCode(64 + colIndex)}1000`, {
        type: 'list',
        allowBlank: true,
        formulae: [`"${valores.join(',')}"`]
      });
    }
  });

  // Asegurar directorio
  const uploadsDir = path.join(process.cwd(), 'uploads');
  const plantillasDir = path.join(uploadsDir, 'plantillas');
  
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  if (!fs.existsSync(plantillasDir)) {
    fs.mkdirSync(plantillasDir, { recursive: true });
  }

  // Guardar archivo
  const filePath = path.join(plantillasDir, config.nombre);
  await workbook.xlsx.writeFile(filePath);
  
  console.log(`✅ Plantilla ${config.nombre} generada`);
  return config.nombre;
}

async function initPlantillasSimple() {
  console.log('🚀 Inicializando plantillas de forma simple...');

  try {
    const tipos = ['productos', 'proveedores', 'movimientos'];
    const plantillasGeneradas = [];

    for (const tipo of tipos) {
      try {
        const nombreArchivo = await generarPlantillaSimple(tipo);
        plantillasGeneradas.push(nombreArchivo);
      } catch (error) {
        console.error(`❌ Error generando plantilla ${tipo}:`, error.message);
      }
    }

    // Verificar que las plantillas se generaron correctamente
    const plantillasDir = path.join(process.cwd(), 'uploads', 'plantillas');
    
    if (fs.existsSync(plantillasDir)) {
      const archivosExistentes = fs.readdirSync(plantillasDir)
        .filter(archivo => archivo.endsWith('.xlsx'))
        .filter(archivo => archivo.includes('auto'));

      console.log(`\n📋 Plantillas automáticas encontradas: ${archivosExistentes.length}`);
      archivosExistentes.forEach(archivo => {
        const stats = fs.statSync(path.join(plantillasDir, archivo));
        console.log(`   ✅ ${archivo} (${(stats.size / 1024).toFixed(1)} KB)`);
      });
    }

    console.log('✅ Inicialización de plantillas completada');

  } catch (error) {
    console.error('❌ Error en inicialización de plantillas:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  initPlantillasSimple().catch(console.error);
}

module.exports = { initPlantillasSimple, generarPlantillaSimple }; 