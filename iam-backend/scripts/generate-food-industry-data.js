const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

// Datos específicos para restaurante de mariscos
const PRODUCTOS_MARISCOS = [
  {
    nombre: 'Camarones Frescos',
    descripcion: 'Camarones frescos del Golfo, tamaño grande',
    stock: 25,
    precioCompra: 180.00,
    precioVenta: 280.00,
    stockMinimo: 8,
    tipoProducto: 'ALIMENTO',
    unidad: 'KILO',
    etiquetas: ['mariscos', 'fresco', 'camarones', 'proteína']
  },
  {
    nombre: 'Langosta Viva',
    descripcion: 'Langosta viva del Caribe, 500-700g',
    stock: 12,
    precioCompra: 450.00,
    precioVenta: 680.00,
    stockMinimo: 5,
    tipoProducto: 'ALIMENTO',
    unidad: 'UNIDAD',
    etiquetas: ['mariscos', 'premium', 'langosta', 'vivo']
  },
  {
    nombre: 'Ostras Frescas',
    descripcion: 'Ostras frescas del Pacífico, docena',
    stock: 40,
    precioCompra: 120.00,
    precioVenta: 200.00,
    stockMinimo: 15,
    tipoProducto: 'ALIMENTO',
    unidad: 'PAQUETE',
    etiquetas: ['mariscos', 'fresco', 'ostras', 'crudo']
  },
  {
    nombre: 'Pescado Robalo',
    descripcion: 'Robalo fresco del día, fileteado',
    stock: 18,
    precioCompra: 160.00,
    precioVenta: 240.00,
    stockMinimo: 6,
    tipoProducto: 'ALIMENTO',
    unidad: 'KILO',
    etiquetas: ['pescado', 'fresco', 'robalo', 'filete']
  },
  {
    nombre: 'Cangrejo Azul',
    descripcion: 'Cangrejo azul del Atlántico, vivo',
    stock: 30,
    precioCompra: 200.00,
    precioVenta: 320.00,
    stockMinimo: 10,
    tipoProducto: 'ALIMENTO',
    unidad: 'KILO',
    etiquetas: ['mariscos', 'cangrejo', 'vivo', 'azul']
  },
  {
    nombre: 'Mejillones',
    descripcion: 'Mejillones frescos del Mediterráneo',
    stock: 35,
    precioCompra: 80.00,
    precioVenta: 140.00,
    stockMinimo: 12,
    tipoProducto: 'ALIMENTO',
    unidad: 'KILO',
    etiquetas: ['mariscos', 'fresco', 'mejillones', 'moluscos']
  },
  {
    nombre: 'Atún Fresco',
    descripcion: 'Atún fresco de aleta amarilla',
    stock: 15,
    precioCompra: 220.00,
    precioVenta: 350.00,
    stockMinimo: 5,
    tipoProducto: 'ALIMENTO',
    unidad: 'KILO',
    etiquetas: ['pescado', 'fresco', 'atún', 'premium']
  },
  {
    nombre: 'Almejas',
    descripcion: 'Almejas frescas del Pacífico',
    stock: 28,
    precioCompra: 90.00,
    precioVenta: 160.00,
    stockMinimo: 10,
    tipoProducto: 'ALIMENTO',
    unidad: 'KILO',
    etiquetas: ['mariscos', 'fresco', 'almejas', 'moluscos']
  },
  {
    nombre: 'Salmón Noruego',
    descripcion: 'Salmón noruego de cultivo, fileteado',
    stock: 22,
    precioCompra: 280.00,
    precioVenta: 420.00,
    stockMinimo: 8,
    tipoProducto: 'ALIMENTO',
    unidad: 'KILO',
    etiquetas: ['pescado', 'salmón', 'noruego', 'filete']
  },
  {
    nombre: 'Pulpo Fresco',
    descripcion: 'Pulpo fresco del Mediterráneo',
    stock: 8,
    precioCompra: 320.00,
    precioVenta: 480.00,
    stockMinimo: 3,
    tipoProducto: 'ALIMENTO',
    unidad: 'KILO',
    etiquetas: ['mariscos', 'fresco', 'pulpo', 'premium']
  },
  {
    nombre: 'Vieiras',
    descripcion: 'Vieiras frescas del Atlántico',
    stock: 20,
    precioCompra: 380.00,
    precioVenta: 580.00,
    stockMinimo: 6,
    tipoProducto: 'ALIMENTO',
    unidad: 'KILO',
    etiquetas: ['mariscos', 'fresco', 'vieiras', 'premium']
  },
  {
    nombre: 'Pargo Rojo',
    descripcion: 'Pargo rojo fresco del Golfo',
    stock: 16,
    precioCompra: 140.00,
    precioVenta: 220.00,
    stockMinimo: 5,
    tipoProducto: 'ALIMENTO',
    unidad: 'KILO',
    etiquetas: ['pescado', 'fresco', 'pargo', 'rojo']
  },
  {
    nombre: 'Limones Frescos',
    descripcion: 'Limones frescos para acompañar mariscos',
    stock: 50,
    precioCompra: 25.00,
    precioVenta: 45.00,
    stockMinimo: 20,
    tipoProducto: 'ALIMENTO',
    unidad: 'KILO',
    etiquetas: ['vegetales', 'limones', 'acompañamiento', 'fresco']
  },
  {
    nombre: 'Hierbas Frescas',
    descripcion: 'Mezcla de hierbas frescas (perejil, cilantro, eneldo)',
    stock: 15,
    precioCompra: 60.00,
    precioVenta: 100.00,
    stockMinimo: 8,
    tipoProducto: 'ALIMENTO',
    unidad: 'KILO',
    etiquetas: ['vegetales', 'hierbas', 'fresco', 'condimentos']
  },
  {
    nombre: 'Mantequilla Clarificada',
    descripcion: 'Mantequilla clarificada para cocinar mariscos',
    stock: 30,
    precioCompra: 120.00,
    precioVenta: 180.00,
    stockMinimo: 10,
    tipoProducto: 'ALIMENTO',
    unidad: 'KILO',
    etiquetas: ['lácteos', 'mantequilla', 'cocina', 'grasa']
  }
];

// Productos con stock bajo para alertas
const PRODUCTOS_STOCK_BAJO_MARISCOS = [
  {
    nombre: 'Caviar Beluga',
    descripcion: 'Caviar Beluga premium, 30g',
    stock: 2,
    precioCompra: 1200.00,
    precioVenta: 1800.00,
    stockMinimo: 5,
    tipoProducto: 'ALIMENTO',
    unidad: 'UNIDAD',
    etiquetas: ['mariscos', 'premium', 'caviar', 'beluga']
  },
  {
    nombre: 'Bogavante Europeo',
    descripcion: 'Bogavante europeo vivo, 800g-1kg',
    stock: 1,
    precioCompra: 680.00,
    precioVenta: 980.00,
    stockMinimo: 3,
    tipoProducto: 'ALIMENTO',
    unidad: 'UNIDAD',
    etiquetas: ['mariscos', 'premium', 'bogavante', 'vivo']
  },
  {
    nombre: 'Trucha Salvaje',
    descripcion: 'Trucha salvaje de río, fresca',
    stock: 0,
    precioCompra: 180.00,
    precioVenta: 280.00,
    stockMinimo: 4,
    tipoProducto: 'ALIMENTO',
    unidad: 'KILO',
    etiquetas: ['pescado', 'fresco', 'trucha', 'salvaje']
  },
  {
    nombre: 'Erizo de Mar',
    descripcion: 'Erizo de mar fresco, docena',
    stock: 3,
    precioCompra: 240.00,
    precioVenta: 380.00,
    stockMinimo: 8,
    tipoProducto: 'ALIMENTO',
    unidad: 'PAQUETE',
    etiquetas: ['mariscos', 'fresco', 'erizo', 'crudo']
  }
];

const PROVEEDORES_MARISCOS = [
  {
    nombre: 'Pesquera del Golfo',
    email: 'ventas@pesqueradelgolfo.com',
    telefono: '555-1001'
  },
  {
    nombre: 'Mariscos Premium del Caribe',
    email: 'pedidos@mariscospremium.com',
    telefono: '555-1002'
  },
  {
    nombre: 'Pescados Frescos del Pacífico',
    email: 'contacto@pescadosfrescos.com',
    telefono: '555-1003'
  },
  {
    nombre: 'Distribuidora Mediterránea',
    email: 'ventas@mediterranea.com',
    telefono: '555-1004'
  },
  {
    nombre: 'Importadora Noruega',
    email: 'pedidos@noruegaimports.com',
    telefono: '555-1005'
  }
];

// Función para generar fechas aleatorias en los últimos 90 días
function getRandomDate(daysAgo = 90) {
  const now = new Date();
  const pastDate = new Date(now.getTime() - Math.random() * daysAgo * 24 * 60 * 60 * 1000);
  return pastDate;
}

// Función para generar movimientos específicos de restaurante
function generateMovimientosRestaurante(productos, empresaId) {
  const movimientos = [];
  const tipos = ['ENTRADA', 'SALIDA'];
  const motivosEntrada = [
    'Compra a proveedor',
    'Entrega de pescador local',
    'Importación directa',
    'Devolución de cliente',
    'Ajuste de inventario'
  ];
  const motivosSalida = [
    'Venta a cliente',
    'Consumo interno',
    'Merma por caducidad',
    'Preparación de platillos',
    'Promoción especial',
    'Evento privado'
  ];

  // Generar movimientos para cada producto
  productos.forEach(producto => {
    // Generar entre 8-20 movimientos por producto (más frecuente en restaurantes)
    const numMovimientos = Math.floor(Math.random() * 13) + 8;
    
    for (let i = 0; i < numMovimientos; i++) {
      const tipo = tipos[Math.floor(Math.random() * tipos.length)];
      let cantidad, motivo;
      
      if (tipo === 'ENTRADA') {
        cantidad = Math.floor(Math.random() * 15) + 3; // 3-18 unidades
        motivo = motivosEntrada[Math.floor(Math.random() * motivosEntrada.length)];
      } else {
        cantidad = Math.floor(Math.random() * 8) + 1; // 1-8 unidades
        motivo = motivosSalida[Math.floor(Math.random() * motivosSalida.length)];
      }
      
      movimientos.push({
        cantidad,
        productoId: producto.id,
        fecha: getRandomDate(),
        motivo,
        tipo,
        descripcion: `${tipo === 'ENTRADA' ? 'Ingreso' : 'Salida'} de ${cantidad} ${producto.unidad === 'KILO' ? 'kg' : producto.unidad === 'PAQUETE' ? 'paquetes' : 'unidades'} de ${producto.nombre}`,
        empresaId
      });
    }
  });

  return movimientos;
}

// Función para generar pedidos específicos de restaurante
function generatePedidosRestaurante(productos, proveedores, empresaId) {
  const pedidos = [];
  const estados = ['PENDIENTE', 'ENVIADO', 'RECIBIDO', 'CANCELADO'];

  // Generar pedidos para productos premium y de alta demanda
  productos.slice(0, 12).forEach(producto => {
    const proveedor = proveedores[Math.floor(Math.random() * proveedores.length)];
    const estado = estados[Math.floor(Math.random() * estados.length)];
    const cantidad = producto.unidad === 'KILO' 
      ? Math.floor(Math.random() * 20) + 5  // 5-25 kg
      : Math.floor(Math.random() * 30) + 10; // 10-40 unidades
    
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
    console.log('🐟 Iniciando generación de datos para restaurante de mariscos...');

    // Verificar si existe la cuenta prueba@iam.com
    let usuario = await prisma.usuario.findUnique({
      where: { email: 'prueba@iam.com' },
      include: { empresa: true }
    });

    let empresaId;

    if (!usuario) {
      console.log('👤 Usuario prueba@iam.com no encontrado, creando...');
      
      // Crear empresa de restaurante de mariscos
      const empresa = await prisma.empresa.create({
        data: {
          nombre: 'Mariscos del Caribe',
          rfc: 'MAR123456789',
          emailContacto: 'info@mariscosdelcaribe.com',
          direccion: 'Av. Costera 123, Puerto Vallarta, Jalisco',
          TipoIndustria: 'ALIMENTOS'
        }
      });
      
      empresaId = empresa.id;
      console.log(`🏢 Empresa creada: ${empresa.nombre} (ID: ${empresaId})`);

      // Crear usuario
      const hashedPassword = await bcrypt.hash('PruebaIAM123?', 10);
      usuario = await prisma.usuario.create({
        data: {
          nombre: 'Chef Principal',
          email: 'prueba@iam.com',
          password: hashedPassword,
          rol: 'ADMIN',
          empresaId: empresaId,
          setupCompletado: true
        }
      });
      
      console.log(`👤 Usuario creado: ${usuario.email}`);
    } else {
      empresaId = usuario.empresa.id;
      console.log(`📋 Empresa encontrada: ${usuario.empresa.nombre} (ID: ${empresaId})`);
    }

    // 1. Crear proveedores específicos de mariscos
    console.log('\n🏭 Creando proveedores de mariscos...');
    const proveedoresCreados = [];
    for (const proveedorData of PROVEEDORES_MARISCOS) {
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

    // 2. Crear productos principales de mariscos
    console.log('\n🐟 Creando productos de mariscos...');
    const productosCreados = [];
    for (const productoData of PRODUCTOS_MARISCOS) {
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
            codigoBarras: `MAR${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
            sku: `SKU${Math.random().toString(36).substr(2, 6).toUpperCase()}`
          }
        });
        console.log(`   ✅ Producto creado: ${producto.nombre} (Stock: ${producto.stock})`);
      } else {
        console.log(`   ℹ️  Producto ya existe: ${producto.nombre}`);
      }
      productosCreados.push(producto);
    }

    // 3. Crear productos con stock bajo
    console.log('\n🚨 Creando productos premium con stock bajo...');
    for (const productoData of PRODUCTOS_STOCK_BAJO_MARISCOS) {
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
            codigoBarras: `MAR${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
            sku: `SKU${Math.random().toString(36).substr(2, 6).toUpperCase()}`
          }
        });
        console.log(`   ✅ Producto premium creado: ${producto.nombre} (Stock: ${producto.stock}/${producto.stockMinimo})`);
      } else {
        console.log(`   ℹ️  Producto premium ya existe: ${producto.nombre}`);
      }
      productosCreados.push(producto);
    }

    // 4. Crear movimientos de inventario específicos de restaurante
    console.log('\n📊 Generando movimientos de restaurante...');
    const movimientosExistentes = await prisma.movimientoInventario.count({
      where: { empresaId }
    });
    
    if (movimientosExistentes < 200) {
      console.log(`   ℹ️  Solo hay ${movimientosExistentes} movimientos, generando más...`);
      const movimientosData = generateMovimientosRestaurante(productosCreados, empresaId);
      
      // Crear movimientos en lotes
      const batchSize = 50;
      for (let i = 0; i < movimientosData.length; i += batchSize) {
        const batch = movimientosData.slice(i, i + batchSize);
        await prisma.movimientoInventario.createMany({
          data: batch
        });
      }
      console.log(`   ✅ ${movimientosData.length} movimientos de restaurante creados`);
    } else {
      console.log(`   ℹ️  Ya hay suficientes movimientos (${movimientosExistentes})`);
    }

    // 5. Crear pedidos específicos de restaurante
    console.log('\n📋 Generando pedidos de restaurante...');
    const pedidosExistentes = await prisma.pedidoInventario.count({
      where: { empresaId }
    });
    
    if (pedidosExistentes < 15) {
      console.log(`   ℹ️  Solo hay ${pedidosExistentes} pedidos, generando más...`);
      const pedidosData = generatePedidosRestaurante(productosCreados, proveedoresCreados, empresaId);
      
      for (const pedidoData of pedidosData) {
        await prisma.pedidoInventario.create({
          data: pedidoData
        });
      }
      console.log(`   ✅ ${pedidosData.length} pedidos de restaurante creados`);
    } else {
      console.log(`   ℹ️  Ya hay suficientes pedidos (${pedidosExistentes})`);
    }

    // 6. Actualizar stocks basado en movimientos
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

    // 7. Mostrar resumen final
    console.log('\n📈 Resumen de datos para restaurante de mariscos:');
    console.log('================================================');
    
    const totalProductos = await prisma.producto.count({ where: { empresaId } });
    const totalProveedores = await prisma.proveedor.count({ where: { empresaId } });
    const totalMovimientos = await prisma.movimientoInventario.count({ where: { empresaId } });
    const totalPedidos = await prisma.pedidoInventario.count({ where: { empresaId } });
    
    console.log(`   🐟 Productos de mariscos: ${totalProductos}`);
    console.log(`   🏭 Proveedores especializados: ${totalProveedores}`);
    console.log(`   📊 Movimientos de restaurante: ${totalMovimientos}`);
    console.log(`   📋 Pedidos a proveedores: ${totalPedidos}`);

    // 8. Mostrar productos con stock bajo
    console.log('\n⚠️  Productos con Stock Bajo:');
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

    console.log('\n✅ Datos para restaurante de mariscos generados exitosamente!');
    console.log('🎯 Ahora puedes probar el módulo de KPIs específicos para la industria de alimentos.');
    console.log(`🔗 URL del dashboard: http://localhost:3000/dashboard-cqrs/kpis`);
    console.log(`👤 Credenciales: prueba@iam.com / PruebaIAM123?`);

  } catch (error) {
    console.error('❌ Error generando datos para restaurante:', error);
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