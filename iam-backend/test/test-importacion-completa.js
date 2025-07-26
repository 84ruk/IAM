// Test completo de importación para verificar el flujo completo
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

const API_URL = 'http://localhost:3001/importacion/productos';
const ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NTM0OTA2ODAsImp0aSI6IjJkNTdiNWFhYmFhNjU0MWZkMTY0NzVhZjIxZTFhNDQ1ZTY5Y2M5MWQxYWQ4YjQ0ZDEzOGExOTM1OWU2N2I5NDYiLCJzdWIiOiIyMCIsInNlc3Npb25JZCI6Ijc1MDFiZDNmOTM0NWQ3OWYzODk3Y2QwMDlmM2E2ZTYzIiwiZW1haWwiOiJ0ZXN0QGlhbS5jb20iLCJyb2wiOiJBRE1JTiIsImVtcHJlc2FJZCI6MTIsInRpcG9JbmR1c3RyaWEiOiJFTEVDVFJPTklDQSIsInNldHVwQ29tcGxldGFkbyI6dHJ1ZSwiZXhwIjoxNzUzNTc3MDgwLCJhdWQiOiJodHRwOi8vbG9jYWxob3N0OjMwMDEiLCJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjMwMDEifQ.9dBGOyQWdrc7-ZWLSHDjo3gC6Xsxpq_CuHFNRNxOosY';

// Crear archivo de prueba
function crearArchivoPrueba() {
  const XLSX = require('xlsx');
  
  const datos = [
    ['Nombre del Producto', 'Descripción', 'Cantidad Disponible', 'Precio de Compra', 'Precio de Venta', 'Stock Mínimo', 'Categoría', 'Unidad de Medida', 'Estado del Producto'],
    ['Producto Test 1', 'Descripción del producto 1', 10, 100, 150, 2, 'SOFTWARE', 'LICENCIA', 'ACTIVO'],
    ['Producto Test 2', 'Descripción del producto 2', 5, 200, 300, 1, 'HARDWARE', 'UNIDAD', 'ACTIVO'],
    ['Producto Test 3', 'Descripción del producto 3', 15, 50, 75, 3, 'SOFTWARE', 'LICENCIA', 'ACTIVO'],
  ];
  
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(datos);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Productos');
  
  const rutaArchivo = path.join(__dirname, 'test-importacion-completa.xlsx');
  XLSX.writeFile(workbook, rutaArchivo);
  
  return rutaArchivo;
}

async function testearImportacionCompleta() {
  try {
    console.log('🧪 Iniciando test completo de importación...\n');
    
    // 1. Crear archivo de prueba
    const archivo = crearArchivoPrueba();
    console.log(`📁 Archivo creado: ${archivo}`);
    
    // 2. Iniciar importación
    console.log('\n📤 Iniciando importación...');
    const form = new FormData();
    form.append('archivo', fs.createReadStream(archivo));
    form.append('sobrescribirExistentes', 'false');
    form.append('validarSolo', 'false'); // Importar realmente
    form.append('notificarEmail', 'false');
    
    const headers = {
      ...form.getHeaders(),
      Authorization: `Bearer ${ACCESS_TOKEN}`,
    };
    
    const response = await axios.post(API_URL, form, { headers });
    
    console.log('\n✅ Respuesta inicial:');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (!response.data.success) {
      throw new Error('La importación inicial falló');
    }
    
    const trabajoId = response.data.trabajoId;
    console.log(`\n🆔 ID del trabajo: ${trabajoId}`);
    
    // 3. Monitorear el progreso
    console.log('\n📊 Monitoreando progreso...');
    let intentos = 0;
    const maxIntentos = 30; // 30 segundos máximo
    
    while (intentos < maxIntentos) {
      try {
        const estadoResponse = await axios.get(`http://localhost:3001/importacion/trabajos/${trabajoId}`, {
          headers: { Authorization: `Bearer ${ACCESS_TOKEN}` }
        });
        
        const trabajo = estadoResponse.data;
        console.log(`⏱️  Intento ${intentos + 1}: Estado = ${trabajo.estado}, Progreso = ${trabajo.progreso || 0}%`);
        
        if (trabajo.estado === 'COMPLETADO') {
          console.log('\n🎉 ¡Importación completada exitosamente!');
          console.log(`📊 Total registros: ${trabajo.totalRegistros}`);
          console.log(`✅ Registros exitosos: ${trabajo.registrosExitosos || 0}`);
          console.log(`❌ Errores: ${trabajo.errores || 0}`);
          
          if (trabajo.erroresDetallados && trabajo.erroresDetallados.length > 0) {
            console.log('\n⚠️ Errores detallados:');
            trabajo.erroresDetallados.slice(0, 3).forEach((error, index) => {
              console.log(`   ${index + 1}. Fila ${error.fila}, Columna ${error.columna}: ${error.mensaje}`);
            });
          }
          
          break;
        } else if (trabajo.estado === 'ERROR') {
          console.log('\n❌ La importación falló');
          console.log(`📋 Error: ${trabajo.error || 'Error desconocido'}`);
          break;
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar 1 segundo
        intentos++;
        
      } catch (error) {
        console.log(`⚠️ Error obteniendo estado: ${error.message}`);
        intentos++;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    if (intentos >= maxIntentos) {
      console.log('\n⏰ Tiempo de espera agotado');
    }
    
    // 4. Verificar en la base de datos
    console.log('\n🔍 Verificando en la base de datos...');
    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      
      const productosRecientes = await prisma.producto.findMany({
        where: {
          empresaId: 12,
          nombre: { startsWith: 'Producto Test' }
        },
        orderBy: { creadoEn: 'desc' },
        take: 5
      });
      
      console.log(`✅ Productos encontrados en BD: ${productosRecientes.length}`);
      productosRecientes.forEach(producto => {
        console.log(`   - ${producto.nombre} (ID: ${producto.id}, Stock: ${producto.stock})`);
      });
      
      await prisma.$disconnect();
      
    } catch (error) {
      console.log(`❌ Error verificando BD: ${error.message}`);
    }
    
    // Limpiar archivo
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
testearImportacionCompleta(); 