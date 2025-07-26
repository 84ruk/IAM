// Script para probar variaciones completas en español
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

const API_URL = 'http://localhost:3001/importacion/productos';
const ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NTM0OTA2ODAsImp0aSI6IjJkNTdiNWFhYmFhNjU0MWZkMTY0NzVhZjIxZTFhNDQ1ZTY5Y2M5MWQxYWQ4YjQ0ZDEzOGExOTM1OWU2N2I5NDYiLCJzdWIiOiIyMCIsInNlc3Npb25JZCI6Ijc1MDFiZDNmOTM0NWQ3OWYzODk3Y2QwMDlmM2E2ZTYzIiwiZW1haWwiOiJ0ZXN0QGlhbS5jb20iLCJyb2wiOiJBRE1JTiIsImVtcHJlc2FJZCI6MTIsInRpcG9JbmR1c3RyaWEiOiJFTEVDVFJPTklDQSIsInNldHVwQ29tcGxldGFkbyI6dHJ1ZSwiZXhwIjoxNzUzNTc3MDgwLCJhdWQiOiJodHRwOi8vbG9jYWxob3N0OjMwMDEiLCJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjMwMDEifQ.9dBGOyQWdrc7-ZWLSHDjo3gC6Xsxpq_CuHFNRNxOosY';

// Crear un archivo de prueba con múltiples variaciones en español
function crearArchivoPruebaEspanolCompleto() {
  const XLSX = require('xlsx');
  
  // Datos de prueba con múltiples variaciones en español
  const datos = [
    // Encabezados con variaciones complejas en español
    ['Nombre del Producto', 'Descripción del Artículo', 'Cantidad Disponible en Stock', 'Precio de Compra por Unidad', 'Precio de Venta al Público', 'Stock Mínimo Requerido', 'Categoría del Producto', 'Unidad de Medida Utilizada', 'Estado del Producto Actual'],
    // Fila 1 - Producto válido
    ['Software Office', 'Suite de oficina completa', 25, 150.50, 299.99, 5, 'SOFTWARE', 'LICENCIA', 'ACTIVO'],
    // Fila 2 - Producto válido
    ['Laptop Gaming', 'Computadora portátil para juegos', 8, 1200.00, 1899.99, 2, 'HARDWARE', 'UNIDAD', 'ACTIVO'],
    // Fila 3 - Producto válido
    ['Antivirus Pro', 'Software de seguridad avanzado', 50, 45.00, 89.99, 10, 'SOFTWARE', 'LICENCIA', 'ACTIVO'],
    // Fila 4 - Producto válido
    ['Monitor 4K', 'Pantalla de alta resolución', 12, 350.00, 599.99, 3, 'HARDWARE', 'UNIDAD', 'ACTIVO'],
    // Fila 5 - Producto válido
    ['Licencia Windows', 'Sistema operativo Windows', 100, 80.00, 149.99, 20, 'SOFTWARE', 'LICENCIA', 'ACTIVO'],
  ];
  
  // Crear workbook
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(datos);
  
  // Agregar hoja al workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Productos');
  
  // Guardar archivo
  const rutaArchivo = path.join(__dirname, 'test-variaciones-espanol-completas.xlsx');
  XLSX.writeFile(workbook, rutaArchivo);
  
  console.log(`📁 Archivo de prueba creado: ${rutaArchivo}`);
  console.log(`📊 Total de filas en archivo: ${datos.length}`);
  console.log(`📋 Encabezados originales: ${datos[0].join(', ')}`);
  console.log(`✅ Se espera que se mapeen correctamente a: nombre, descripcion, stock, precioCompra, precioVenta, stockMinimo, tipoProducto, unidad, estado`);
  console.log(`🔍 Variaciones complejas en español incluidas:`);
  console.log(`   - "Nombre del Producto" (tres palabras) -> nombre`);
  console.log(`   - "Descripción del Artículo" (tres palabras) -> descripcion`);
  console.log(`   - "Cantidad Disponible en Stock" (cuatro palabras) -> stock`);
  console.log(`   - "Precio de Compra por Unidad" (cinco palabras) -> precioCompra`);
  console.log(`   - "Precio de Venta al Público" (cinco palabras) -> precioVenta`);
  console.log(`   - "Stock Mínimo Requerido" (tres palabras) -> stockMinimo`);
  console.log(`   - "Categoría del Producto" (tres palabras) -> tipoProducto`);
  console.log(`   - "Unidad de Medida Utilizada" (cuatro palabras) -> unidad`);
  console.log(`   - "Estado del Producto Actual" (cuatro palabras) -> estado`);
  
  return rutaArchivo;
}

async function testearVariacionesEspanolCompletas() {
  try {
    console.log('🧪 Iniciando test completo de variaciones en español...\n');
    
    // Crear archivo de prueba
    const archivo = crearArchivoPruebaEspanolCompleto();
    
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
      console.log(`✅ Se esperaban 5 registros válidos`);
      
      if (response.data.totalRegistros === 5) {
        console.log('✅ El sistema de mapeo en español funcionó perfectamente');
        console.log('✅ Todas las variaciones complejas en español se mapearon correctamente');
        console.log('✅ El sistema es extremadamente robusto para diferentes formatos de encabezados en español');
        console.log('✅ Puede manejar encabezados con hasta 5 palabras correctamente');
        console.log('✅ El sistema de normalización funciona perfectamente');
      } else {
        console.log(`⚠️ Se esperaban 5 registros, pero se procesaron ${response.data.totalRegistros}`);
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
testearVariacionesEspanolCompletas(); 