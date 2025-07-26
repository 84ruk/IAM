// Test directo del procesador sin BullMQ
const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');
const path = require('path');

async function testProcesadorDirecto() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🧪 Test directo del procesador...\n');
    
    // 1. Crear archivo de prueba
    const datos = [
      ['Nombre del Producto', 'Descripción', 'Cantidad Disponible', 'Precio de Compra', 'Precio de Venta', 'Stock Mínimo', 'Categoría', 'Unidad de Medida', 'Estado del Producto'],
      ['Producto Directo 1', 'Descripción directa 1', 10, 100, 150, 2, 'SOFTWARE', 'LICENCIA', 'ACTIVO'],
      ['Producto Directo 2', 'Descripción directa 2', 5, 200, 300, 1, 'HARDWARE', 'UNIDAD', 'ACTIVO'],
    ];
    
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(datos);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Productos');
    
    const archivoPath = path.join(__dirname, 'test-directo.xlsx');
    XLSX.writeFile(workbook, archivoPath);
    
    console.log(`📁 Archivo creado: ${archivoPath}`);
    
    // 2. Leer archivo
    const workbookRead = XLSX.readFile(archivoPath);
    const sheetName = workbookRead.SheetNames[0];
    const worksheetRead = workbookRead.Sheets[sheetName];
    const datosRaw = XLSX.utils.sheet_to_json(worksheetRead, { header: 1 });
    
    const encabezados = datosRaw[0];
    const registros = datosRaw.slice(1);
    
    console.log(`📋 Encabezados: ${encabezados.join(', ')}`);
    console.log(`📊 Registros: ${registros.length}`);
    
    // 3. Convertir a objetos
    const productos = registros.map((fila, index) => {
      const objeto = {};
      encabezados.forEach((encabezado, colIndex) => {
        objeto[encabezado] = fila[colIndex];
      });
      return { ...objeto, _filaOriginal: index + 2 };
    });
    
    console.log('\n📦 Productos procesados:');
    productos.forEach((producto, index) => {
      console.log(`   ${index + 1}. ${producto['Nombre del Producto']} - Stock: ${producto['Cantidad Disponible']}`);
    });
    
    // 4. Insertar en base de datos
    console.log('\n💾 Insertando en base de datos...');
    
    for (const producto of productos) {
      try {
        const productoInsertado = await prisma.producto.create({
          data: {
            nombre: producto['Nombre del Producto'],
            descripcion: producto['Descripción'],
            stock: parseInt(producto['Cantidad Disponible']) || 0,
            precioCompra: parseFloat(producto['Precio de Compra']) || 0,
            precioVenta: parseFloat(producto['Precio de Venta']) || 0,
            stockMinimo: parseInt(producto['Stock Mínimo']) || 0,
            tipoProducto: producto['Categoría'],
            unidad: producto['Unidad de Medida'],
            estado: producto['Estado del Producto'],
            empresaId: 12, // Empresa de prueba
            codigoBarras: `DIR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            sku: `DIR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          }
        });
        
        console.log(`✅ Producto insertado: ${productoInsertado.nombre} (ID: ${productoInsertado.id})`);
        
      } catch (error) {
        console.log(`❌ Error insertando ${producto['Nombre del Producto']}: ${error.message}`);
      }
    }
    
    // 5. Verificar inserción
    console.log('\n🔍 Verificando inserción...');
    const productosInsertados = await prisma.producto.findMany({
      where: {
        empresaId: 12,
        nombre: { startsWith: 'Producto Directo' }
      },
      orderBy: { creadoEn: 'desc' }
    });
    
    console.log(`✅ Productos encontrados: ${productosInsertados.length}`);
    productosInsertados.forEach(producto => {
      console.log(`   - ${producto.nombre} (ID: ${producto.id}, Stock: ${producto.stock})`);
    });
    
    // 6. Limpiar
    console.log('\n🧹 Limpiando productos de prueba...');
    for (const producto of productosInsertados) {
      await prisma.producto.delete({
        where: { id: producto.id }
      });
    }
    console.log('✅ Productos de prueba eliminados');
    
    // Eliminar archivo
    const fs = require('fs');
    fs.unlinkSync(archivoPath);
    console.log('✅ Archivo temporal eliminado');
    
    console.log('\n🎉 Test directo completado exitosamente');
    
  } catch (error) {
    console.error('\n❌ Error en test directo:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar test
testProcesadorDirecto(); 