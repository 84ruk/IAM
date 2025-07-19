const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Productos con stock bajo para probar alertas
const PRODUCTOS_STOCK_BAJO = [
  {
    nombre: 'Alicate de Corte',
    descripcion: 'Alicate de corte diagonal 6"',
    stock: 3,
    precioCompra: 35.00,
    precioVenta: 58.00,
    stockMinimo: 8,
    tipoProducto: 'GENERICO',
    unidad: 'UNIDAD',
    etiquetas: ['herramientas', 'corte', 'manual']
  },
  {
    nombre: 'Nivel de Burbuja',
    descripcion: 'Nivel de burbuja 24" con imán',
    stock: 2,
    precioCompra: 28.00,
    precioVenta: 45.00,
    stockMinimo: 5,
    tipoProducto: 'GENERICO',
    unidad: 'UNIDAD',
    etiquetas: ['herramientas', 'medición', 'nivel']
  },
  {
    nombre: 'Cable Eléctrico 12AWG',
    descripcion: 'Cable eléctrico 12AWG, rollo de 100m',
    stock: 1,
    precioCompra: 120.00,
    precioVenta: 180.00,
    stockMinimo: 3,
    tipoProducto: 'GENERICO',
    unidad: 'UNIDAD',
    etiquetas: ['materiales', 'eléctrico', 'cable']
  },
  {
    nombre: 'Interruptor Simple',
    descripcion: 'Interruptor simple 15A, color blanco',
    stock: 0,
    precioCompra: 8.50,
    precioVenta: 15.00,
    stockMinimo: 10,
    tipoProducto: 'ELECTRONICO',
    unidad: 'UNIDAD',
    etiquetas: ['eléctrico', 'interruptor', 'instalación']
  },
  {
    nombre: 'Caja de Conexión',
    descripcion: 'Caja de conexión plástica 4x4"',
    stock: 4,
    precioCompra: 12.00,
    precioVenta: 20.00,
    stockMinimo: 6,
    tipoProducto: 'GENERICO',
    unidad: 'UNIDAD',
    etiquetas: ['eléctrico', 'caja', 'instalación']
  }
];

async function main() {
  try {
    console.log('🚨 Agregando productos con stock bajo para probar alertas...');

    // Buscar el usuario admin@elpeso.com
    const usuario = await prisma.usuario.findUnique({
      where: { email: 'admin@elpeso.com' },
      include: { empresa: true }
    });

    if (!usuario || !usuario.empresa) {
      throw new Error('Usuario admin@elpeso.com no encontrado o sin empresa asociada');
    }

    const empresaId = usuario.empresa.id;
    console.log(`📋 Empresa: ${usuario.empresa.nombre} (ID: ${empresaId})`);

    // Obtener un proveedor existente
    const proveedor = await prisma.proveedor.findFirst({
      where: { empresaId }
    });

    if (!proveedor) {
      throw new Error('No se encontraron proveedores');
    }

    console.log(`🏭 Usando proveedor: ${proveedor.nombre}`);

    // Crear productos con stock bajo
    console.log('\n📦 Creando productos con stock bajo...');
    const productosCreados = [];
    
    for (const productoData of PRODUCTOS_STOCK_BAJO) {
      let producto = await prisma.producto.findFirst({
        where: {
          empresaId,
          nombre: productoData.nombre
        }
      });
      
      if (!producto) {
        producto = await prisma.producto.create({
          data: {
            ...productoData,
            empresaId,
            proveedorId: proveedor.id,
            codigoBarras: `BAR${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
            sku: `SKU${Math.random().toString(36).substr(2, 6).toUpperCase()}`
          }
        });
        console.log(`   ✅ Producto creado: ${producto.nombre} (Stock: ${producto.stock}/${producto.stockMinimo})`);
      } else {
        // Actualizar stock a un valor bajo
        await prisma.producto.update({
          where: { id: producto.id },
          data: { stock: productoData.stock }
        });
        console.log(`   🔄 Producto actualizado: ${producto.nombre} (Stock: ${productoData.stock}/${producto.stockMinimo})`);
      }
      productosCreados.push(producto);
    }

    // Generar algunos movimientos de salida para estos productos
    console.log('\n📊 Generando movimientos de salida...');
    const movimientosSalida = [];
    
    productosCreados.forEach(producto => {
      // Generar 2-4 movimientos de salida
      const numMovimientos = Math.floor(Math.random() * 3) + 2;
      
      for (let i = 0; i < numMovimientos; i++) {
        const cantidad = Math.floor(Math.random() * 5) + 1; // 1-5 unidades
        
        movimientosSalida.push({
          cantidad,
          productoId: producto.id,
          fecha: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Últimos 30 días
          motivo: 'Venta a cliente',
          tipo: 'SALIDA',
          descripcion: `Venta de ${cantidad} unidades`,
          empresaId
        });
      }
    });

    // Crear movimientos
    await prisma.movimientoInventario.createMany({
      data: movimientosSalida
    });
    
    console.log(`   ✅ ${movimientosSalida.length} movimientos de salida creados`);

    // Mostrar resumen final
    console.log('\n📈 Resumen de productos con stock bajo:');
    console.log('=====================================');
    
    const productosStockBajo = await prisma.producto.findMany({
      where: {
        empresaId,
        estado: 'ACTIVO',
        stock: {
          lte: prisma.producto.fields.stockMinimo
        }
      },
      select: {
        nombre: true,
        stock: true,
        stockMinimo: true,
        precioVenta: true
      },
      orderBy: {
        stock: 'asc'
      }
    });

    productosStockBajo.forEach(producto => {
      const porcentaje = ((producto.stock / producto.stockMinimo) * 100).toFixed(1);
      const icono = producto.stock === 0 ? '🔴' : producto.stock < producto.stockMinimo * 0.5 ? '🟡' : '🟠';
      console.log(`   ${icono} ${producto.nombre}: ${producto.stock}/${producto.stockMinimo} (${porcentaje}%) - $${producto.precioVenta}`);
    });

    console.log('\n✅ Productos con stock bajo agregados exitosamente!');
    console.log('🎯 Ahora los KPIs mostrarán alertas de stock bajo.');
    console.log(`🔗 URL del dashboard: http://localhost:3000/dashboard-cqrs/kpis`);

  } catch (error) {
    console.error('❌ Error agregando productos con stock bajo:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el script
if (require.main === module) {
  main()
    .then(() => {
      console.log('\n🎉 Script completado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Error en el script:', error);
      process.exit(1);
    });
}

module.exports = { main }; 