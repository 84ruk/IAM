const XLSX = require('xlsx');
const path = require('path');

function generarPlantillaMovimientos() {
  console.log('📋 Generando plantilla de movimientos...\n');

  // Datos de ejemplo para la plantilla
  const datosEjemplo = [
    ['producto', 'tipo', 'cantidad', 'descripcion', 'fecha', 'motivo'],
    ['Laptop HP Pavilion', 'ENTRADA', 10, 'Compra de inventario inicial', '2024-01-15', 'Compra proveedor'],
    ['Mouse Logitech MX Master', 'SALIDA', 5, 'Venta a cliente corporativo', '15/01/2024', 'Venta directa'],
    ['Teclado Mecánico RGB', 'ENTRADA', 20, 'Devolución de cliente', '15-01-2024', 'Devolución'],
    ['Monitor Dell 24"', 'SALIDA', 3, 'Transferencia a sucursal norte', '01/15/2024', 'Transferencia interna'],
    ['Producto Nuevo Automático', 'ENTRADA', 50, 'Producto creado automáticamente', '2024-01-15', 'Importación masiva'],
    ['Auriculares Sony WH-1000XM4', 'ENTRADA', 15, 'Stock de seguridad', '2024-01-16', 'Reposición'],
    ['Cable HDMI 2.1', 'SALIDA', 8, 'Venta online', '16/01/2024', 'E-commerce'],
    ['Disco Duro SSD 1TB', 'ENTRADA', 25, 'Compra mayorista', '16-01-2024', 'Compra mayorista'],
    ['Webcam Logitech C920', 'SALIDA', 12, 'Venta a empresa', '01/16/2024', 'Venta B2B'],
    ['Memoria RAM 16GB DDR4', 'ENTRADA', 30, 'Importación directa', '2024-01-17', 'Importación'],
  ];

  // Crear workbook
  const workbook = XLSX.utils.book_new();
  
  // Crear worksheet con datos de ejemplo
  const worksheet = XLSX.utils.aoa_to_sheet(datosEjemplo);
  
  // Configurar anchos de columna
  const columnWidths = [
    { wch: 25 }, // producto
    { wch: 10 }, // tipo
    { wch: 10 }, // cantidad
    { wch: 35 }, // descripcion
    { wch: 15 }, // fecha
    { wch: 20 }, // motivo
  ];
  worksheet['!cols'] = columnWidths;

  // Agregar estilos a la primera fila (headers)
  for (let col = 0; col < datosEjemplo[0].length; col++) {
    const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
    if (!worksheet[cellRef]) {
      worksheet[cellRef] = { v: datosEjemplo[0][col] };
    }
    worksheet[cellRef].s = {
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '4472C4' } },
      alignment: { horizontal: 'center', vertical: 'center' }
    };
  }

  // Agregar estilos a las filas de ejemplo
  for (let row = 1; row < datosEjemplo.length; row++) {
    for (let col = 0; col < datosEjemplo[row].length; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
      if (!worksheet[cellRef]) {
        worksheet[cellRef] = { v: datosEjemplo[row][col] };
      }
      
      // Estilo alternado para filas
      const isEvenRow = row % 2 === 0;
      worksheet[cellRef].s = {
        fill: { fgColor: { rgb: isEvenRow ? 'F2F2F2' : 'FFFFFF' } },
        alignment: { vertical: 'center' }
      };
    }
  }

  // Agregar worksheet al workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Movimientos');

  // Crear worksheet de instrucciones
  const instrucciones = [
    ['INSTRUCCIONES PARA IMPORTACIÓN DE MOVIMIENTOS'],
    [''],
    ['CAMPOS REQUERIDOS:'],
    ['• producto: Nombre del producto o ID (si no existe, se crea automáticamente)'],
    ['• tipo: ENTRADA o SALIDA'],
    ['• cantidad: Número entero positivo'],
    [''],
    ['CAMPOS OPCIONALES:'],
    ['• descripcion: Descripción del movimiento'],
    ['• fecha: Fecha del movimiento (múltiples formatos soportados)'],
    ['• motivo: Motivo del movimiento'],
    [''],
    ['FORMATOS DE FECHA SOPORTADOS:'],
    ['• YYYY-MM-DD (ejemplo: 2024-01-15)'],
    ['• DD/MM/YYYY (ejemplo: 15/01/2024)'],
    ['• DD-MM-YYYY (ejemplo: 15-01-2024)'],
    ['• MM/DD/YYYY (ejemplo: 01/15/2024)'],
    ['• ISO (ejemplo: 2024-01-15T10:30:00Z)'],
    [''],
    ['NOTAS IMPORTANTES:'],
    ['1. Si el producto no existe, se crea automáticamente con stock inicial 0'],
    ['2. El stock se actualiza automáticamente según el tipo de movimiento'],
    ['3. Los movimientos de SALIDA verifican que haya stock suficiente'],
    ['4. Las fechas futuras no están permitidas'],
    ['5. Las cantidades deben ser números enteros positivos'],
    ['6. Los productos creados automáticamente tienen etiquetas especiales'],
    [''],
    ['EJEMPLOS DE TIPOS DE MOVIMIENTO:'],
    ['• ENTRADA: Compra, devolución, transferencia entrante, ajuste positivo'],
    ['• SALIDA: Venta, transferencia saliente, pérdida, ajuste negativo'],
    [''],
    ['VALIDACIONES AUTOMÁTICAS:'],
    ['• Verificación de stock suficiente para salidas'],
    ['• Validación de fechas (no futuras)'],
    ['• Normalización de tipos de movimiento'],
    ['• Creación automática de productos inexistentes'],
    ['• Actualización automática de stock'],
  ];

  const worksheetInstrucciones = XLSX.utils.aoa_to_sheet(instrucciones);
  worksheetInstrucciones['!cols'] = [{ wch: 80 }]; // Ancho de columna para instrucciones
  
  // Estilo para el título
  const tituloRef = XLSX.utils.encode_cell({ r: 0, c: 0 });
  worksheetInstrucciones[tituloRef].s = {
    font: { bold: true, size: 14, color: { rgb: '4472C4' } },
    alignment: { horizontal: 'center' }
  };

  XLSX.utils.book_append_sheet(workbook, worksheetInstrucciones, 'Instrucciones');

  // Guardar archivo
  const filePath = path.join(__dirname, 'plantilla-movimientos-completa.xlsx');
  XLSX.writeFile(workbook, filePath);

  console.log('✅ Plantilla generada exitosamente:');
  console.log(`   📁 Archivo: ${filePath}`);
  console.log('\n📋 Contenido de la plantilla:');
  console.log('   • Hoja "Movimientos": Datos de ejemplo con diferentes formatos');
  console.log('   • Hoja "Instrucciones": Guía completa de uso');
  console.log('\n🎯 Características de la plantilla:');
  console.log('   • Formato profesional con estilos');
  console.log('   • Ejemplos de todos los formatos de fecha soportados');
  console.log('   • Instrucciones detalladas de uso');
  console.log('   • Validaciones automáticas explicadas');
  console.log('   • Casos de uso reales');
}

// Ejecutar la generación
generarPlantillaMovimientos(); 