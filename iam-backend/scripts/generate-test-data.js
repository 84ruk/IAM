const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function generateTestData() {
  console.log('🚀 Generando datos de prueba para el dashboard...');

  try {
    // Limpiar datos existentes (en orden inverso a las dependencias)
    console.log('🧹 Limpiando datos existentes...');
    await prisma.movimientoInventario.deleteMany({});
    await prisma.pedidoInventario.deleteMany({});
    await prisma.producto.deleteMany({});
    await prisma.proveedor.deleteMany({});
    await prisma.usuario.deleteMany({});
    await prisma.empresa.deleteMany({});
    console.log('✅ Datos existentes eliminados');

    // 1. Crear empresa de prueba
    const empresa = await prisma.empresa.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        nombre: 'Empresa de Prueba',
        rfc: 'TEST123456789',
        emailContacto: 'test@empresa.com',
        direccion: 'Dirección de prueba',
        TipoIndustria: 'FARMACIA'
      }
    });

    console.log('✅ Empresa creada:', empresa.nombre);

    // 2. Crear usuarios de prueba
    const usuarios = await Promise.all([
      prisma.usuario.upsert({
        where: { email: 'admin@test.com' },
        update: {},
        create: {
          nombre: 'Administrador',
          email: 'admin@test.com',
          password: '$2b$10$test',
          rol: 'ADMIN',
          empresaId: empresa.id,
          activo: true
        }
      }),
      prisma.usuario.upsert({
        where: { email: 'empleado@test.com' },
        update: {},
        create: {
          nombre: 'Empleado',
          email: 'empleado@test.com',
          password: '$2b$10$test',
          rol: 'EMPLEADO',
          empresaId: empresa.id,
          activo: true
        }
      })
    ]);

    console.log('✅ Usuarios creados:', usuarios.length);

    // 3. Crear proveedores de prueba
    const proveedores = await Promise.all([
      prisma.proveedor.upsert({
        where: { 
          empresaId_nombre: { 
            empresaId: empresa.id, 
            nombre: 'Proveedor A' 
          } 
        },
        update: {},
        create: {
          nombre: 'Proveedor A',
          email: 'proveedorA@test.com',
          telefono: '555-0001',
          empresaId: empresa.id,
          estado: 'ACTIVO'
        }
      }),
      prisma.proveedor.upsert({
        where: { 
          empresaId_nombre: { 
            empresaId: empresa.id, 
            nombre: 'Proveedor B' 
          } 
        },
        update: {},
        create: {
          nombre: 'Proveedor B',
          email: 'proveedorB@test.com',
          telefono: '555-0002',
          empresaId: empresa.id,
          estado: 'ACTIVO'
        }
      })
    ]);

    console.log('✅ Proveedores creados:', proveedores.length);

    // 4. Crear productos de prueba
    const productos = await Promise.all([
      prisma.producto.upsert({
        where: { sku: 'PROD-001' },
        update: {},
        create: {
          nombre: 'Paracetamol 500mg',
          descripcion: 'Analgésico y antipirético',
          stock: 150,
          empresaId: empresa.id,
          proveedorId: proveedores[0].id,
          codigoBarras: '1234567890123',
          precioCompra: 2.50,
          precioVenta: 5.00,
          stockMinimo: 20,
          tipoProducto: 'MEDICAMENTO',
          unidad: 'CAJA',
          estado: 'ACTIVO',
          etiquetas: ['Analgésico', 'Farmacia', 'Venta Libre']
        }
      }),
      prisma.producto.upsert({
        where: { sku: 'PROD-002' },
        update: {},
        create: {
          nombre: 'Ibuprofeno 400mg',
          descripcion: 'Antiinflamatorio no esteroideo',
          stock: 80,
          empresaId: empresa.id,
          proveedorId: proveedores[0].id,
          codigoBarras: '1234567890124',
          precioCompra: 3.00,
          precioVenta: 6.50,
          stockMinimo: 15,
          tipoProducto: 'MEDICAMENTO',
          unidad: 'CAJA',
          estado: 'ACTIVO',
          etiquetas: ['Antiinflamatorio', 'Farmacia', 'Venta Libre']
        }
      }),
      prisma.producto.upsert({
        where: { sku: 'PROD-003' },
        update: {},
        create: {
          nombre: 'Jeringa 5ml',
          descripcion: 'Jeringa desechable 5ml',
          stock: 200,
          empresaId: empresa.id,
          proveedorId: proveedores[1].id,
          codigoBarras: '1234567890125',
          precioCompra: 1.50,
          precioVenta: 3.00,
          stockMinimo: 50,
          tipoProducto: 'MATERIAL_QUIRURGICO',
          unidad: 'UNIDAD',
          estado: 'ACTIVO',
          etiquetas: ['Insumo', 'Desechable', 'Uso Médico']
        }
      }),
      prisma.producto.upsert({
        where: { sku: 'PROD-004' },
        update: {},
        create: {
          nombre: 'Guantes Látex M',
          descripcion: 'Guantes de látex talla M',
          stock: 25,
          empresaId: empresa.id,
          proveedorId: proveedores[1].id,
          codigoBarras: '1234567890126',
          precioCompra: 0.80,
          precioVenta: 1.80,
          stockMinimo: 100,
          tipoProducto: 'MATERIAL_QUIRURGICO',
          unidad: 'UNIDAD',
          estado: 'ACTIVO',
          etiquetas: ['Insumo', 'Desechable', 'Protección']
        }
      })
    ]);

    console.log('✅ Productos creados:', productos.length);

    // 5. Crear movimientos de inventario de prueba (últimos 30 días)
    const movimientos = [];
    const motivos = ['Compra', 'Venta', 'Ajuste de inventario', 'Devolución', 'Transferencia'];
    const tipos = ['ENTRADA', 'SALIDA'];

    // Generar movimientos para los últimos 30 días
    for (let i = 0; i < 30; i++) {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - i);
      
      // 2-4 movimientos por día
      const movimientosPorDia = Math.floor(Math.random() * 3) + 2;
      
      for (let j = 0; j < movimientosPorDia; j++) {
        const producto = productos[Math.floor(Math.random() * productos.length)];
        const tipo = tipos[Math.floor(Math.random() * tipos.length)];
        const motivo = motivos[Math.floor(Math.random() * motivos.length)];
        const cantidad = Math.floor(Math.random() * 50) + 1;
        
        movimientos.push({
          cantidad,
          productoId: producto.id,
          fecha,
          motivo,
          tipo,
          descripcion: `${tipo} de ${cantidad} unidades de ${producto.nombre}`,
          empresaId: empresa.id,
          estado: 'ACTIVO'
        });
      }
    }

    // Insertar movimientos en lotes
    const batchSize = 100;
    for (let i = 0; i < movimientos.length; i += batchSize) {
      const batch = movimientos.slice(i, i + batchSize);
      await prisma.movimientoInventario.createMany({
        data: batch,
        skipDuplicates: true
      });
    }

    console.log('✅ Movimientos creados:', movimientos.length);

    // 6. Crear pedidos de prueba
    const pedidos = await Promise.all([
      prisma.pedidoInventario.upsert({
        where: { id: 1 },
        update: {},
        create: {
          productoId: productos[0].id,
          proveedorId: proveedores[0].id,
          cantidad: 100,
          empresaId: empresa.id,
          estado: 'PENDIENTE'
        }
      }),
      prisma.pedidoInventario.upsert({
        where: { id: 2 },
        update: {},
        create: {
          productoId: productos[1].id,
          proveedorId: proveedores[0].id,
          cantidad: 50,
          empresaId: empresa.id,
          estado: 'RECIBIDO'
        }
      })
    ]);

    console.log('✅ Pedidos creados:', pedidos.length);

    console.log('🎉 ¡Datos de prueba generados exitosamente!');
    console.log('\n📊 Resumen:');
    console.log(`- Empresa: ${empresa.nombre}`);
    console.log(`- Usuarios: ${usuarios.length}`);
    console.log(`- Proveedores: ${proveedores.length}`);
    console.log(`- Productos: ${productos.length}`);
    console.log(`- Movimientos: ${movimientos.length}`);
    console.log(`- Pedidos: ${pedidos.length}`);

  } catch (error) {
    console.error('❌ Error generando datos de prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  generateTestData();
}

module.exports = { generateTestData }; 