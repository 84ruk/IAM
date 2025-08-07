const { PrismaClient } = require('@prisma/client');
const { RelacionCreatorService } = require('../dist/importacion/services/relacion-creator.service');

async function testProveedoresEnMovimientos() {
  console.log('🧪 Iniciando prueba de proveedores en movimientos...');
  
  const prisma = new PrismaClient();
  const relacionCreator = new RelacionCreatorService(prisma);
  
  try {
    const empresaId = 1; // ID de la empresa de prueba
    
    console.log('\n📦 Probando creación de movimientos con proveedores...');
    
    // Test 1: Movimiento con proveedor existente
    console.log('\n1️⃣ Probando movimiento con proveedor existente...');
    const proveedorExistente = await relacionCreator.buscarOCrearProveedor('Proveedor ABC', empresaId);
    console.log('✅ Proveedor:', {
      id: proveedorExistente.entidad?.id,
      nombre: proveedorExistente.entidad?.nombre,
      creado: proveedorExistente.creado
    });

    // Test 2: Movimiento con proveedor nuevo
    console.log('\n2️⃣ Probando movimiento con proveedor nuevo...');
    const proveedorNuevo = await relacionCreator.buscarOCrearProveedor('Proveedor Nuevo Test', empresaId);
    console.log('✅ Proveedor nuevo:', {
      id: proveedorNuevo.entidad?.id,
      nombre: proveedorNuevo.entidad?.nombre,
      creado: proveedorNuevo.creado
    });

    // Test 3: Crear movimiento con proveedor
    console.log('\n3️⃣ Probando creación de movimiento con proveedor...');
    const producto = await relacionCreator.buscarOCrearProducto('Producto Test Proveedor', {
      empresaId,
      etiquetas: ['TEST', 'PROVEEDOR'],
      stockInicial: 0,
      precioCompra: 100,
      precioVenta: 150,
      stockMinimo: 10
    });

    if (producto.entidad && proveedorExistente.entidad) {
      const movimiento = await prisma.movimientoInventario.create({
        data: {
          productoId: producto.entidad.id,
          proveedorId: proveedorExistente.entidad.id,
          cantidad: 10,
          tipo: 'ENTRADA',
          descripcion: 'Movimiento de prueba con proveedor',
          fecha: new Date(),
          empresaId: empresaId,
          estado: 'ACTIVO',
          precioUnitario: 100.00,
          precioTotal: 1000.00,
          tipoPrecio: 'COMPRA'
        }
      });

      console.log('✅ Movimiento creado:', {
        id: movimiento.id,
        producto: producto.entidad.nombre,
        proveedor: proveedorExistente.entidad.nombre,
        cantidad: movimiento.cantidad,
        tipo: movimiento.tipo
      });

      // Verificar que el movimiento tiene la relación con proveedor
      const movimientoConProveedor = await prisma.movimientoInventario.findUnique({
        where: { id: movimiento.id },
        include: {
          producto: true,
          proveedor: true
        }
      });

      console.log('✅ Movimiento con proveedor verificado:', {
        id: movimientoConProveedor.id,
        producto: movimientoConProveedor.producto.nombre,
        proveedor: movimientoConProveedor.proveedor?.nombre || 'Sin proveedor',
        cantidad: movimientoConProveedor.cantidad
      });
    }

    // Test 4: Procesamiento en lote con proveedores
    console.log('\n4️⃣ Probando procesamiento en lote con proveedores...');
    const relacionesConProveedores = [
      { tipo: 'producto', identificador: 'Producto Lote 1', options: { empresaId } },
      { tipo: 'proveedor', identificador: 'Proveedor Lote 1', empresaId },
      { tipo: 'producto', identificador: 'Producto Lote 2', options: { empresaId } },
      { tipo: 'proveedor', identificador: 'Proveedor Lote 2', empresaId }
    ];

    const resultadosLote = await relacionCreator.procesarRelacionesEnLote(relacionesConProveedores);
    
    resultadosLote.forEach((resultado, index) => {
      console.log(`   ${index + 1}. ${resultado.tipo}: ${resultado.identificador} - ${resultado.creado ? '✅ Creado' : '🔍 Encontrado'} (ID: ${resultado.entidad?.id})`);
    });

    // Test 5: Verificar estadísticas finales
    console.log('\n5️⃣ Verificando estadísticas finales...');
    
    const totalMovimientos = await prisma.movimientoInventario.count({
      where: { empresaId }
    });
    
    const movimientosConProveedor = await prisma.movimientoInventario.count({
      where: { 
        empresaId,
        proveedorId: { not: null }
      }
    });
    
    const totalProveedores = await prisma.proveedor.count({
      where: { empresaId, estado: 'ACTIVO' }
    });
    
    console.log('📊 Estadísticas finales:');
    console.log(`   - Total movimientos: ${totalMovimientos}`);
    console.log(`   - Movimientos con proveedor: ${movimientosConProveedor}`);
    console.log(`   - Total proveedores: ${totalProveedores}`);
    console.log(`   - Porcentaje movimientos con proveedor: ${((movimientosConProveedor / totalMovimientos) * 100).toFixed(2)}%`);

    console.log('\n🎉 ¡Todas las pruebas de proveedores completadas exitosamente!');

  } catch (error) {
    console.error('❌ Error en las pruebas de proveedores:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar las pruebas
testProveedoresEnMovimientos(); 