const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

// Datos de prueba para KPIs
const PRODUCTOS_TEST = [
  {
    nombre: 'Martillo Profesional',
    descripcion: 'Martillo de acero forjado con mango ergonómico',
    stock: 25,
    precioCompra: 45.00,
    precioVenta: 75.00,
    stockMinimo: 10,
    tipoProducto: 'GENERICO',
    unidad: 'UNIDAD',
    etiquetas: ['herramientas', 'construcción', 'manual']
  },
  {
    nombre: 'Destornillador Phillips',
    descripcion: 'Destornillador Phillips #2 con punta magnética',
    stock: 50,
    precioCompra: 12.50,
    precioVenta: 22.00,
    stockMinimo: 15,
    tipoProducto: 'GENERICO',
    unidad: 'UNIDAD',
    etiquetas: ['herramientas', 'manual', 'precisión']
  },
  {
    nombre: 'Sierra Circular',
    descripcion: 'Sierra circular de 7-1/4" con motor de 15A',
    stock: 8,
    precioCompra: 180.00,
    precioVenta: 320.00,
    stockMinimo: 5,
    tipoProducto: 'GENERICO',
    unidad: 'UNIDAD',
    etiquetas: ['herramientas', 'eléctrica', 'corte']
  },
  {
    nombre: 'Clavos de 2"',
    descripcion: 'Clavos de acero galvanizado, caja de 1kg',
    stock: 100,
    precioCompra: 8.00,
    precioVenta: 15.00,
    stockMinimo: 30,
    tipoProducto: 'GENERICO',
    unidad: 'KILO',
    etiquetas: ['materiales', 'fijación', 'construcción']
  },
  {
    nombre: 'Tornillos Phillips',
    descripcion: 'Tornillos Phillips cabeza plana 3/4", paquete de 100',
    stock: 75,
    precioCompra: 15.00,
    precioVenta: 28.00,
    stockMinimo: 20,
    tipoProducto: 'GENERICO',
    unidad: 'PAQUETE',
    etiquetas: ['materiales', 'fijación', 'precisión']
  },
  {
    nombre: 'Lijas Grano 80',
    descripcion: 'Lijas de papel grano 80, paquete de 10 hojas',
    stock: 40,
    precioCompra: 6.50,
    precioVenta: 12.00,
    stockMinimo: 12,
    tipoProducto: 'GENERICO',
    unidad: 'PAQUETE',
    etiquetas: ['materiales', 'acabado', 'superficie']
  },
  {
    nombre: 'Taladro Inalámbrico',
    descripcion: 'Taladro inalámbrico 20V con batería y cargador',
    stock: 12,
    precioCompra: 220.00,
    precioVenta: 380.00,
    stockMinimo: 8,
    tipoProducto: 'GENERICO',
    unidad: 'UNIDAD',
    etiquetas: ['herramientas', 'eléctrica', 'inalámbrica']
  },
  {
    nombre: 'Escuadra de Acero',
    descripcion: 'Escuadra de acero 30cm con graduación',
    stock: 35,
    precioCompra: 18.00,
    precioVenta: 32.00,
    stockMinimo: 10,
    tipoProducto: 'GENERICO',
    unidad: 'UNIDAD',
    etiquetas: ['herramientas', 'medición', 'precisión']
  },
  {
    nombre: 'Cinta Métrica',
    descripcion: 'Cinta métrica de 5 metros con bloqueo automático',
    stock: 60,
    precioCompra: 9.50,
    precioVenta: 18.00,
    stockMinimo: 15,
    tipoProducto: 'GENERICO',
    unidad: 'UNIDAD',
    etiquetas: ['herramientas', 'medición', 'manual']
  },
  {
    nombre: 'Pintura Blanca Mate',
    descripcion: 'Pintura blanca mate interior/exterior, galón de 4L',
    stock: 20,
    precioCompra: 35.00,
    precioVenta: 65.00,
    stockMinimo: 8,
    tipoProducto: 'GENERICO',
    unidad: 'LITRO',
    etiquetas: ['materiales', 'pintura', 'acabado']
  },
  {
    nombre: 'Brocha 2"',
    descripcion: 'Brocha de cerdas naturales 2" para pintura',
    stock: 30,
    precioCompra: 7.00,
    precioVenta: 14.00,
    stockMinimo: 10,
    tipoProducto: 'GENERICO',
    unidad: 'UNIDAD',
    etiquetas: ['herramientas', 'pintura', 'manual']
  },
  {
    nombre: 'Lámpara LED',
    descripcion: 'Lámpara LED empotrable 12W, luz blanca',
    stock: 45,
    precioCompra: 25.00,
    precioVenta: 45.00,
    stockMinimo: 12,
    tipoProducto: 'ELECTRONICO',
    unidad: 'UNIDAD',
    etiquetas: ['iluminación', 'led', 'empotrable']
  }
];

const PROVEEDORES_TEST = [
  {
    nombre: 'Ferretería Central',
    email: 'ventas@ferreteriacentral.com',
    telefono: '555-0101'
  },
  {
    nombre: 'Distribuidora Industrial',
    email: 'pedidos@distribuidoraindustrial.com',
    telefono: '555-0202'
  },
  {
    nombre: 'Herramientas Profesionales',
    email: 'contacto@herramientaspro.com',
    telefono: '555-0303'
  },
  {
    nombre: 'Materiales de Construcción',
    email: 'ventas@materialesconstruccion.com',
    telefono: '555-0404'
  }
];

// Función para generar fechas aleatorias en los últimos 90 días
function getRandomDate(daysAgo = 90) {
  const now = new Date();
  const pastDate = new Date(now.getTime() - Math.random() * daysAgo * 24 * 60 * 60 * 1000);
  return pastDate;
}

// Función para generar movimientos de inventario
function generateMovimientos(productos, empresaId) {
  const movimientos = [];
  const tipos = ['ENTRADA', 'SALIDA'];
  const motivos = [
    'Compra a proveedor',
    'Venta a cliente',
    'Ajuste de inventario',
    'Devolución de cliente',
    'Transferencia entre almacenes',
    'Merma por daño',
    'Promoción especial'
  ];

  // Generar movimientos para cada producto
  productos.forEach(producto => {
    // Generar entre 5-15 movimientos por producto
    const numMovimientos = Math.floor(Math.random() * 11) + 5;
    
    for (let i = 0; i < numMovimientos; i++) {
      const tipo = tipos[Math.floor(Math.random() * tipos.length)];
      const cantidad = tipo === 'ENTRADA' 
        ? Math.floor(Math.random() * 20) + 5  // 5-25 unidades
        : Math.floor(Math.random() * 10) + 1; // 1-10 unidades
      
      movimientos.push({
        cantidad,
        productoId: producto.id,
        fecha: getRandomDate(),
        motivo: motivos[Math.floor(Math.random() * motivos.length)],
        tipo,
        descripcion: `${tipo === 'ENTRADA' ? 'Ingreso' : 'Salida'} de ${cantidad} unidades`,
        empresaId
      });
    }
  });

  return movimientos;
}

// Función para generar pedidos
function generatePedidos(productos, proveedores, empresaId) {
  const pedidos = [];
  const estados = ['PENDIENTE', 'ENVIADO', 'RECIBIDO', 'CANCELADO'];

  // Generar pedidos para algunos productos
  productos.slice(0, 8).forEach(producto => {
    const proveedor = proveedores[Math.floor(Math.random() * proveedores.length)];
    const estado = estados[Math.floor(Math.random() * estados.length)];
    const cantidad = Math.floor(Math.random() * 50) + 10; // 10-60 unidades
    
    pedidos.push({
      productoId: producto.id,
      proveedorId: proveedor.id,
      cantidad,
      fechaPedido: getRandomDate(30), // Últimos 30 días
      empresaId,
      estado
    });
  });

  return pedidos;
}

async function main() {
  try {
    console.log('🚀 Iniciando generación de datos de prueba para KPIs...');

    // Buscar el usuario admin@elpeso.com
    const usuario = await prisma.usuario.findUnique({
      where: { email: 'admin@elpeso.com' },
      include: { empresa: true }
    });

    if (!usuario || !usuario.empresa) {
      throw new Error('Usuario admin@elpeso.com no encontrado o sin empresa asociada');
    }

    const empresaId = usuario.empresa.id;
    console.log(`📋 Empresa encontrada: ${usuario.empresa.nombre} (ID: ${empresaId})`);

    // 1. Crear proveedores (solo si no existen)
    console.log('\n🏭 Verificando proveedores...');
    const proveedoresCreados = [];
    for (const proveedorData of PROVEEDORES_TEST) {
      let proveedor = await prisma.proveedor.findFirst({
        where: {
          empresaId,
          nombre: proveedorData.nombre
        }
      });
      
      if (!proveedor) {
        proveedor = await prisma.proveedor.create({
          data: {
            ...proveedorData,
            empresaId
          }
        });
        console.log(`   ✅ Proveedor creado: ${proveedor.nombre}`);
      } else {
        console.log(`   ℹ️  Proveedor ya existe: ${proveedor.nombre}`);
      }
      proveedoresCreados.push(proveedor);
    }

    // 2. Crear productos (solo si no existen)
    console.log('\n📦 Verificando productos...');
    const productosCreados = [];
    for (const productoData of PRODUCTOS_TEST) {
      let producto = await prisma.producto.findFirst({
        where: {
          empresaId,
          nombre: productoData.nombre
        }
      });
      
      if (!producto) {
        const proveedor = proveedoresCreados[Math.floor(Math.random() * proveedoresCreados.length)];
        
        producto = await prisma.producto.create({
          data: {
            ...productoData,
            empresaId,
            proveedorId: proveedor.id,
            codigoBarras: `BAR${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
            sku: `SKU${Math.random().toString(36).substr(2, 6).toUpperCase()}`
          }
        });
        console.log(`   ✅ Producto creado: ${producto.nombre} (Stock: ${producto.stock})`);
      } else {
        console.log(`   ℹ️  Producto ya existe: ${producto.nombre}`);
      }
      productosCreados.push(producto);
    }

    // 3. Crear movimientos de inventario (solo si no hay suficientes)
    console.log('\n📊 Verificando movimientos de inventario...');
    const movimientosExistentes = await prisma.movimientoInventario.count({
      where: { empresaId }
    });
    
    if (movimientosExistentes < 100) {
      console.log(`   ℹ️  Solo hay ${movimientosExistentes} movimientos, generando más...`);
      const movimientosData = generateMovimientos(productosCreados, empresaId);
      
      // Crear movimientos en lotes para mejor performance
      const batchSize = 50;
      for (let i = 0; i < movimientosData.length; i += batchSize) {
        const batch = movimientosData.slice(i, i + batchSize);
        await prisma.movimientoInventario.createMany({
          data: batch
        });
      }
      console.log(`   ✅ ${movimientosData.length} movimientos adicionales creados`);
    } else {
      console.log(`   ℹ️  Ya hay suficientes movimientos (${movimientosExistentes})`);
    }

    // 4. Crear pedidos (solo si no hay suficientes)
    console.log('\n📋 Verificando pedidos...');
    const pedidosExistentes = await prisma.pedidoInventario.count({
      where: { empresaId }
    });
    
    if (pedidosExistentes < 20) {
      console.log(`   ℹ️  Solo hay ${pedidosExistentes} pedidos, generando más...`);
      const pedidosData = generatePedidos(productosCreados, proveedoresCreados, empresaId);
      
      for (const pedidoData of pedidosData) {
        await prisma.pedidoInventario.create({
          data: pedidoData
        });
      }
      console.log(`   ✅ ${pedidosData.length} pedidos adicionales creados`);
    } else {
      console.log(`   ℹ️  Ya hay suficientes pedidos (${pedidosExistentes})`);
    }

    // 5. Actualizar stocks basado en movimientos
    console.log('\n🔄 Actualizando stocks de productos...');
    for (const producto of productosCreados) {
      const movimientosProducto = await prisma.movimientoInventario.findMany({
        where: { productoId: producto.id }
      });

      let stockActual = producto.stock;
      movimientosProducto.forEach(mov => {
        if (mov.tipo === 'ENTRADA') {
          stockActual += mov.cantidad;
        } else {
          stockActual = Math.max(0, stockActual - mov.cantidad);
        }
      });

      await prisma.producto.update({
        where: { id: producto.id },
        data: { stock: stockActual }
      });
      
      console.log(`   ✅ ${producto.nombre}: Stock actualizado a ${stockActual}`);
    }

    // 6. Mostrar resumen de datos creados
    console.log('\n📈 Resumen de datos creados:');
    console.log('============================');
    
    const totalProductos = await prisma.producto.count({ where: { empresaId } });
    const totalProveedores = await prisma.proveedor.count({ where: { empresaId } });
    const totalMovimientos = await prisma.movimientoInventario.count({ where: { empresaId } });
    const totalPedidos = await prisma.pedidoInventario.count({ where: { empresaId } });
    
    console.log(`   📦 Productos: ${totalProductos}`);
    console.log(`   🏭 Proveedores: ${totalProveedores}`);
    console.log(`   📊 Movimientos: ${totalMovimientos}`);
    console.log(`   📋 Pedidos: ${totalPedidos}`);

    // 7. Mostrar algunos productos con stock bajo para verificar KPIs
    console.log('\n⚠️  Productos con stock bajo:');
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
        stockMinimo: true
      }
    });

    productosStockBajo.forEach(producto => {
      console.log(`   ⚠️  ${producto.nombre}: ${producto.stock}/${producto.stockMinimo}`);
    });

    console.log('\n✅ Datos de prueba generados exitosamente!');
    console.log('🎯 Ahora puedes probar el módulo de KPIs con datos reales.');
    console.log(`🔗 URL del dashboard: http://localhost:3000/dashboard-cqrs/kpis`);

  } catch (error) {
    console.error('❌ Error generando datos de prueba:', error);
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