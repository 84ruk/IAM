const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// Función para crear un archivo de prueba de movimientos
function crearArchivoMovimientosPrueba() {
  const workbook = XLSX.utils.book_new();
  
  // Datos de prueba para movimientos
  const datosMovimientos = [
    {
      tipo: 'entrada',
      productoid: 'Laptop HP',
      cantidad: 5,
      descripcion: 'Compra de laptops',
      motivo: 'Reabastecimiento',
      fecha: '2024-01-15',
      empresaid: 1,
      createdat: '2024-01-15T10:00:00Z'
    },
    {
      tipo: 'salida',
      productoid: 'Mouse Inalámbrico',
      cantidad: 2,
      descripcion: 'Venta de mouses',
      motivo: 'Venta directa',
      fecha: '2024-01-16',
      empresaid: 1,
      createdat: '2024-01-16T14:30:00Z'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(datosMovimientos);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Movimientos');

  const fileName = 'plantilla-movimientos-inteligente.xlsx';
  const filePath = path.join(__dirname, fileName);
  
  XLSX.writeFile(workbook, filePath);
  console.log(`✅ Archivo de prueba creado: ${filePath}`);
  
  return filePath;
}

// Función para simular la detección de tipo
function simularDeteccionTipo(columnas) {
  console.log('🔍 Simulando detección de tipo...');
  console.log(`📋 Columnas detectadas: ${columnas.join(', ')}`);
  
  // Patrones de movimientos
  const patronesMovimientos = [
    'tipo', 'productoid', 'cantidad', 'descripcion', 'motivo', 'fecha', 'empresaid', 'createdat'
  ];
  
  let coincidencias = 0;
  columnas.forEach(col => {
    if (patronesMovimientos.includes(col.toLowerCase())) {
      coincidencias++;
    }
  });
  
  const confianza = Math.round((coincidencias / patronesMovimientos.length) * 100);
  console.log(`✅ Tipo detectado: movimientos (confianza: ${confianza}%)`);
  
  return {
    tipo: 'movimientos',
    confianza: confianza,
    columnasDetectadas: columnas
  };
}

// Función para simular el mapeo de movimientos
function simularMapeoMovimientos(row, headers) {
  console.log('🔄 Simulando mapeo de movimientos...');
  
  const movimiento = {};
  
  headers.forEach((header, index) => {
    const value = row[index];
    const headerLower = header.toLowerCase().trim();
    
    switch (headerLower) {
      case 'producto':
      case 'productoid':
      case 'producto_id':
      case 'producto id':
      case 'id_producto':
      case 'idproducto':
        const productoId = parseInt(value);
        movimiento.productoId = isNaN(productoId) ? value : productoId;
        console.log(`  📦 Producto: ${movimiento.productoId} (${typeof movimiento.productoId})`);
        break;
      case 'tipo':
      case 'tipo_movimiento':
      case 'tipo movimiento':
      case 'operacion':
      case 'accion':
        const tipoNormalizado = normalizarTipoMovimiento(value);
        movimiento.tipo = tipoNormalizado;
        console.log(`  🔄 Tipo: ${value} -> ${tipoNormalizado}`);
        break;
      case 'cantidad':
      case 'cant':
      case 'qty':
      case 'volumen':
      case 'unidades':
        movimiento.cantidad = parseInt(value) || 0;
        console.log(`  📊 Cantidad: ${movimiento.cantidad}`);
        break;
      case 'motivo':
      case 'razon':
      case 'causa':
      case 'justificacion':
      case 'descripcion_motivo':
        movimiento.motivo = value;
        console.log(`  💬 Motivo: ${movimiento.motivo}`);
        break;
      case 'descripcion':
      case 'desc':
      case 'comentario':
      case 'notas':
        movimiento.descripcion = value;
        console.log(`  📝 Descripción: ${movimiento.descripcion}`);
        break;
      case 'fecha':
      case 'fecha_movimiento':
      case 'fecha_transaccion':
      case 'fecha movimiento':
      case 'fecha transaccion':
      case 'dia':
      case 'fecha_creacion':
        if (value) {
          const fecha = new Date(value);
          if (!isNaN(fecha.getTime())) {
            movimiento.fecha = fecha;
            console.log(`  📅 Fecha: ${movimiento.fecha}`);
          }
        }
        break;
      case 'empresa':
      case 'empresaid':
      case 'empresa_id':
      case 'empresa id':
      case 'id_empresa':
      case 'idempresa':
        console.log(`  🏢 Empresa: ${value} (se asignará automáticamente)`);
        break;
      case 'estado':
      case 'status':
      case 'estado_movimiento':
        if (value) {
          movimiento.estado = normalizarEstadoMovimiento(value);
          console.log(`  ✅ Estado: ${value} -> ${movimiento.estado}`);
        }
        break;
      case 'usuario':
      case 'usuario_id':
      case 'user':
      case 'user_id':
      case 'id_usuario':
      case 'idusuario':
      case 'createdat':
      case 'created_at':
      case 'fecha_creacion':
      case 'fecha_creado':
      case 'created':
      case 'updatedat':
      case 'updated_at':
      case 'fecha_actualizacion':
      case 'updated':
      case 'id':
      case 'movimiento_id':
      case 'id_movimiento':
        console.log(`  ⏭️ Campo ignorado: ${header} (${value})`);
        break;
      default:
        console.log(`  ❓ Campo no reconocido: ${header} (${value})`);
        break;
    }
  });
  
  return movimiento;
}

function normalizarTipoMovimiento(valor) {
  if (!valor) return 'ENTRADA';
  
  const valorUpper = valor.toString().toUpperCase().trim();
  
  const mapeoTipos = {
    'ENTRADA': 'ENTRADA',
    'SALIDA': 'SALIDA',
    'IN': 'ENTRADA',
    'OUT': 'SALIDA',
    'COMPRA': 'ENTRADA',
    'VENTA': 'SALIDA',
    'RECEPCION': 'ENTRADA',
    'DESPACHO': 'SALIDA',
    'INGRESO': 'ENTRADA',
    'EGRESO': 'SALIDA',
    'ADICION': 'ENTRADA',
    'REDUCCION': 'SALIDA',
  };
  
  return mapeoTipos[valorUpper] || 'ENTRADA';
}

function normalizarEstadoMovimiento(valor) {
  if (!valor) return 'ACTIVO';
  
  const valorUpper = valor.toString().toUpperCase().trim();
  
  const mapeoEstados = {
    'ACTIVO': 'ACTIVO',
    'ELIMINADO': 'ELIMINADO',
    'PENDIENTE': 'ACTIVO',
    'COMPLETADO': 'ACTIVO',
    'CANCELADO': 'ELIMINADO',
    'ANULADO': 'ELIMINADO',
  };
  
  return mapeoEstados[valorUpper] || 'ACTIVO';
}

// Función para validar movimientos
function validarMovimiento(data) {
  console.log('🔍 Validando movimiento...');
  
  if (!data.productoId) {
    console.log('  ❌ Error: Producto es requerido');
    return { valido: false, columna: 'producto', valor: data.productoId };
  }
  
  if (!data.tipo || !['ENTRADA', 'SALIDA'].includes(data.tipo)) {
    console.log(`  ❌ Error: Tipo debe ser ENTRADA o SALIDA, recibido: ${data.tipo}`);
    return { valido: false, columna: 'tipo', valor: data.tipo };
  }
  
  if (data.cantidad <= 0) {
    console.log(`  ❌ Error: Cantidad debe ser positiva, recibido: ${data.cantidad}`);
    return { valido: false, columna: 'cantidad', valor: data.cantidad };
  }
  
  console.log('  ✅ Movimiento válido');
  return { valido: true };
}

// Función principal de prueba
function ejecutarPrueba() {
  console.log('🚀 Iniciando prueba de importación inteligente de movimientos...\n');
  
  try {
    // 1. Crear archivo de prueba
    const filePath = crearArchivoMovimientosPrueba();
    
    // 2. Leer el archivo
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // 3. Extraer columnas
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    const columnas = [];
    
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      const cell = worksheet[cellAddress];
      if (cell && cell.v) {
        columnas.push(cell.v.toString());
      }
    }
    
    // 4. Simular detección de tipo
    const deteccion = simularDeteccionTipo(columnas);
    
    // 5. Simular discrepancia de tipos
    const tipoSeleccionado = 'productos';
    const tiposCoinciden = deteccion.tipo === tipoSeleccionado;
    
    console.log(`\n⚠️ Discrepancia de tipos:`);
    console.log(`   Seleccionado: ${tipoSeleccionado}`);
    console.log(`   Detectado: ${deteccion.tipo}`);
    console.log(`   Coinciden: ${tiposCoinciden}`);
    
    if (!tiposCoinciden && deteccion.confianza >= 70) {
      console.log(`✅ Usando tipo detectado automáticamente: ${deteccion.tipo}`);
    }
    
    // 6. Procesar cada fila
    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    const dataRows = rows.slice(1); // Excluir header
    
    console.log(`\n📊 Procesando ${dataRows.length} filas...`);
    
    dataRows.forEach((row, index) => {
      console.log(`\n--- Fila ${index + 1} ---`);
      console.log(`Datos originales: ${JSON.stringify(row)}`);
      
      // Simular mapeo
      const movimientoMapeado = simularMapeoMovimientos(row, columnas);
      console.log(`Movimiento mapeado: ${JSON.stringify(movimientoMapeado, null, 2)}`);
      
      // Simular validación
      const validacion = validarMovimiento(movimientoMapeado);
      
      if (validacion.valido) {
        console.log(`✅ Fila ${index + 1} procesada exitosamente`);
      } else {
        console.log(`❌ Fila ${index + 1} tiene errores: ${validacion.mensaje}`);
      }
    });
    
    console.log('\n🎉 Prueba completada exitosamente!');
    
    // Limpiar archivo de prueba
    fs.unlinkSync(filePath);
    console.log('🧹 Archivo de prueba eliminado');
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
  }
}

// Ejecutar la prueba
if (require.main === module) {
  ejecutarPrueba();
}

module.exports = {
  crearArchivoMovimientosPrueba,
  simularDeteccionTipo,
  simularMapeoMovimientos,
  validarMovimiento,
  normalizarTipoMovimiento,
  normalizarEstadoMovimiento
}; 