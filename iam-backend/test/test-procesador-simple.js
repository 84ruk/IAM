// Test simple del procesador sin BullMQ
const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');
const path = require('path');

async function testProcesadorSimple() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🧪 Test simple del procesador...\n');
    
    // 1. Crear archivo de prueba
    const datos = [
      ['Nombre del Producto', 'Descripción', 'Cantidad Disponible', 'Precio de Compra', 'Precio de Venta', 'Stock Mínimo', 'Categoría', 'Unidad de Medida', 'Estado del Producto'],
      ['Producto Simple 1', 'Descripción simple 1', 10, 100, 150, 2, 'SOFTWARE', 'LICENCIA', 'ACTIVO'],
    ];
    
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(datos);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Productos');
    
    const archivoPath = path.join(__dirname, 'test-simple.xlsx');
    XLSX.writeFile(workbook, archivoPath);
    
    console.log(`📁 Archivo creado: ${archivoPath}`);
    
    // 2. Simular el procesamiento del archivo
    const workbookRead = XLSX.readFile(archivoPath);
    const sheetName = workbookRead.SheetNames[0];
    const worksheetRead = workbookRead.Sheets[sheetName];
    const datosRaw = XLSX.utils.sheet_to_json(worksheetRead, { header: 1 });
    
    const encabezados = datosRaw[0];
    const registros = datosRaw.slice(1);
    
    console.log(`📋 Encabezados: ${encabezados.join(', ')}`);
    console.log(`📊 Registros: ${registros.length}`);
    
    // 3. Convertir a objetos usando el mapeo inteligente
    const productos = registros.map((fila, index) => {
      const objeto = {};
      encabezados.forEach((encabezado, colIndex) => {
        // Normalizar encabezado
        let normalizado = encabezado
          .trim()
          .replace(/\s+/g, ' ')
          .replace(/[^\w\s]/g, ' ')
          .trim();
        normalizado = normalizado.toLowerCase();
        normalizado = normalizado.replace(/\s+/g, '_');
        normalizado = normalizado.replace(/_+/g, '_');
        normalizado = normalizado.replace(/^_|_$/g, '');
        
        // Mapear a nombres estándar
        const mapeo = {
          'nombre_del_producto': 'nombre',
          'descripcion': 'descripcion',
          'cantidad_disponible': 'stock',
          'precio_de_compra': 'precioCompra',
          'precio_de_venta': 'precioVenta',
          'stock_minimo': 'stockMinimo',
          'categoria': 'tipoProducto',
          'unidad_de_medida': 'unidad',
          'estado_del_producto': 'estado',
        };
        
        const campoEstandar = mapeo[normalizado] || normalizado;
        objeto[campoEstandar] = fila[colIndex];
      });
      return { ...objeto, _filaOriginal: index + 2 };
    });
    
    console.log('\n📦 Productos procesados:');
    productos.forEach((producto, index) => {
      console.log(`   ${index + 1}. ${producto.nombre} - Stock: ${producto.stock}`);
    });
    
    // 4. Insertar en base de datos
    console.log('\n💾 Insertando en base de datos...');
    
    for (const producto of productos) {
      try {
        const productoInsertado = await prisma.producto.create({
          data: {
            nombre: producto.nombre,
            descripcion: producto.descripcion,
            stock: parseInt(producto.stock) || 0,
            precioCompra: parseFloat(producto.precioCompra) || 0,
            precioVenta: parseFloat(producto.precioVenta) || 0,
            stockMinimo: parseInt(producto.stockMinimo) || 0,
            tipoProducto: producto.tipoProducto,
            unidad: producto.unidad,
            estado: producto.estado,
            empresaId: 12, // Empresa de prueba
            codigoBarras: `SIMPLE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            sku: `SIMPLE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          }
        });
        
        console.log(`✅ Producto insertado: ${productoInsertado.nombre} (ID: ${productoInsertado.id})`);
        
      } catch (error) {
        console.log(`❌ Error insertando ${producto.nombre}: ${error.message}`);
      }
    }
    
    // 5. Verificar inserción
    console.log('\n🔍 Verificando inserción...');
    const productosInsertados = await prisma.producto.findMany({
      where: {
        empresaId: 12,
        nombre: { startsWith: 'Producto Simple' }
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
    
    console.log('\n🎉 Test simple completado exitosamente');
    
  } catch (error) {
    console.error('\n❌ Error en test simple:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar test
testProcesadorSimple(); 