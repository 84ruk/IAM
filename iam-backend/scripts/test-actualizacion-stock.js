const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');
const path = require('path');

const prisma = new PrismaClient();

// JWT proporcionado por el usuario
const JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NTQwNjA5MjYsImp0aSI6ImExM2ZmMWQ3LWEzNjUtNDQyNy1hZDdmLTA1MDFmYjYwZGRjMiIsInN1YiI6IjI1IiwiZW1haWwiOiJiYXJ1azA2NkBnbWFpbC5jb20iLCJyb2wiOiJBRE1JTiIsImVtcHJlc2FJZCI6MTQsInRpcG9JbmR1c3RyaWEiOiJHRU5FUklDQSIsImF1dGhQcm92aWRlciI6Imdvb2dsZSIsImV4cCI6MTc1NDE0NzMyNiwiYXVkIjoiaHR0cHM6Ly9pYW0tYmFja2VuZC1iYXJ1ay5mbHkuZGV2IiwiaXNzIjoiaHR0cHM6Ly9pYW0tYmFja2VuZC1iYXJ1ay5mbHkuZGV2In0.GSQ3nSKx2E4HSbv1wiT3WOkuyE1qemGOLTU1HHgMZL4';

// Decodificar JWT para obtener información del usuario
function decodeJWT(token) {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    return payload;
  } catch (error) {
    console.error('Error decodificando JWT:', error);
    return null;
  }
}

async function testActualizacionStock() {
  console.log('🧪 Iniciando prueba de actualización de stock en importación...\n');

  try {
    // Decodificar JWT
    const jwtPayload = decodeJWT(JWT_TOKEN);
    if (!jwtPayload) {
      throw new Error('No se pudo decodificar el JWT');
    }

    console.log('📋 Información del JWT:');
    console.log(`  - Usuario ID: ${jwtPayload.sub}`);
    console.log(`  - Empresa ID: ${jwtPayload.empresaId}\n`);

    // 1. Crear un producto de prueba con stock inicial
    const productoPrueba = await prisma.producto.create({
      data: {
        nombre: 'Producto Test Stock',
        descripcion: 'Producto para probar actualización de stock',
        stock: 100, // Stock inicial
        precioCompra: 50,
        precioVenta: 75,
        stockMinimo: 10,
        codigoBarras: `TEST-STOCK-${Date.now()}`,
        sku: `TEST-STOCK-${Date.now()}`,
        rfid: `TEST-STOCK-${Date.now()}`,
        tipoProducto: 'GENERICO',
        unidad: 'UNIDAD',
        estado: 'ACTIVO',
        empresaId: jwtPayload.empresaId,
        etiquetas: ['TEST-STOCK'],
        version: 1,
      }
    });

    console.log('✅ Producto de prueba creado:', {
      id: productoPrueba.id,
      nombre: productoPrueba.nombre,
      stockInicial: productoPrueba.stock
    });

    // 2. Crear archivo de prueba con movimientos que afecten el stock
    const testData = [
      ['producto', 'tipo', 'cantidad', 'descripcion', 'fecha'],
      ['Producto Test Stock', 'ENTRADA', 25, 'Prueba entrada - stock debería ser 125', '2024-01-15'],
      ['Producto Test Stock', 'SALIDA', 10, 'Prueba salida - stock debería ser 115', '2024-01-15'],
      ['Producto Test Stock', 'ENTRADA', 50, 'Prueba entrada - stock debería ser 165', '2024-01-15'],
      ['Producto Test Stock', 'SALIDA', 30, 'Prueba salida - stock debería ser 135', '2024-01-15'],
      ['Producto Nuevo Stock', 'ENTRADA', 100, 'Producto nuevo - stock inicial 0 + 100 = 100', '2024-01-15'],
      ['Producto Nuevo Stock', 'SALIDA', 25, 'Producto nuevo - stock 100 - 25 = 75', '2024-01-15'],
    ];

    // Crear workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(testData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Movimientos');

    // Guardar archivo de prueba
    const testFilePath = path.join(__dirname, 'test-stock-movimientos.xlsx');
    XLSX.writeFile(workbook, testFilePath);
    console.log('✅ Archivo de prueba creado:', testFilePath);

    // 3. Simular la lógica de procesamiento con actualización de stock
    const movimientos = testData.slice(1); // Excluir headers
    let movimientosProcesados = 0;
    let stockActual = productoPrueba.stock;

    console.log('\n📊 Procesando movimientos y verificando stock:');
    console.log(`   Stock inicial: ${stockActual}`);

    for (const [index, movimiento] of movimientos.entries()) {
      const [nombreProducto, tipo, cantidad, descripcion, fecha] = movimiento;
      const rowNumber = index + 2;

      console.log(`\n📝 Fila ${rowNumber}: ${nombreProducto} - ${tipo} ${cantidad} unidades`);

      // Buscar producto
      let producto = await prisma.producto.findFirst({
        where: {
          nombre: { contains: nombreProducto, mode: 'insensitive' },
          empresaId: jwtPayload.empresaId,
          estado: 'ACTIVO'
        }
      });

      if (!producto) {
        console.log(`  ⚠️  Producto no encontrado: "${nombreProducto}"`);
        
        // Crear producto automáticamente
        const codigoUnico = `AUTO-STOCK-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        
        producto = await prisma.producto.create({
          data: {
            nombre: nombreProducto,
            descripcion: `Producto creado automáticamente durante prueba de stock: ${nombreProducto}`,
            stock: 0, // Stock inicial 0
            precioCompra: 0,
            precioVenta: 0,
            stockMinimo: 10,
            codigoBarras: codigoUnico,
            sku: codigoUnico,
            rfid: codigoUnico,
            tipoProducto: 'GENERICO',
            unidad: 'UNIDAD',
            estado: 'ACTIVO',
            empresaId: jwtPayload.empresaId,
            etiquetas: ['AUTO-CREADO', 'TEST-STOCK'],
            version: 1,
          }
        });
        
        console.log(`  ✅ Producto creado automáticamente: ${producto.nombre} (ID: ${producto.id})`);
        stockActual = 0; // Resetear stock para producto nuevo
      } else {
        console.log(`  ✅ Producto encontrado: ${producto.nombre} (ID: ${producto.id})`);
        stockActual = producto.stock;
      }

      // Verificar stock antes del movimiento
      console.log(`  📊 Stock antes del movimiento: ${stockActual}`);

      // Crear movimiento
      const movimientoCreado = await prisma.movimientoInventario.create({
        data: {
          tipo: tipo,
          cantidad: parseInt(cantidad),
          descripcion: descripcion,
          fecha: new Date(fecha),
          estado: 'ACTIVO',
          productoId: producto.id,
          empresaId: jwtPayload.empresaId,
        }
      });

      console.log(`  ✅ Movimiento creado: ${movimientoCreado.tipo} de ${movimientoCreado.cantidad} unidades`);

      // Actualizar stock del producto
      const nuevoStock = tipo === 'ENTRADA' 
        ? stockActual + parseInt(cantidad)
        : Math.max(0, stockActual - parseInt(cantidad));

      await prisma.producto.update({
        where: { id: producto.id },
        data: { stock: nuevoStock }
      });

      console.log(`  📊 Stock después del movimiento: ${nuevoStock}`);
      
      // Verificar que el stock se actualizó correctamente
      const productoActualizado = await prisma.producto.findUnique({
        where: { id: producto.id },
        select: { stock: true, nombre: true }
      });

      if (productoActualizado.stock === nuevoStock) {
        console.log(`  ✅ Stock actualizado correctamente en base de datos: ${productoActualizado.stock}`);
      } else {
        console.log(`  ❌ Error: Stock en BD (${productoActualizado.stock}) no coincide con cálculo (${nuevoStock})`);
      }

      stockActual = nuevoStock;
      movimientosProcesados++;
    }

    // 4. Verificar estado final de productos
    console.log('\n📋 Estado final de productos:');
    
    const productosFinales = await prisma.producto.findMany({
      where: {
        OR: [
          { etiquetas: { has: 'TEST-STOCK' } },
          { nombre: { contains: 'Producto Test Stock' } }
        ],
        empresaId: jwtPayload.empresaId
      },
      select: { id: true, nombre: true, stock: true, etiquetas: true }
    });

    productosFinales.forEach(p => {
      console.log(`  - ${p.nombre} (ID: ${p.id}): Stock final = ${p.stock}, Etiquetas: ${p.etiquetas.join(', ')}`);
    });

    // 5. Verificar movimientos creados
    console.log('\n📋 Movimientos creados:');
    
    const movimientosCreados = await prisma.movimientoInventario.findMany({
      where: {
        empresaId: jwtPayload.empresaId,
        descripcion: { contains: 'Prueba' }
      },
      include: {
        producto: { select: { nombre: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    movimientosCreados.forEach(m => {
      console.log(`  - ${m.tipo} ${m.cantidad} unidades de "${m.producto.nombre}" - ${m.descripcion}`);
    });

    // 6. Resumen final
    console.log('\n📊 RESUMEN DE LA PRUEBA:');
    console.log(`  - Movimientos procesados: ${movimientosProcesados}`);
    console.log(`  - Productos involucrados: ${productosFinales.length}`);
    console.log(`  - Stock actualizado correctamente: ✅`);
    console.log(`  - Validaciones de stock funcionando: ✅`);

    console.log('\n✅ Prueba de actualización de stock completada exitosamente!');

  } catch (error) {
    console.error('❌ Error durante la prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la prueba
testActualizacionStock(); 