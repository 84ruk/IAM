const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function generateRestaurantData() {
  try {
    console.log('🍔 Generando datos para restaurante de hamburguesas...\n');

    // 1. Verificar si el usuario existe
    let user = await prisma.usuario.findUnique({
      where: { email: 'prueba@iam.com' }
    });

    if (!user) {
      console.log('👤 Usuario no encontrado, creando cuenta...');
      
      const hashedPassword = await bcrypt.hash('PruebaIAM123!', 10);
      user = await prisma.usuario.create({
        data: {
          email: 'prueba@iam.com',
          password: hashedPassword,
          nombre: 'Tony',
          apellido: 'Hamburguesas',
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
      console.log('🍔 Creando empresa de restaurante...');
      
      empresa = await prisma.empresa.create({
        data: {
          nombre: 'Hamburguesas Tony',
          TipoIndustria: 'ALIMENTOS',
          direccion: 'Av. Principal 789, Zona Centro',
          telefono: '+52 55 1234 5678',
          rfc: 'HT250101ABC',
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

    // 3. Crear proveedores de alimentos
    console.log('\n🏭 Creando proveedores de alimentos...');
    
    const proveedores = [
      {
        nombre: 'Carnes Premium del Norte',
        telefono: '+52 81 2345 6789',
        email: 'ventas@carnespremium.com',
        estado: 'ACTIVO'
      },
      {
        nombre: 'Distribuidora de Lácteos Express',
        telefono: '+52 33 3456 7890',
        email: 'pedidos@lacteosexpress.com',
        estado: 'ACTIVO'
      },
      {
        nombre: 'Verduras Frescas del Valle',
        telefono: '+52 55 4567 8901',
        email: 'contacto@verdurasfrescas.com',
        estado: 'ACTIVO'
      },
      {
        nombre: 'Panadería Artesanal',
        telefono: '+52 55 5678 9012',
        email: 'ventas@panaderiaartesanal.com',
        estado: 'ACTIVO'
      },
      {
        nombre: 'Bebidas y Refrescos Central',
        telefono: '+52 55 6789 0123',
        email: 'pedidos@bebidascentral.com',
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

    // 4. Crear productos del restaurante
    console.log('\n🍔 Creando productos del restaurante...');
    
    const productos = [
      // HAMBURGUESAS
      {
        nombre: 'Hamburguesa Clásica',
        descripcion: 'Hamburguesa con carne de res, lechuga, tomate y queso',
        precioCompra: 25.00,
        precioVenta: 85.00,
        stock: 50,
        stockMinimo: 10,
        tipoProducto: 'ALIMENTO',
        unidad: 'UNIDAD',
        etiquetas: ['hamburguesa', 'carne', 'clásica', 'comida rápida'],
        estado: 'ACTIVO'
      },
      {
        nombre: 'Hamburguesa Doble Queso',
        descripcion: 'Hamburguesa doble con queso cheddar derretido',
        precioCompra: 35.00,
        precioVenta: 120.00,
        stock: 40,
        stockMinimo: 8,
        tipoProducto: 'ALIMENTO',
        unidad: 'UNIDAD',
        etiquetas: ['hamburguesa', 'doble', 'queso', 'comida rápida'],
        estado: 'ACTIVO'
      },
      {
        nombre: 'Hamburguesa BBQ',
        descripcion: 'Hamburguesa con salsa BBQ, cebolla caramelizada y bacon',
        precioCompra: 40.00,
        precioVenta: 135.00,
        stock: 35,
        stockMinimo: 7,
        tipoProducto: 'ALIMENTO',
        unidad: 'UNIDAD',
        etiquetas: ['hamburguesa', 'bbq', 'bacon', 'comida rápida'],
        estado: 'ACTIVO'
      },
      {
        nombre: 'Hamburguesa Vegetariana',
        descripcion: 'Hamburguesa de garbanzo con vegetales frescos',
        precioCompra: 20.00,
        precioVenta: 95.00,
        stock: 25,
        stockMinimo: 5,
        tipoProducto: 'ALIMENTO',
        unidad: 'UNIDAD',
        etiquetas: ['hamburguesa', 'vegetariana', 'garbanzo', 'saludable'],
        estado: 'ACTIVO'
      },

      // ACOMPAÑAMIENTOS
      {
        nombre: 'Papas Fritas',
        descripcion: 'Papas fritas crujientes con sal',
        precioCompra: 8.00,
        precioVenta: 35.00,
        stock: 80,
        stockMinimo: 15,
        tipoProducto: 'ALIMENTO',
        unidad: 'UNIDAD',
        etiquetas: ['papas', 'fritas', 'acompañamiento', 'comida rápida'],
        estado: 'ACTIVO'
      },
      {
        nombre: 'Aros de Cebolla',
        descripcion: 'Aros de cebolla empanizados y fritos',
        precioCompra: 12.00,
        precioVenta: 45.00,
        stock: 60,
        stockMinimo: 12,
        tipoProducto: 'ALIMENTO',
        unidad: 'UNIDAD',
        etiquetas: ['aros', 'cebolla', 'acompañamiento', 'comida rápida'],
        estado: 'ACTIVO'
      },
      {
        nombre: 'Nuggets de Pollo',
        descripcion: 'Nuggets de pollo empanizados',
        precioCompra: 15.00,
        precioVenta: 55.00,
        stock: 70,
        stockMinimo: 14,
        tipoProducto: 'ALIMENTO',
        unidad: 'UNIDAD',
        etiquetas: ['nuggets', 'pollo', 'acompañamiento', 'comida rápida'],
        estado: 'ACTIVO'
      },

      // BEBIDAS
      {
        nombre: 'Refresco Cola',
        descripcion: 'Refresco de cola 500ml',
        precioCompra: 8.00,
        precioVenta: 25.00,
        stock: 100,
        stockMinimo: 20,
        tipoProducto: 'ALIMENTO',
        unidad: 'UNIDAD',
        etiquetas: ['refresco', 'cola', 'bebida', 'comida rápida'],
        estado: 'ACTIVO'
      },
      {
        nombre: 'Refresco Naranja',
        descripcion: 'Refresco de naranja 500ml',
        precioCompra: 8.00,
        precioVenta: 25.00,
        stock: 90,
        stockMinimo: 18,
        tipoProducto: 'ALIMENTO',
        unidad: 'UNIDAD',
        etiquetas: ['refresco', 'naranja', 'bebida', 'comida rápida'],
        estado: 'ACTIVO'
      },
      {
        nombre: 'Agua Mineral',
        descripcion: 'Agua mineral natural 500ml',
        precioCompra: 5.00,
        precioVenta: 20.00,
        stock: 120,
        stockMinimo: 25,
        tipoProducto: 'ALIMENTO',
        unidad: 'UNIDAD',
        etiquetas: ['agua', 'mineral', 'bebida', 'saludable'],
        estado: 'ACTIVO'
      },
      {
        nombre: 'Limonada Natural',
        descripcion: 'Limonada natural preparada',
        precioCompra: 6.00,
        precioVenta: 30.00,
        stock: 50,
        stockMinimo: 10,
        tipoProducto: 'ALIMENTO',
        unidad: 'UNIDAD',
        etiquetas: ['limonada', 'natural', 'bebida', 'saludable'],
        estado: 'ACTIVO'
      },

      // POSTRES
      {
        nombre: 'Helado de Vainilla',
        descripcion: 'Helado de vainilla con toppings',
        precioCompra: 12.00,
        precioVenta: 45.00,
        stock: 40,
        stockMinimo: 8,
        tipoProducto: 'ALIMENTO',
        unidad: 'UNIDAD',
        etiquetas: ['helado', 'vainilla', 'postre', 'dulce'],
        estado: 'ACTIVO'
      },
      {
        nombre: 'Brownie Casero',
        descripcion: 'Brownie de chocolate casero',
        precioCompra: 8.00,
        precioVenta: 35.00,
        stock: 30,
        stockMinimo: 6,
        tipoProducto: 'ALIMENTO',
        unidad: 'UNIDAD',
        etiquetas: ['brownie', 'chocolate', 'postre', 'dulce'],
        estado: 'ACTIVO'
      },

      // INGREDIENTES
      {
        nombre: 'Carne de Res Premium',
        descripcion: 'Carne de res premium para hamburguesas',
        precioCompra: 120.00,
        precioVenta: 180.00,
        stock: 25,
        stockMinimo: 5,
        tipoProducto: 'ALIMENTO',
        unidad: 'KILO',
        etiquetas: ['carne', 'res', 'premium', 'ingrediente'],
        estado: 'ACTIVO'
      },
      {
        nombre: 'Queso Cheddar',
        descripcion: 'Queso cheddar para hamburguesas',
        precioCompra: 85.00,
        precioVenta: 130.00,
        stock: 15,
        stockMinimo: 3,
        tipoProducto: 'ALIMENTO',
        unidad: 'KILO',
        etiquetas: ['queso', 'cheddar', 'ingrediente', 'lácteo'],
        estado: 'ACTIVO'
      },
      {
        nombre: 'Pan de Hamburguesa',
        descripcion: 'Pan brioche para hamburguesas',
        precioCompra: 45.00,
        precioVenta: 75.00,
        stock: 60,
        stockMinimo: 12,
        tipoProducto: 'ALIMENTO',
        unidad: 'PAQUETE',
        etiquetas: ['pan', 'brioche', 'ingrediente', 'horneado'],
        estado: 'ACTIVO'
      },
      {
        nombre: 'Lechuga Fresca',
        descripcion: 'Lechuga fresca para hamburguesas',
        precioCompra: 25.00,
        precioVenta: 40.00,
        stock: 20,
        stockMinimo: 4,
        tipoProducto: 'ALIMENTO',
        unidad: 'KILO',
        etiquetas: ['lechuga', 'fresca', 'ingrediente', 'vegetal'],
        estado: 'ACTIVO'
      },
      {
        nombre: 'Tomates Frescos',
        descripcion: 'Tomates frescos para hamburguesas',
        precioCompra: 30.00,
        precioVenta: 50.00,
        stock: 18,
        stockMinimo: 4,
        tipoProducto: 'ALIMENTO',
        unidad: 'KILO',
        etiquetas: ['tomates', 'frescos', 'ingrediente', 'vegetal'],
        estado: 'ACTIVO'
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
      'Hamburguesa Clásica': 'Carnes Premium del Norte',
      'Hamburguesa Doble Queso': 'Carnes Premium del Norte',
      'Hamburguesa BBQ': 'Carnes Premium del Norte',
      'Hamburguesa Vegetariana': 'Verduras Frescas del Valle',
      'Papas Fritas': 'Verduras Frescas del Valle',
      'Aros de Cebolla': 'Verduras Frescas del Valle',
      'Nuggets de Pollo': 'Carnes Premium del Norte',
      'Refresco Cola': 'Bebidas y Refrescos Central',
      'Refresco Naranja': 'Bebidas y Refrescos Central',
      'Agua Mineral': 'Bebidas y Refrescos Central',
      'Limonada Natural': 'Verduras Frescas del Valle',
      'Helado de Vainilla': 'Distribuidora de Lácteos Express',
      'Brownie Casero': 'Panadería Artesanal',
      'Carne de Res Premium': 'Carnes Premium del Norte',
      'Queso Cheddar': 'Distribuidora de Lácteos Express',
      'Pan de Hamburguesa': 'Panadería Artesanal',
      'Lechuga Fresca': 'Verduras Frescas del Valle',
      'Tomates Frescos': 'Verduras Frescas del Valle'
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
    for (let i = 0; i < 80; i++) {
      const producto = productosCreados[Math.floor(Math.random() * productosCreados.length)];
      
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - Math.floor(Math.random() * 90));
      
      const cantidad = Math.floor(Math.random() * 20) + 5;
      
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
    for (let i = 0; i < 120; i++) {
      const producto = productosCreados[Math.floor(Math.random() * productosCreados.length)];
      
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - Math.floor(Math.random() * 90));
      
      const cantidad = Math.floor(Math.random() * 8) + 1;
      
      await prisma.movimientoInventario.create({
        data: {
          tipo: 'SALIDA',
          cantidad: cantidad,
          motivo: 'Venta al cliente',
          empresaId: empresa.id,
          productoId: producto.id,
          createdAt: fecha
        }
      });
    }

    // 7. Crear pedidos a proveedores
    console.log('\n📋 Creando pedidos a proveedores...');
    
    for (let i = 0; i < 12; i++) {
      const proveedor = proveedoresCreados[Math.floor(Math.random() * proveedoresCreados.length)];
      const producto = productosCreados[Math.floor(Math.random() * productosCreados.length)];
      
      const fechaPedido = new Date();
      fechaPedido.setDate(fechaPedido.getDate() - Math.floor(Math.random() * 60));
      
      const estado = Math.random() > 0.2 ? 'RECIBIDO' : 'PENDIENTE';
      const cantidad = Math.floor(Math.random() * 40) + 10;
      
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

    console.log('\n🎉 Datos de restaurante generados exitosamente!');
    console.log('==================================================');
    console.log(`🍔 Empresa: ${empresa.nombre}`);
    console.log(`👤 Usuario: ${user.email}`);
    console.log(`💼 Productos: ${productosCreados.length}`);
    console.log(`🏭 Proveedores: ${proveedoresCreados.length}`);
    console.log(`📊 Movimientos: 200`);
    console.log(`📋 Pedidos: 12`);
    console.log('\n✅ Categorías implementadas:');
    console.log('   🍔 Hamburguesas - 4 productos');
    console.log('   🍟 Acompañamientos - 3 productos');
    console.log('   🥤 Bebidas - 4 productos');
    console.log('   🍰 Postres - 2 productos');
    console.log('   🥬 Ingredientes - 5 productos');

  } catch (error) {
    console.error('❌ Error generando datos de restaurante:', error);
  } finally {
    await prisma.$disconnect();
  }
}

generateRestaurantData(); 