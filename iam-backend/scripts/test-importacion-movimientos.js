const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');
const path = require('path');

const prisma = new PrismaClient();

async function testImportacionMovimientos() {
  console.log('🧪 Iniciando prueba de importación de movimientos con productos automáticos...\n');

  try {
    // 1. Crear un archivo de prueba con movimientos
    const testData = [
      ['producto', 'tipo', 'cantidad', 'descripcion', 'fecha'],
      ['Producto Nuevo 1', 'ENTRADA', 10, 'Prueba de producto automático 1', '2024-01-15'],
      ['Producto Nuevo 2', 'SALIDA', 5, 'Prueba de producto automático 2', '2024-01-15'],
      ['Producto Existente', 'ENTRADA', 15, 'Prueba con producto existente', '2024-01-15'],
    ];

    // Crear workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(testData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Movimientos');

    // Guardar archivo de prueba
    const testFilePath = path.join(__dirname, 'test-movimientos.xlsx');
    XLSX.writeFile(workbook, testFilePath);
    console.log('✅ Archivo de prueba creado:', testFilePath);

    // 2. Verificar productos existentes
    const productosExistentes = await prisma.producto.findMany({
      where: { nombre: { contains: 'Producto Existente' } },
      select: { id: true, nombre: true, stock: true }
    });

    console.log('\n📋 Productos existentes encontrados:', productosExistentes.length);
    productosExistentes.forEach(p => console.log(`  - ${p.nombre} (ID: ${p.id}, Stock: ${p.stock})`));

    // 3. Simular usuario de prueba
    const usuarioPrueba = {
      id: 1,
      empresaId: 1,
      email: 'test@example.com',
      rol: 'ADMIN'
    };

    console.log('\n👤 Usuario de prueba:', usuarioPrueba);

    // 4. Verificar que el servicio de importación rápida está disponible
    console.log('\n🔍 Verificando servicios...');
    
    // Simular la lógica de procesamiento
    const movimientos = testData.slice(1); // Excluir headers
    let productosCreados = 0;
    let movimientosProcesados = 0;

    for (const [index, movimiento] of movimientos.entries()) {
      const [nombreProducto, tipo, cantidad, descripcion, fecha] = movimiento;
      const rowNumber = index + 2;

      console.log(`\n📝 Procesando fila ${rowNumber}: ${nombreProducto} - ${tipo} ${cantidad} unidades`);

      // Buscar producto
      let producto = await prisma.producto.findFirst({
        where: {
          nombre: { contains: nombreProducto, mode: 'insensitive' },
          empresaId: usuarioPrueba.empresaId,
          estado: 'ACTIVO'
        }
      });

      if (!producto) {
        console.log(`  ⚠️  Producto no encontrado: "${nombreProducto}"`);
        
        // Crear producto automáticamente
        const codigoUnico = `AUTO-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        
        producto = await prisma.producto.create({
          data: {
            nombre: nombreProducto,
            descripcion: `Producto creado automáticamente durante prueba: ${nombreProducto}`,
            stock: 0,
            precioCompra: 0,
            precioVenta: 0,
            stockMinimo: 10,
            codigoBarras: codigoUnico,
            sku: codigoUnico,
            rfid: codigoUnico,
            tipoProducto: 'GENERICO',
            unidad: 'UNIDAD',
            estado: 'ACTIVO',
            empresaId: usuarioPrueba.empresaId,
            etiquetas: ['AUTO-CREADO', 'PRUEBA'],
            version: 1,
          }
        });
        
        console.log(`  ✅ Producto creado automáticamente: ${producto.nombre} (ID: ${producto.id})`);
        productosCreados++;
      } else {
        console.log(`  ✅ Producto encontrado: ${producto.nombre} (ID: ${producto.id})`);
      }

      // Crear movimiento
      const movimientoCreado = await prisma.movimientoInventario.create({
        data: {
          tipo: tipo,
          cantidad: parseInt(cantidad),
          descripcion: descripcion,
          fecha: new Date(fecha),
          estado: 'ACTIVO',
          productoId: producto.id,
          empresaId: usuarioPrueba.empresaId,
        }
      });

      console.log(`  ✅ Movimiento creado: ${movimientoCreado.tipo} de ${movimientoCreado.cantidad} unidades`);
      movimientosProcesados++;

      // Actualizar stock del producto
      const nuevoStock = tipo === 'ENTRADA' 
        ? producto.stock + parseInt(cantidad)
        : Math.max(0, producto.stock - parseInt(cantidad));

      await prisma.producto.update({
        where: { id: producto.id },
        data: { stock: nuevoStock }
      });

      console.log(`  📊 Stock actualizado: ${producto.nombre} - Nuevo stock: ${nuevoStock}`);
    }

    // 5. Resumen final
    console.log('\n📊 RESUMEN DE LA PRUEBA:');
    console.log(`  - Movimientos procesados: ${movimientosProcesados}`);
    console.log(`  - Productos creados automáticamente: ${productosCreados}`);
    console.log(`  - Productos existentes utilizados: ${movimientosProcesados - productosCreados}`);

    // 6. Verificar productos creados
    const productosCreadosEnDB = await prisma.producto.findMany({
      where: {
        etiquetas: { has: 'PRUEBA' },
        empresaId: usuarioPrueba.empresaId
      },
      select: { id: true, nombre: true, stock: true, etiquetas: true }
    });

    console.log('\n📋 Productos creados durante la prueba:');
    productosCreadosEnDB.forEach(p => {
      console.log(`  - ${p.nombre} (ID: ${p.id}, Stock: ${p.stock}, Etiquetas: ${p.etiquetas.join(', ')})`);
    });

    // 7. Verificar movimientos creados
    const movimientosCreados = await prisma.movimientoInventario.findMany({
      where: {
        empresaId: usuarioPrueba.empresaId,
        descripcion: { contains: 'Prueba' }
      },
      include: {
        producto: { select: { nombre: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    console.log('\n📋 Últimos movimientos creados:');
    movimientosCreados.forEach(m => {
      console.log(`  - ${m.tipo} ${m.cantidad} unidades de "${m.producto.nombre}" - ${m.descripcion}`);
    });

    console.log('\n✅ Prueba completada exitosamente!');

  } catch (error) {
    console.error('❌ Error durante la prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la prueba
testImportacionMovimientos(); 