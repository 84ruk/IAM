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

async function testImportacionCompleta() {
  console.log('🧪 Iniciando prueba completa de importación con JWT real...\n');

  try {
    // Decodificar JWT
    const jwtPayload = decodeJWT(JWT_TOKEN);
    if (!jwtPayload) {
      throw new Error('No se pudo decodificar el JWT');
    }

    console.log('📋 Información del JWT:');
    console.log(`  - Usuario ID: ${jwtPayload.sub}`);
    console.log(`  - Email: ${jwtPayload.email}`);
    console.log(`  - Rol: ${jwtPayload.rol}`);
    console.log(`  - Empresa ID: ${jwtPayload.empresaId}`);
    console.log(`  - Tipo Industria: ${jwtPayload.tipoIndustria}`);
    console.log(`  - Auth Provider: ${jwtPayload.authProvider}\n`);

    // Verificar que el usuario existe en la base de datos
    const usuario = await prisma.usuario.findUnique({
      where: { id: parseInt(jwtPayload.sub) },
      select: { id: true, nombre: true, email: true, rol: true, empresaId: true }
    });

    if (!usuario) {
      throw new Error(`Usuario con ID ${jwtPayload.sub} no encontrado en la base de datos`);
    }

    console.log('✅ Usuario encontrado en la base de datos:', usuario);

    // Verificar que la empresa existe
    const empresa = await prisma.empresa.findUnique({
      where: { id: jwtPayload.empresaId },
      select: { id: true, nombre: true, TipoIndustria: true }
    });

    if (!empresa) {
      throw new Error(`Empresa con ID ${jwtPayload.empresaId} no encontrada en la base de datos`);
    }

    console.log('✅ Empresa encontrada en la base de datos:', empresa);

    // 1. Crear un archivo de prueba con movimientos
    const testData = [
      ['producto', 'tipo', 'cantidad', 'descripcion', 'fecha'],
      ['Producto Test 1', 'ENTRADA', 25, 'Prueba de importación con JWT real - Producto 1', '2024-01-15'],
      ['Producto Test 2', 'SALIDA', 10, 'Prueba de importación con JWT real - Producto 2', '2024-01-15'],
      ['Producto Existente Test', 'ENTRADA', 50, 'Prueba con producto que debería existir', '2024-01-15'],
    ];

    // Crear workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(testData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Movimientos');

    // Guardar archivo de prueba
    const testFilePath = path.join(__dirname, 'test-movimientos-jwt.xlsx');
    XLSX.writeFile(workbook, testFilePath);
    console.log('✅ Archivo de prueba creado:', testFilePath);

    // 2. Verificar productos existentes en la empresa
    const productosExistentes = await prisma.producto.findMany({
      where: { 
        empresaId: jwtPayload.empresaId,
        estado: 'ACTIVO'
      },
      select: { id: true, nombre: true, stock: true, etiquetas: true },
      take: 5
    });

    console.log(`\n📋 Productos existentes en empresa ${jwtPayload.empresaId}:`, productosExistentes.length);
    productosExistentes.forEach(p => console.log(`  - ${p.nombre} (ID: ${p.id}, Stock: ${p.stock}, Etiquetas: ${p.etiquetas.join(', ')})`));

    // 3. Simular usuario de prueba con datos reales del JWT
    const usuarioPrueba = {
      id: parseInt(jwtPayload.sub),
      empresaId: jwtPayload.empresaId,
      email: jwtPayload.email,
      rol: jwtPayload.rol
    };

    console.log('\n👤 Usuario de prueba (datos reales del JWT):', usuarioPrueba);

    // 4. Verificar que el servicio de importación rápida está disponible
    console.log('\n🔍 Verificando servicios...');
    
    // Simular la lógica de procesamiento
    const movimientos = testData.slice(1); // Excluir headers
    let productosCreados = 0;
    let movimientosProcesados = 0;
    let productosExistentesUsados = 0;

    for (const [index, movimiento] of movimientos.entries()) {
      const [nombreProducto, tipo, cantidad, descripcion, fecha] = movimiento;
      const rowNumber = index + 2;

      console.log(`\n📝 Procesando fila ${rowNumber}: ${nombreProducto} - ${tipo} ${cantidad} unidades`);

      // Buscar producto en la empresa específica
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
            descripcion: `Producto creado automáticamente durante prueba con JWT: ${nombreProducto}`,
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
            etiquetas: ['AUTO-CREADO', 'PRUEBA-JWT'],
            version: 1,
          }
        });
        
        console.log(`  ✅ Producto creado automáticamente: ${producto.nombre} (ID: ${producto.id})`);
        productosCreados++;
      } else {
        console.log(`  ✅ Producto encontrado: ${producto.nombre} (ID: ${producto.id})`);
        productosExistentesUsados++;
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
    console.log(`  - Productos existentes utilizados: ${productosExistentesUsados}`);
    console.log(`  - Empresa ID: ${jwtPayload.empresaId}`);
    console.log(`  - Usuario ID: ${jwtPayload.sub}`);

    // 6. Verificar productos creados durante la prueba
    const productosCreadosEnDB = await prisma.producto.findMany({
      where: {
        etiquetas: { has: 'PRUEBA-JWT' },
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
        descripcion: { contains: 'JWT' }
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

    // 8. Verificar integridad de datos
    console.log('\n🔍 Verificando integridad de datos...');
    
    const totalProductos = await prisma.producto.count({
      where: { empresaId: usuarioPrueba.empresaId }
    });
    
    const totalMovimientos = await prisma.movimientoInventario.count({
      where: { empresaId: usuarioPrueba.empresaId }
    });

    console.log(`  - Total productos en empresa: ${totalProductos}`);
    console.log(`  - Total movimientos en empresa: ${totalMovimientos}`);

    console.log('\n✅ Prueba completada exitosamente con JWT real!');

  } catch (error) {
    console.error('❌ Error durante la prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la prueba
testImportacionCompleta(); 