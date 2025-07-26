// Script para probar el filtrado de filas vacías
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

const API_URL = 'http://localhost:3001/importacion/productos';
// Token JWT extraído de la cookie (actualizado)
const ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NTM0ODc4NDIsImp0aSI6IjQ4YzM3ODI0MjZhMDY1YTVmNjJmNWZkYjhhYzc1NDIzN2NiNjQyYWI5NDgyZjk2NmZhMmIzOGFhOTY4NzFjODEiLCJzdWIiOiIyMCIsInNlc3Npb25JZCI6ImI5NjAzOWI0M2Q2YWJiY2Y2YTEyMTBkMTM3ZjNiYTRjIiwiZW1haWwiOiJ0ZXN0QGlhbS5jb20iLCJyb2wiOiJBRE1JTiIsImVtcHJlc2FJZCI6MTIsInRpcG9JbmR1c3RyaWEiOiJFTEVDVFJPTklDQSIsInNldHVwQ29tcGxldGFkbyI6dHJ1ZSwiZXhwIjoxNzUzNTc0MjQyLCJhdWQiOiJodHRwOi8vbG9jYWxob3N0OjMwMDEiLCJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjMwMDEifQ.Q3e5IFTaYQSXALB1403km_MJ3swmuUmW7vpCZdnDnZM';

// Crear un archivo de prueba con filas vacías
function crearArchivoPrueba() {
  const XLSX = require('xlsx');
  
  // Datos de prueba con filas vacías
  const datos = [
    // Encabezados
    ['nombre', 'descripcion', 'stock', 'precioCompra', 'precioVenta', 'stockMinimo', 'tipoProducto', 'unidad', 'estado'],
    // Fila 1 - Producto válido
    ['Producto 1', 'Descripción 1', 10, 100, 150, 2, 'SOFTWARE', 'LICENCIA', 'ACTIVO'],
    // Fila 2 - Fila vacía (debe ser filtrada)
    ['', '', '', '', '', '', '', '', ''],
    // Fila 3 - Producto válido
    ['Producto 2', 'Descripción 2', 5, 200, 300, 1, 'HARDWARE', 'UNIDAD', 'ACTIVO'],
    // Fila 4 - Fila con solo espacios (debe ser filtrada)
    ['   ', '   ', '   ', '   ', '   ', '   ', '   ', '   ', '   '],
    // Fila 5 - Producto válido
    ['Producto 3', 'Descripción 3', 15, 50, 75, 3, 'SOFTWARE', 'LICENCIA', 'ACTIVO'],
    // Fila 6 - Fila vacía (debe ser filtrada)
    ['', '', '', '', '', '', '', '', ''],
  ];
  
  // Crear workbook
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(datos);
  
  // Agregar hoja al workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Productos');
  
  // Guardar archivo
  const rutaArchivo = path.join(__dirname, 'test-filas-vacias.xlsx');
  XLSX.writeFile(workbook, rutaArchivo);
  
  console.log(`📁 Archivo de prueba creado: ${rutaArchivo}`);
  console.log(`📊 Total de filas en archivo: ${datos.length}`);
  console.log(`✅ Filas con datos válidos: 3`);
  console.log(`❌ Filas vacías a filtrar: 3`);
  
  return rutaArchivo;
}

async function testearFiltradoFilasVacias() {
  try {
    console.log('🧪 Iniciando test de filtrado de filas vacías...\n');
    
    // Crear archivo de prueba
    const archivo = crearArchivoPrueba();
    
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
        console.log('✅ Las filas vacías se filtraron correctamente');
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
testearFiltradoFilasVacias(); 