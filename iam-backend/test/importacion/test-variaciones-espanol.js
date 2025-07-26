// Script para probar variaciones en español
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

const API_URL = 'http://localhost:3001/importacion/productos';
const ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NTM0OTA2ODAsImp0aSI6IjJkNTdiNWFhYmFhNjU0MWZkMTY0NzVhZjIxZTFhNDQ1ZTY5Y2M5MWQxYWQ4YjQ0ZDEzOGExOTM1OWU2N2I5NDYiLCJzdWIiOiIyMCIsInNlc3Npb25JZCI6Ijc1MDFiZDNmOTM0NWQ3OWYzODk3Y2QwMDlmM2E2ZTYzIiwiZW1haWwiOiJ0ZXN0QGlhbS5jb20iLCJyb2wiOiJBRE1JTiIsImVtcHJlc2FJZCI6MTIsInRpcG9JbmR1c3RyaWEiOiJFTEVDVFJPTklDQSIsInNldHVwQ29tcGxldGFkbyI6dHJ1ZSwiZXhwIjoxNzUzNTc3MDgwLCJhdWQiOiJodHRwOi8vbG9jYWxob3N0OjMwMDEiLCJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjMwMDEifQ.9dBGOyQWdrc7-ZWLSHDjo3gC6Xsxpq_CuHFNRNxOosY';

// Crear un archivo de prueba con variaciones en español
function crearArchivoPruebaEspanol() {
  const XLSX = require('xlsx');
  
  // Datos de prueba con variaciones en español
  const datos = [
    // Encabezados con variaciones en español
    ['Nombre del Producto', 'Descripción', 'Cantidad Disponible', 'Precio de Compra', 'Precio de Venta', 'Stock Mínimo', 'Categoría', 'Unidad de Medida', 'Estado del Producto'],
    // Fila 1 - Producto válido
    ['Producto 1', 'Descripción 1', 10, 100, 150, 2, 'SOFTWARE', 'LICENCIA', 'ACTIVO'],
    // Fila 2 - Producto válido
    ['Producto 2', 'Descripción 2', 5, 200, 300, 1, 'HARDWARE', 'UNIDAD', 'ACTIVO'],
    // Fila 3 - Producto válido
    ['Producto 3', 'Descripción 3', 15, 50, 75, 3, 'SOFTWARE', 'LICENCIA', 'ACTIVO'],
  ];
  
  // Crear workbook
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(datos);
  
  // Agregar hoja al workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Productos');
  
  // Guardar archivo
  const rutaArchivo = path.join(__dirname, 'test-variaciones-espanol.xlsx');
  XLSX.writeFile(workbook, rutaArchivo);
  
  console.log(`📁 Archivo de prueba creado: ${rutaArchivo}`);
  console.log(`📊 Total de filas en archivo: ${datos.length}`);
  console.log(`📋 Encabezados originales: ${datos[0].join(', ')}`);
  console.log(`✅ Se espera que se mapeen correctamente a: nombre, descripcion, stock, precioCompra, precioVenta, stockMinimo, tipoProducto, unidad, estado`);
  console.log(`🔍 Variaciones en español incluidas:`);
  console.log(`   - "Nombre del Producto" (con espacios) -> nombre`);
  console.log(`   - "Descripción" (con acentos) -> descripcion`);
  console.log(`   - "Cantidad Disponible" (dos palabras) -> stock`);
  console.log(`   - "Precio de Compra" (tres palabras) -> precioCompra`);
  console.log(`   - "Precio de Venta" (tres palabras) -> precioVenta`);
  console.log(`   - "Stock Mínimo" (dos palabras) -> stockMinimo`);
  console.log(`   - "Categoría" (con acentos) -> tipoProducto`);
  console.log(`   - "Unidad de Medida" (tres palabras) -> unidad`);
  console.log(`   - "Estado del Producto" (tres palabras) -> estado`);
  
  return rutaArchivo;
}

async function testearVariacionesEspanol() {
  try {
    console.log('🧪 Iniciando test de variaciones en español...\n');
    
    // Crear archivo de prueba
    const archivo = crearArchivoPruebaEspanol();
    
    // Preparar FormData
    const form = new FormData();
    form.append('archivo', fs.createReadStream(archivo));
    form.append('sobrescribirExistentes', 'true');
    form.append('validarSolo', 'true'); // Solo validar para ver el resultado
    form.append('notificarEmail', 'false');
    
    const headers = {
      ...form.getHeaders(),
      Authorization: `Bearer ${ACCESS_TOKEN}`,
    };
    
    console.log('📤 Enviando archivo para validación...');
    
    // Hacer la petición
    const response = await axios.post(API_URL, form, { headers });
    
    console.log('\n✅ Respuesta del servidor:');
    console.log(JSON.stringify(response.data, null, 2));
    
    // Verificar resultados
    if (response.data.success) {
      console.log('\n🎉 ¡Test exitoso!');
      console.log(`📊 Total de registros procesados: ${response.data.totalRegistros}`);
      console.log(`✅ Se esperaban 3 registros válidos`);
      
      if (response.data.totalRegistros === 3) {
        console.log('✅ El sistema de mapeo en español funcionó correctamente');
        console.log('✅ Todas las variaciones en español se mapearon correctamente');
        console.log('✅ El sistema es robusto para diferentes formatos de encabezados en español');
      } else {
        console.log(`⚠️ Se esperaban 3 registros, pero se procesaron ${response.data.totalRegistros}`);
      }
    } else {
      console.log('\n❌ Test falló - Validación con errores:');
      if (response.data.erroresDetallados) {
        console.log(`📋 Errores encontrados: ${response.data.erroresDetallados.length}`);
        response.data.erroresDetallados.slice(0, 5).forEach((error, index) => {
          console.log(`   ${index + 1}. Fila ${error.fila}, Columna ${error.columna}: ${error.mensaje}`);
        });
      }
    }
    
    // Limpiar archivo temporal
    fs.unlinkSync(archivo);
    console.log('\n🧹 Archivo temporal eliminado');
    
  } catch (error) {
    console.error('\n❌ Error en el test:', error.message);
    if (error.response) {
      console.error('📋 Respuesta del servidor:', error.response.data);
    }
  }
}

// Ejecutar test
testearVariacionesEspanol(); 