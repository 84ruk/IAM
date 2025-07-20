const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function generateMinisuperData() {
  try {
    console.log('🏪 Generando datos para minisúper...\n');

    // 1. Verificar si el usuario existe
    let user = await prisma.usuario.findUnique({
      where: { email: 'prueba2@iam.com' }
    });

    if (!user) {
      console.log('👤 Usuario no encontrado, creando cuenta...');
      
      const hashedPassword = await bcrypt.hash('PruebaIAM123!', 10);
      user = await prisma.usuario.create({
        data: {
          email: 'prueba2@iam.com',
          password: hashedPassword,
          nombre: 'Bara',
          apellido: 'Bara',
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
      console.log('🏪 Creando empresa de minisúper...');
      
      empresa = await prisma.empresa.create({
        data: {
          nombre: 'Bara Bara',
          TipoIndustria: 'ALIMENTOS',
          direccion: 'Calle Comercial 321, Colonia Centro',
          telefono: '+52 55 9876 5432',
          rfc: 'BB250101XYZ',
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

    // 3. Crear proveedores de productos básicos
    console.log('\n🏭 Creando proveedores de productos básicos...');
    
    const proveedores = [
      {
        nombre: 'Distribuidora de Alimentos Básicos',
        telefono: '+52 55 1234 5678',
        email: 'ventas@alimentosbasicos.com',
        estado: 'ACTIVO'
      },
      {
        nombre: 'Bebidas y Refrescos del Norte',
        telefono: '+52 81 2345 6789',
        email: 'pedidos@bebidasnorte.com',
        estado: 'ACTIVO'
      },
      {
        nombre: 'Lácteos y Derivados Express',
        telefono: '+52 33 3456 7890',
        email: 'contacto@lacteosexpress.com',
        estado: 'ACTIVO'
      },
      {
        nombre: 'Productos de Limpieza Central',
        telefono: '+52 55 4567 8901',
        email: 'ventas@limpiezacentral.com',
        estado: 'ACTIVO'
      },
      {
        nombre: 'Snacks y Golosinas Premium',
        telefono: '+52 55 5678 9012',
        email: 'pedidos@snackspremium.com',
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

    // 4. Crear productos del minisúper
    console.log('\n🏪 Creando productos del minisúper...');
    
    const productos = [
      // ALIMENTOS BÁSICOS
      {
        nombre: 'Arroz Blanco 1kg',
        descripcion: 'Arroz blanco de grano largo',
        precioCompra: 15.00,
        precioVenta: 25.00,
        stock: 100,
        stockMinimo: 20,
        tipoProducto: 'ALIMENTO',
        unidad: 'PAQUETE',
        etiquetas: ['arroz', 'básico', 'grano', 'hogar'],
        estado: 'ACTIVO'
      },
      {
        nombre: 'Frijoles Negros 500g',
        descripcion: 'Frijoles negros enlatados',
        precioCompra: 12.00,
        precioVenta: 20.00,
        stock: 80,
        stockMinimo: 15,
        tipoProducto: 'ALIMENTO',
        unidad: 'PAQUETE',
        etiquetas: ['frijoles', 'negros', 'enlatado', 'hogar'],
        estado: 'ACTIVO'
      },
      {
        nombre: 'Aceite de Cocina 1L',
        descripcion: 'Aceite vegetal para cocinar',
        precioCompra: 18.00,
        precioVenta: 28.00,
        stock: 60,
        stockMinimo: 12,
        tipoProducto: 'ALIMENTO',
        unidad: 'LITRO',
        etiquetas: ['aceite', 'cocina', 'vegetal', 'hogar'],
        estado: 'ACTIVO'
      },
      {
        nombre: 'Azúcar Refinada 1kg',
        descripcion: 'Azúcar blanca refinada',
        precioCompra: 14.00,
        precioVenta: 22.00,
        stock: 90,
        stockMinimo: 18,
        tipoProducto: 'ALIMENTO',
        unidad: 'PAQUETE',
        etiquetas: ['azúcar', 'refinada', 'dulce', 'hogar'],
        estado: 'ACTIVO'
      },
      {
        nombre: 'Harina de Trigo 1kg',
        descripcion: 'Harina de trigo para todo uso',
        precioCompra: 16.00,
        precioVenta: 24.00,
        stock: 75,
        stockMinimo: 15,
        tipoProducto: 'ALIMENTO',
        unidad: 'PAQUETE',
        etiquetas: ['harina', 'trigo', 'horneado', 'hogar'],
        estado: 'ACTIVO'
      },

      // BEBIDAS
      {
        nombre: 'Refresco Cola 2L',
        descripcion: 'Refresco de cola familiar',
        precioCompra: 12.00,
        precioVenta: 22.00,
        stock: 50,
        stockMinimo: 10,
        tipoProducto: 'ALIMENTO',
        unidad: 'LITRO',
        etiquetas: ['refresco', 'cola', 'bebida', 'familiar'],
        estado: 'ACTIVO'
      },
      {
        nombre: 'Jugo de Naranja 1L',
        descripcion: 'Jugo de naranja natural',
        precioCompra: 15.00,
        precioVenta: 25.00,
        stock: 40,
        stockMinimo: 8,
        tipoProducto: 'ALIMENTO',
        unidad: 'LITRO',
        etiquetas: ['jugo', 'naranja', 'natural', 'bebida'],
        estado: 'ACTIVO'
      },
      {
        nombre: 'Leche Entera 1L',
        descripcion: 'Leche entera pasteurizada',
        precioCompra: 18.00,
        precioVenta: 28.00,
        stock: 45,
        stockMinimo: 9,
        tipoProducto: 'ALIMENTO',
        unidad: 'LITRO',
        etiquetas: ['leche', 'entera', 'lácteo', 'bebida'],
        estado: 'ACTIVO'
      },
      {
        nombre: 'Agua Purificada 5L',
        descripcion: 'Agua purificada en garrafón',
        precioCompra: 8.00,
        precioVenta: 15.00,
        stock: 30,
        stockMinimo: 6,
        tipoProducto: 'ALIMENTO',
        unidad: 'LITRO',
        etiquetas: ['agua', 'purificada', 'bebida', 'saludable'],
        estado: 'ACTIVO'
      },

      // LÁCTEOS
      {
        nombre: 'Queso Manchego 250g',
        descripcion: 'Queso manchego rallado',
        precioCompra: 25.00,
        precioVenta: 38.00,
        stock: 35,
        stockMinimo: 7,
        tipoProducto: 'ALIMENTO',
        unidad: 'PAQUETE',
        etiquetas: ['queso', 'manchego', 'lácteo', 'rallado'],
        estado: 'ACTIVO'
      },
      {
        nombre: 'Yogurt Natural 500g',
        descripcion: 'Yogurt natural sin azúcar',
        precioCompra: 12.00,
        precioVenta: 20.00,
        stock: 40,
        stockMinimo: 8,
        tipoProducto: 'ALIMENTO',
        unidad: 'UNIDAD',
        etiquetas: ['yogurt', 'natural', 'lácteo', 'saludable'],
        estado: 'ACTIVO'
      },
      {
        nombre: 'Mantequilla 250g',
        descripcion: 'Mantequilla sin sal',
        precioCompra: 20.00,
        precioVenta: 32.00,
        stock: 25,
        stockMinimo: 5,
        tipoProducto: 'ALIMENTO',
        unidad: 'PAQUETE',
        etiquetas: ['mantequilla', 'lácteo', 'horneado', 'hogar'],
        estado: 'ACTIVO'
      },

      // SNACKS
      {
        nombre: 'Papas Fritas 150g',
        descripcion: 'Papas fritas sabor natural',
        precioCompra: 8.00,
        precioVenta: 15.00,
        stock: 80,
        stockMinimo: 16,
        tipoProducto: 'ALIMENTO',
        unidad: 'PAQUETE',
        etiquetas: ['papas', 'fritas', 'snack', 'botana'],
        estado: 'ACTIVO'
      },
      {
        nombre: 'Galletas María 200g',
        descripcion: 'Galletas María tradicionales',
        precioCompra: 6.00,
        precioVenta: 12.00,
        stock: 100,
        stockMinimo: 20,
        tipoProducto: 'ALIMENTO',
        unidad: 'PAQUETE',
        etiquetas: ['galletas', 'maría', 'snack', 'dulce'],
        estado: 'ACTIVO'
      },
      {
        nombre: 'Cacahuates 100g',
        descripcion: 'Cacahuates tostados con sal',
        precioCompra: 5.00,
        precioVenta: 10.00,
        stock: 120,
        stockMinimo: 24,
        tipoProducto: 'ALIMENTO',
        unidad: 'PAQUETE',
        etiquetas: ['cacahuates', 'tostados', 'snack', 'saludable'],
        estado: 'ACTIVO'
      },
      {
        nombre: 'Chocolate 100g',
        descripcion: 'Chocolate de leche',
        precioCompra: 8.00,
        precioVenta: 15.00,
        stock: 90,
        stockMinimo: 18,
        tipoProducto: 'ALIMENTO',
        unidad: 'PAQUETE',
        etiquetas: ['chocolate', 'leche', 'dulce', 'snack'],
        estado: 'ACTIVO'
      },

      // PRODUCTOS DE LIMPIEZA
      {
        nombre: 'Detergente Líquido 1L',
        descripcion: 'Detergente líquido para ropa',
        precioCompra: 25.00,
        precioVenta: 38.00,
        stock: 40,
        stockMinimo: 8,
        tipoProducto: 'GENERICO',
        unidad: 'LITRO',
        etiquetas: ['detergente', 'líquido', 'limpieza', 'ropa'],
        estado: 'ACTIVO'
      },
      {
        nombre: 'Jabón de Manos 500ml',
        descripcion: 'Jabón líquido para manos',
        precioCompra: 15.00,
        precioVenta: 25.00,
        stock: 60,
        stockMinimo: 12,
        tipoProducto: 'GENERICO',
        unidad: 'LITRO',
        etiquetas: ['jabón', 'manos', 'limpieza', 'higiene'],
        estado: 'ACTIVO'
      },
      {
        nombre: 'Papel Higiénico 4 rollos',
        descripcion: 'Papel higiénico suave',
        precioCompra: 12.00,
        precioVenta: 20.00,
        stock: 70,
        stockMinimo: 14,
        tipoProducto: 'GENERICO',
        unidad: 'PAQUETE',
        etiquetas: ['papel', 'higiénico', 'limpieza', 'hogar'],
        estado: 'ACTIVO'
      },
      {
        nombre: 'Servilletas 100 hojas',
        descripcion: 'Servilletas de papel',
        precioCompra: 8.00,
        precioVenta: 15.00,
        stock: 80,
        stockMinimo: 16,
        tipoProducto: 'GENERICO',
        unidad: 'PAQUETE',
        etiquetas: ['servilletas', 'papel', 'limpieza', 'hogar'],
        estado: 'ACTIVO'
      },

      // CONGELADOS
      {
        nombre: 'Pollo Entero 1.5kg',
        descripcion: 'Pollo entero congelado',
        precioCompra: 45.00,
        precioVenta: 65.00,
        stock: 20,
        stockMinimo: 4,
        tipoProducto: 'ALIMENTO',
        unidad: 'KILO',
        etiquetas: ['pollo', 'entero', 'congelado', 'carne'],
        estado: 'ACTIVO'
      },
      {
        nombre: 'Pescado Filete 500g',
        descripcion: 'Filete de pescado congelado',
        precioCompra: 35.00,
        precioVenta: 55.00,
        stock: 15,
        stockMinimo: 3,
        tipoProducto: 'ALIMENTO',
        unidad: 'PAQUETE',
        etiquetas: ['pescado', 'filete', 'congelado', 'marisco'],
        estado: 'ACTIVO'
      },
      {
        nombre: 'Verduras Mixtas 500g',
        descripcion: 'Mezcla de verduras congeladas',
        precioCompra: 18.00,
        precioVenta: 28.00,
        stock: 25,
        stockMinimo: 5,
        tipoProducto: 'ALIMENTO',
        unidad: 'PAQUETE',
        etiquetas: ['verduras', 'mixtas', 'congelado', 'saludable'],
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
      'Arroz Blanco 1kg': 'Distribuidora de Alimentos Básicos',
      'Frijoles Negros 500g': 'Distribuidora de Alimentos Básicos',
      'Aceite de Cocina 1L': 'Distribuidora de Alimentos Básicos',
      'Azúcar Refinada 1kg': 'Distribuidora de Alimentos Básicos',
      'Harina de Trigo 1kg': 'Distribuidora de Alimentos Básicos',
      'Refresco Cola 2L': 'Bebidas y Refrescos del Norte',
      'Jugo de Naranja 1L': 'Bebidas y Refrescos del Norte',
      'Leche Entera 1L': 'Lácteos y Derivados Express',
      'Agua Purificada 5L': 'Bebidas y Refrescos del Norte',
      'Queso Manchego 250g': 'Lácteos y Derivados Express',
      'Yogurt Natural 500g': 'Lácteos y Derivados Express',
      'Mantequilla 250g': 'Lácteos y Derivados Express',
      'Papas Fritas 150g': 'Snacks y Golosinas Premium',
      'Galletas María 200g': 'Snacks y Golosinas Premium',
      'Cacahuates 100g': 'Snacks y Golosinas Premium',
      'Chocolate 100g': 'Snacks y Golosinas Premium',
      'Detergente Líquido 1L': 'Productos de Limpieza Central',
      'Jabón de Manos 500ml': 'Productos de Limpieza Central',
      'Papel Higiénico 4 rollos': 'Productos de Limpieza Central',
      'Servilletas 100 hojas': 'Productos de Limpieza Central',
      'Pollo Entero 1.5kg': 'Distribuidora de Alimentos Básicos',
      'Pescado Filete 500g': 'Distribuidora de Alimentos Básicos',
      'Verduras Mixtas 500g': 'Distribuidora de Alimentos Básicos'
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
    for (let i = 0; i < 100; i++) {
      const producto = productosCreados[Math.floor(Math.random() * productosCreados.length)];
      
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - Math.floor(Math.random() * 90));
      
      const cantidad = Math.floor(Math.random() * 25) + 5;
      
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
    for (let i = 0; i < 150; i++) {
      const producto = productosCreados[Math.floor(Math.random() * productosCreados.length)];
      
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - Math.floor(Math.random() * 90));
      
      const cantidad = Math.floor(Math.random() * 10) + 1;
      
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
    
    for (let i = 0; i < 15; i++) {
      const proveedor = proveedoresCreados[Math.floor(Math.random() * proveedoresCreados.length)];
      const producto = productosCreados[Math.floor(Math.random() * productosCreados.length)];
      
      const fechaPedido = new Date();
      fechaPedido.setDate(fechaPedido.getDate() - Math.floor(Math.random() * 60));
      
      const estado = Math.random() > 0.15 ? 'RECIBIDO' : 'PENDIENTE';
      const cantidad = Math.floor(Math.random() * 50) + 15;
      
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

    console.log('\n🎉 Datos de minisúper generados exitosamente!');
    console.log('==================================================');
    console.log(`🏪 Empresa: ${empresa.nombre}`);
    console.log(`👤 Usuario: ${user.email}`);
    console.log(`💼 Productos: ${productosCreados.length}`);
    console.log(`🏭 Proveedores: ${proveedoresCreados.length}`);
    console.log(`📊 Movimientos: 250`);
    console.log(`📋 Pedidos: 15`);
    console.log('\n✅ Categorías implementadas:');
    console.log('   🍚 Alimentos Básicos - 5 productos');
    console.log('   🥤 Bebidas - 4 productos');
    console.log('   🥛 Lácteos - 3 productos');
    console.log('   🍿 Snacks - 4 productos');
    console.log('   🧽 Productos de Limpieza - 4 productos');
    console.log('   ❄️  Congelados - 3 productos');

  } catch (error) {
    console.error('❌ Error generando datos de minisúper:', error);
  } finally {
    await prisma.$disconnect();
  }
}

generateMinisuperData(); 