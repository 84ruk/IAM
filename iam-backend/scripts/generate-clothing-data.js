const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function generateClothingData() {
  try {
    console.log('👕 Generando datos para empresa de ropa...\n');

    // 1. Verificar si el usuario existe
    let user = await prisma.usuario.findUnique({
      where: { email: 'contactobaruk@gmail.com' }
    });

    if (!user) {
      console.log('👤 Usuario no encontrado, creando cuenta...');
      
      const hashedPassword = await bcrypt.hash('PruebaIAM123!', 10);
      user = await prisma.usuario.create({
        data: {
          email: 'contactobaruk@gmail.com',
          password: hashedPassword,
          nombre: 'Baruk',
          apellido: 'Ramos',
          rol: 'ADMIN',
          setupCompleted: false
        }
      });
      console.log('✅ Usuario creado:', user.email);
    } else {
      console.log('✅ Usuario encontrado:', user.email);
    }

    // 2. Verificar si la empresa existe
    let empresa = await prisma.empresa.findFirst({
      where: {
        usuarios: {
          some: {
            id: user.id
          }
        }
      }
    });

    if (!empresa) {
      console.log('👕 Creando empresa de ropa...');
      
      empresa = await prisma.empresa.create({
        data: {
          nombre: 'Fashion Style Boutique',
          TipoIndustria: 'ROPA',
          direccion: 'Plaza Comercial Fashion 456, Zona Rosa',
          telefono: '+52 55 9876 5432',
          rfc: 'FSB250101XYZ',
          usuarios: {
            connect: { id: user.id }
          },
          setupCompleted: true
        }
      });
      console.log('✅ Empresa creada:', empresa.nombre);
    } else {
      console.log('✅ Empresa encontrada:', empresa.nombre);
    }

    // 3. Crear proveedores de ropa
    console.log('\n🏭 Creando proveedores de ropa...');
    
    const proveedores = [
      {
        nombre: 'Textiles del Norte S.A.',
        telefono: '+52 81 2345 6789',
        email: 'ventas@textilesdelnorte.com',
        estado: 'ACTIVO'
      },
      {
        nombre: 'Confecciones Elegantes',
        telefono: '+52 33 3456 7890',
        email: 'pedidos@confeccioneselegantes.com',
        estado: 'ACTIVO'
      },
      {
        nombre: 'Importadora de Moda Express',
        telefono: '+52 55 4567 8901',
        email: 'contacto@importadoramoda.com',
        estado: 'ACTIVO'
      },
      {
        nombre: 'Fabricantes de Calzado Premium',
        telefono: '+52 55 5678 9012',
        email: 'ventas@calzadopremium.com',
        estado: 'ACTIVO'
      },
      {
        nombre: 'Accesorios y Complementos',
        telefono: '+52 55 6789 0123',
        email: 'pedidos@accesorios.com',
        estado: 'ACTIVO'
      }
    ];

    for (const proveedorData of proveedores) {
      const existingProveedor = await prisma.proveedor.findFirst({
        where: {
          nombre: proveedorData.nombre,
          empresaId: empresa.id
        }
      });

      if (!existingProveedor) {
        await prisma.proveedor.create({
          data: {
            ...proveedorData,
            empresaId: empresa.id
          }
        });
        console.log(`✅ Proveedor creado: ${proveedorData.nombre}`);
      } else {
        console.log(`⏭️  Proveedor ya existe: ${proveedorData.nombre}`);
      }
    }

    // 4. Crear productos de ropa
    console.log('\n👕 Creando productos de ropa...');
    
    const productos = [
      // ROPA DE CABALLERO
      {
        nombre: 'Camisa de Vestir Clásica',
        descripcion: 'Camisa de algodón 100% para ocasiones formales',
        precioCompra: 180.00,
        precioVenta: 350.00,
        stock: 45,
        stockMinimo: 10,
        tipoProducto: 'ROPA',
        unidad: 'UNIDAD',
        etiquetas: ['camisa', 'formal', 'algodón', 'caballero'],
        estado: 'ACTIVO',
        color: 'Blanco',
        talla: 'M'
      },
      {
        nombre: 'Pantalón de Vestir Negro',
        descripcion: 'Pantalón de vestir en lana premium',
        precioCompra: 250.00,
        precioVenta: 480.00,
        stock: 38,
        stockMinimo: 8,
        tipoProducto: 'ROPA',
        unidad: 'UNIDAD',
        etiquetas: ['pantalón', 'formal', 'lana', 'caballero'],
        estado: 'ACTIVO',
        color: 'Negro',
        talla: '32'
      },
      {
        nombre: 'Traje Completo Gris',
        descripcion: 'Traje de dos piezas en lana italiana',
        precioCompra: 1200.00,
        precioVenta: 2200.00,
        stock: 15,
        stockMinimo: 3,
        tipoProducto: 'ROPA',
        unidad: 'UNIDAD',
        etiquetas: ['traje', 'formal', 'lana italiana', 'caballero'],
        estado: 'ACTIVO',
        color: 'Gris',
        talla: 'L'
      },
      {
        nombre: 'Jeans Clásicos Azules',
        descripcion: 'Jeans de denim premium con stretch',
        precioCompra: 320.00,
        precioVenta: 580.00,
        stock: 60,
        stockMinimo: 12,
        tipoProducto: 'ROPA',
        unidad: 'UNIDAD',
        etiquetas: ['jeans', 'casual', 'denim', 'caballero'],
        estado: 'ACTIVO',
        color: 'Azul',
        talla: '30'
      },
      {
        nombre: 'Chaleco de Lana',
        descripcion: 'Chaleco tejido en lana merino',
        precioCompra: 280.00,
        precioVenta: 520.00,
        stock: 25,
        stockMinimo: 5,
        tipoProducto: 'ROPA',
        unidad: 'UNIDAD',
        etiquetas: ['chaleco', 'lana', 'invierno', 'caballero'],
        estado: 'ACTIVO',
        color: 'Marrón',
        talla: 'M'
      },

      // ROPA DE DAMA
      {
        nombre: 'Vestido de Cocktail Negro',
        descripcion: 'Vestido elegante para eventos especiales',
        precioCompra: 450.00,
        precioVenta: 850.00,
        stock: 22,
        stockMinimo: 5,
        tipoProducto: 'ROPA',
        unidad: 'UNIDAD',
        etiquetas: ['vestido', 'cocktail', 'elegante', 'dama'],
        estado: 'ACTIVO',
        color: 'Negro',
        talla: 'S'
      },
      {
        nombre: 'Blusa de Seda',
        descripcion: 'Blusa de seda natural con detalles',
        precioCompra: 180.00,
        precioVenta: 320.00,
        stock: 35,
        stockMinimo: 8,
        tipoProducto: 'ROPA',
        unidad: 'UNIDAD',
        etiquetas: ['blusa', 'seda', 'elegante', 'dama'],
        estado: 'ACTIVO',
        color: 'Rosa',
        talla: 'M'
      },
      {
        nombre: 'Falda Lápiz Negra',
        descripcion: 'Falda lápiz en lana para oficina',
        precioCompra: 220.00,
        precioVenta: 420.00,
        stock: 28,
        stockMinimo: 6,
        tipoProducto: 'ROPA',
        unidad: 'UNIDAD',
        etiquetas: ['falda', 'lápiz', 'oficina', 'dama'],
        estado: 'ACTIVO',
        color: 'Negro',
        talla: 'M'
      },
      {
        nombre: 'Sweater de Lana',
        descripcion: 'Sweater tejido en lana merino',
        precioCompra: 190.00,
        precioVenta: 380.00,
        stock: 42,
        stockMinimo: 10,
        tipoProducto: 'ROPA',
        unidad: 'UNIDAD',
        etiquetas: ['sweater', 'lana', 'invierno', 'dama'],
        estado: 'ACTIVO',
        color: 'Azul marino',
        talla: 'L'
      },
      {
        nombre: 'Jeans Skinny',
        descripcion: 'Jeans skinny con stretch y detalles',
        precioCompra: 280.00,
        precioVenta: 520.00,
        stock: 55,
        stockMinimo: 12,
        tipoProducto: 'ROPA',
        unidad: 'UNIDAD',
        etiquetas: ['jeans', 'skinny', 'casual', 'dama'],
        estado: 'ACTIVO',
        color: 'Azul claro',
        talla: '26'
      },

      // CALZADO
      {
        nombre: 'Zapatos Oxford Negros',
        descripcion: 'Zapatos Oxford en cuero genuino',
        precioCompra: 380.00,
        precioVenta: 720.00,
        stock: 30,
        stockMinimo: 6,
        tipoProducto: 'ROPA',
        unidad: 'UNIDAD',
        etiquetas: ['zapatos', 'oxford', 'cuero', 'caballero'],
        estado: 'ACTIVO',
        color: 'Negro',
        talla: '8'
      },
      {
        nombre: 'Tacones Altos Rojos',
        descripcion: 'Tacones altos en charol con detalles',
        precioCompra: 320.00,
        precioVenta: 580.00,
        stock: 25,
        stockMinimo: 5,
        tipoProducto: 'ROPA',
        unidad: 'UNIDAD',
        etiquetas: ['tacones', 'altos', 'charol', 'dama'],
        estado: 'ACTIVO',
        color: 'Rojo',
        talla: '7'
      },
      {
        nombre: 'Tenis Deportivos',
        descripcion: 'Tenis deportivos con tecnología de amortiguación',
        precioCompra: 450.00,
        precioVenta: 850.00,
        stock: 40,
        stockMinimo: 8,
        tipoProducto: 'ROPA',
        unidad: 'UNIDAD',
        etiquetas: ['tenis', 'deportivos', 'amortiguación', 'unisex'],
        estado: 'ACTIVO',
        color: 'Blanco',
        talla: '9'
      },

      // ACCESORIOS
      {
        nombre: 'Cinturón de Cuero',
        descripcion: 'Cinturón de cuero genuino con hebilla',
        precioCompra: 120.00,
        precioVenta: 220.00,
        stock: 50,
        stockMinimo: 10,
        tipoProducto: 'ROPA',
        unidad: 'UNIDAD',
        etiquetas: ['cinturón', 'cuero', 'accesorio', 'caballero'],
        estado: 'ACTIVO',
        color: 'Marrón',
        talla: 'L'
      },
      {
        nombre: 'Bolsa de Mano Elegante',
        descripcion: 'Bolsa de mano en cuero con asas',
        precioCompra: 280.00,
        precioVenta: 520.00,
        stock: 20,
        stockMinimo: 4,
        tipoProducto: 'ROPA',
        unidad: 'UNIDAD',
        etiquetas: ['bolsa', 'mano', 'cuero', 'dama'],
        estado: 'ACTIVO',
        color: 'Negro',
        talla: 'Única'
      },
      {
        nombre: 'Corbata de Seda',
        descripcion: 'Corbata de seda italiana con estampado',
        precioCompra: 85.00,
        precioVenta: 160.00,
        stock: 65,
        stockMinimo: 15,
        tipoProducto: 'ROPA',
        unidad: 'UNIDAD',
        etiquetas: ['corbata', 'seda', 'accesorio', 'caballero'],
        estado: 'ACTIVO',
        color: 'Azul',
        talla: 'Estándar'
      }
    ];

    for (const productoData of productos) {
      const existingProducto = await prisma.producto.findFirst({
        where: {
          nombre: productoData.nombre,
          empresaId: empresa.id
        }
      });

      if (!existingProducto) {
        await prisma.producto.create({
          data: {
            ...productoData,
            empresaId: empresa.id
          }
        });
        console.log(`✅ Producto creado: ${productoData.nombre} (${productoData.tipoProducto})`);
      } else {
        console.log(`⏭️  Producto ya existe: ${productoData.nombre}`);
      }
    }

    // 5. Asignar proveedores a productos
    console.log('\n🔗 Asignando proveedores a productos...');
    
    const productosCreados = await prisma.producto.findMany({
      where: { empresaId: empresa.id }
    });

    const proveedoresCreados = await prisma.proveedor.findMany({
      where: { empresaId: empresa.id }
    });

    // Asignaciones específicas
    const asignaciones = {
      'Camisa de Vestir Clásica': 'Textiles del Norte S.A.',
      'Pantalón de Vestir Negro': 'Textiles del Norte S.A.',
      'Traje Completo Gris': 'Confecciones Elegantes',
      'Jeans Clásicos Azules': 'Importadora de Moda Express',
      'Chaleco de Lana': 'Textiles del Norte S.A.',
      'Vestido de Cocktail Negro': 'Confecciones Elegantes',
      'Blusa de Seda': 'Importadora de Moda Express',
      'Falda Lápiz Negra': 'Confecciones Elegantes',
      'Sweater de Lana': 'Textiles del Norte S.A.',
      'Jeans Skinny': 'Importadora de Moda Express',
      'Zapatos Oxford Negros': 'Fabricantes de Calzado Premium',
      'Tacones Altos Rojos': 'Fabricantes de Calzado Premium',
      'Tenis Deportivos': 'Fabricantes de Calzado Premium',
      'Cinturón de Cuero': 'Accesorios y Complementos',
      'Bolsa de Mano Elegante': 'Accesorios y Complementos',
      'Corbata de Seda': 'Accesorios y Complementos'
    };

    for (const producto of productosCreados) {
      const proveedorNombre = asignaciones[producto.nombre];
      
      if (proveedorNombre) {
        const proveedor = proveedoresCreados.find(p => p.nombre === proveedorNombre);
        
        if (proveedor) {
          await prisma.producto.update({
            where: { id: producto.id },
            data: { proveedorId: proveedor.id }
          });
          console.log(`✅ ${producto.nombre} → ${proveedor.nombre}`);
        }
      }
    }

    // 6. Crear movimientos de inventario
    console.log('\n📊 Creando movimientos de inventario...');
    
    // Generar movimientos de entrada (compras)
    for (let i = 0; i < 60; i++) {
      const producto = productosCreados[Math.floor(Math.random() * productosCreados.length)];
      
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - Math.floor(Math.random() * 90));
      
      const cantidad = Math.floor(Math.random() * 15) + 3;
      
      await prisma.movimientoInventario.create({
        data: {
          tipo: 'ENTRADA',
          cantidad: cantidad,
          motivo: 'Compra a proveedor',
          empresaId: empresa.id,
          productoId: producto.id,
          createdAt: fecha
        }
      });
    }

    // Generar movimientos de salida (ventas)
    for (let i = 0; i < 80; i++) {
      const producto = productosCreados[Math.floor(Math.random() * productosCreados.length)];
      
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - Math.floor(Math.random() * 90));
      
      const cantidad = Math.floor(Math.random() * 5) + 1;
      
      await prisma.movimientoInventario.create({
        data: {
          tipo: 'SALIDA',
          cantidad: cantidad,
          motivo: 'Venta al público',
          empresaId: empresa.id,
          productoId: producto.id,
          createdAt: fecha
        }
      });
    }

    // 7. Crear pedidos a proveedores
    console.log('\n📋 Creando pedidos a proveedores...');
    
    for (let i = 0; i < 8; i++) {
      const proveedor = proveedoresCreados[Math.floor(Math.random() * proveedoresCreados.length)];
      const producto = productosCreados[Math.floor(Math.random() * productosCreados.length)];
      
      const fechaPedido = new Date();
      fechaPedido.setDate(fechaPedido.getDate() - Math.floor(Math.random() * 60));
      
      const estado = Math.random() > 0.3 ? 'RECIBIDO' : 'PENDIENTE';
      const cantidad = Math.floor(Math.random() * 30) + 10;
      
      await prisma.pedidoInventario.create({
        data: {
          productoId: producto.id,
          proveedorId: proveedor.id,
          cantidad: cantidad,
          fechaPedido: fechaPedido,
          empresaId: empresa.id,
          estado: estado
        }
      });
    }

    console.log('\n🎉 Datos de empresa de ropa generados exitosamente!');
    console.log('==================================================');
    console.log(`👕 Empresa: ${empresa.nombre}`);
    console.log(`👤 Usuario: ${user.email}`);
    console.log(`💼 Productos: ${productosCreados.length}`);
    console.log(`🏭 Proveedores: ${proveedoresCreados.length}`);
    console.log(`📊 Movimientos: 140`);
    console.log(`📋 Pedidos: 8`);
    console.log('\n✅ Tipos de producto implementados:');
    console.log('   👔 Ropa de caballero - 5 productos');
    console.log('   👗 Ropa de dama - 5 productos');
    console.log('   👟 Calzado - 3 productos');
    console.log('   👜 Accesorios - 3 productos');

  } catch (error) {
    console.error('❌ Error generando datos de ropa:', error);
  } finally {
    await prisma.$disconnect();
  }
}

generateClothingData(); 