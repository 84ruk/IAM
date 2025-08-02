const { PrismaClient } = require('@prisma/client');
const { RelacionCreatorService } = require('../dist/importacion/services/relacion-creator.service');
const { PrismaService } = require('../dist/prisma/prisma.service');

async function testRelacionesImportacion() {
  console.log('🧪 Iniciando prueba de relaciones por nombre...');
  
  const prisma = new PrismaClient();
  const relacionCreator = new RelacionCreatorService(prisma);
  
  try {
    // Configurar opciones de prueba
    const opciones = {
      empresaId: 14, // ID de la empresa del usuario
      etiquetas: ['TEST', 'RELACIONES-POR-NOMBRE'],
      stockInicial: 0,
      precioCompra: 0,
      precioVenta: 0,
      stockMinimo: 10,
      crearProveedorSiNoExiste: true,
      generarSKUAutomatico: true,
      prefijoSKU: 'TEST'
    };

    console.log('\n📦 Probando creación de productos por nombre...');
    
    // Test 1: Producto nuevo
    console.log('\n1️⃣ Probando producto nuevo: "Laptop HP EliteBook"');
    const resultado1 = await relacionCreator.buscarOCrearProducto('Laptop HP EliteBook', opciones);
    console.log('✅ Resultado:', {
      creado: resultado1.creado,
      id: resultado1.entidad?.id,
      nombre: resultado1.entidad?.nombre,
      error: resultado1.error
    });

    // Test 2: Producto existente (debería encontrarlo)
    console.log('\n2️⃣ Probando producto existente: "Laptop HP EliteBook"');
    const resultado2 = await relacionCreator.buscarOCrearProducto('Laptop HP EliteBook', opciones);
    console.log('✅ Resultado:', {
      creado: resultado2.creado,
      id: resultado2.entidad?.id,
      nombre: resultado2.entidad?.nombre,
      error: resultado2.error
    });

    // Test 3: Producto por ID
    console.log('\n3️⃣ Probando producto por ID:', resultado1.entidad?.id);
    const resultado3 = await relacionCreator.buscarOCrearProducto(resultado1.entidad?.id, opciones);
    console.log('✅ Resultado:', {
      creado: resultado3.creado,
      id: resultado3.entidad?.id,
      nombre: resultado3.entidad?.nombre,
      error: resultado3.error
    });

    console.log('\n🏢 Probando creación de proveedores por nombre...');
    
    // Test 4: Proveedor nuevo
    console.log('\n4️⃣ Probando proveedor nuevo: "Proveedor ABC"');
    const resultado4 = await relacionCreator.buscarOCrearProveedor('Proveedor ABC', opciones.empresaId);
    console.log('✅ Resultado:', {
      creado: resultado4.creado,
      id: resultado4.entidad?.id,
      nombre: resultado4.entidad?.nombre,
      error: resultado4.error
    });

    // Test 5: Proveedor existente
    console.log('\n5️⃣ Probando proveedor existente: "Proveedor ABC"');
    const resultado5 = await relacionCreator.buscarOCrearProveedor('Proveedor ABC', opciones.empresaId);
    console.log('✅ Resultado:', {
      creado: resultado5.creado,
      id: resultado5.entidad?.id,
      nombre: resultado5.entidad?.nombre,
      error: resultado5.error
    });

    console.log('\n📊 Probando procesamiento en lote...');
    
    // Test 6: Procesamiento en lote
    const relaciones = [
      { tipo: 'producto', identificador: 'Mouse Gaming RGB', options: opciones },
      { tipo: 'producto', identificador: 'Teclado Mecánico', options: opciones },
      { tipo: 'proveedor', identificador: 'Nuevo Proveedor XYZ', empresaId: opciones.empresaId },
      { tipo: 'proveedor', identificador: 'Proveedor Monitor', empresaId: opciones.empresaId }
    ];

    console.log('\n6️⃣ Probando procesamiento en lote...');
    const resultadosLote = await relacionCreator.procesarRelacionesEnLote(relaciones);
    
    resultadosLote.forEach((resultado, index) => {
      console.log(`   ${index + 1}. ${resultado.tipo}: ${resultado.identificador} - ${resultado.creado ? '✅ Creado' : '🔍 Encontrado'} (ID: ${resultado.entidad?.id})`);
    });

    console.log('\n🎯 Probando validación de límites...');
    
    // Test 7: Validación de límites
    const validacionProducto = await relacionCreator.validarCreacionAutomatica('producto', 'Test Product', opciones.empresaId);
    const validacionProveedor = await relacionCreator.validarCreacionAutomatica('proveedor', 'Test Provider', opciones.empresaId);
    
    console.log('✅ Validación producto:', validacionProducto);
    console.log('✅ Validación proveedor:', validacionProveedor);

    console.log('\n🎉 ¡Todas las pruebas completadas exitosamente!');
    
    // Mostrar estadísticas finales
    const totalProductos = await prisma.producto.count({
      where: { empresaId: opciones.empresaId, estado: 'ACTIVO' }
    });
    
    const totalProveedores = await prisma.proveedor.count({
      where: { empresaId: opciones.empresaId, estado: 'ACTIVO' }
    });
    
    console.log('\n📈 Estadísticas finales:');
    console.log(`   - Productos en empresa: ${totalProductos}`);
    console.log(`   - Proveedores en empresa: ${totalProveedores}`);

  } catch (error) {
    console.error('❌ Error en las pruebas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar las pruebas
testRelacionesImportacion(); 