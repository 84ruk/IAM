const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function generatePharmacyData() {
  try {
    console.log('💊 Generando datos para farmacia...\n');

    // 1. Verificar si el usuario existe
    let user = await prisma.usuario.findUnique({
      where: { email: 'prueba2@iam.com' }
    });

    if (!user) {
      console.log('👤 Usuario no encontrado, creando cuenta...');
      
      // Crear usuario
      const hashedPassword = await bcrypt.hash('PruebaIAM123?', 10);
      user = await prisma.usuario.create({
        data: {
          email: 'prueba2@iam.com',
          password: hashedPassword,
          nombre: 'Farmacéutico',
          apellido: 'Prueba',
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
      console.log('🏥 Creando empresa farmacéutica...');
      
      empresa = await prisma.empresa.create({
        data: {
          nombre: 'Farmacia Salud Integral',
          industria: 'SALUD',
          direccion: 'Av. Principal 123, Centro',
          telefono: '+52 55 1234 5678',
          rfc: 'FSI250101ABC',
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

    // 3. Crear proveedores farmacéuticos
    console.log('\n🏭 Creando proveedores farmacéuticos...');
    
    const proveedores = [
      {
        nombre: 'Laboratorios Pfizer México',
        telefono: '+52 55 5678 9012',
        email: 'contacto@pfizer.com.mx',
        estado: 'ACTIVO'
      },
      {
        nombre: 'Roche Farmacéutica',
        telefono: '+52 55 2345 6789',
        email: 'ventas@roche.com.mx',
        estado: 'ACTIVO'
      },
      {
        nombre: 'Bayer de México',
        telefono: '+52 55 3456 7890',
        email: 'info@bayer.com.mx',
        estado: 'ACTIVO'
      },
      {
        nombre: 'Distribuidora Médica del Norte',
        telefono: '+52 81 1234 5678',
        email: 'ventas@dmn.com.mx',
        estado: 'ACTIVO'
      },
      {
        nombre: 'Suministros Médicos Express',
        telefono: '+52 33 9876 5432',
        email: 'pedidos@sme.com.mx',
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

    // 4. Crear productos farmacéuticos
    console.log('\n💊 Creando productos farmacéuticos...');
    
    const productos = [
      // Medicamentos de venta libre
      {
        nombre: 'Paracetamol 500mg',
        descripcion: 'Analgésico y antipirético',
        precioCompra: 45.00,
        precioVenta: 85.00,
        stock: 150,
        stockMinimo: 20,
        tipoProducto: 'GENERICO',
        unidadProducto: 'CAJA',
        etiquetas: ['analgésico', 'venta libre', 'fiebre'],
        estado: 'ACTIVO'
      },
      {
        nombre: 'Ibuprofeno 400mg',
        descripcion: 'Antiinflamatorio no esteroideo',
        precioCompra: 52.00,
        precioVenta: 95.00,
        stock: 120,
        stockMinimo: 15,
        tipoProducto: 'GENERICO',
        unidadProducto: 'CAJA',
        etiquetas: ['antiinflamatorio', 'venta libre', 'dolor'],
        estado: 'ACTIVO'
      },
      {
        nombre: 'Aspirina 100mg',
        descripcion: 'Ácido acetilsalicílico',
        precioCompra: 38.00,
        precioVenta: 75.00,
        stock: 200,
        stockMinimo: 25,
        tipoProducto: 'GENERICO',
        unidadProducto: 'CAJA',
        etiquetas: ['analgésico', 'venta libre', 'cardioprotector'],
        estado: 'ACTIVO'
      },
      {
        nombre: 'Omeprazol 20mg',
        descripcion: 'Protector gástrico',
        precioCompra: 120.00,
        precioVenta: 180.00,
        stock: 80,
        stockMinimo: 10,
        tipoProducto: 'GENERICO',
        unidadProducto: 'CAJA',
        etiquetas: ['protector gástrico', 'venta libre', 'acidez'],
        estado: 'ACTIVO'
      },
      {
        nombre: 'Loratadina 10mg',
        descripcion: 'Antialérgico',
        precioCompra: 85.00,
        precioVenta: 140.00,
        stock: 95,
        stockMinimo: 12,
        tipoProducto: 'GENERICO',
        unidadProducto: 'CAJA',
        etiquetas: ['antialérgico', 'venta libre', 'alergias'],
        estado: 'ACTIVO'
      },
      // Medicamentos controlados
      {
        nombre: 'Tramadol 50mg',
        descripcion: 'Analgésico opioide',
        precioCompra: 180.00,
        precioVenta: 280.00,
        stock: 45,
        stockMinimo: 8,
        tipoProducto: 'GENERICO',
        unidadProducto: 'CAJA',
        etiquetas: ['opioide', 'controlado', 'dolor severo'],
        estado: 'ACTIVO'
      },
      {
        nombre: 'Diazepam 5mg',
        descripcion: 'Ansiolítico',
        precioCompra: 95.00,
        precioVenta: 160.00,
        stock: 60,
        stockMinimo: 10,
        tipoProducto: 'GENERICO',
        unidadProducto: 'CAJA',
        etiquetas: ['ansiolítico', 'controlado', 'ansiedad'],
        estado: 'ACTIVO'
      },
      {
        nombre: 'Morfina 10mg',
        descripcion: 'Analgésico opioide fuerte',
        precioCompra: 350.00,
        precioVenta: 520.00,
        stock: 25,
        stockMinimo: 5,
        tipoProducto: 'GENERICO',
        unidadProducto: 'CAJA',
        etiquetas: ['opioide', 'controlado', 'dolor crónico'],
        estado: 'ACTIVO'
      },
      // Vitaminas y suplementos
      {
        nombre: 'Vitamina C 1000mg',
        descripcion: 'Suplemento vitamínico',
        precioCompra: 65.00,
        precioVenta: 110.00,
        stock: 180,
        stockMinimo: 20,
        tipoProducto: 'GENERICO',
        unidadProducto: 'UNIDAD',
        etiquetas: ['vitamina', 'inmunidad', 'antioxidante'],
        estado: 'ACTIVO'
      },
      {
        nombre: 'Vitamina D3 4000UI',
        descripcion: 'Vitamina D de alta potencia',
        precioCompra: 95.00,
        precioVenta: 160.00,
        stock: 140,
        stockMinimo: 15,
        tipoProducto: 'GENERICO',
        unidadProducto: 'UNIDAD',
        etiquetas: ['vitamina', 'huesos', 'inmunidad'],
        estado: 'ACTIVO'
      },
      {
        nombre: 'Omega 3 1000mg',
        descripcion: 'Ácidos grasos esenciales',
        precioCompra: 120.00,
        precioVenta: 190.00,
        stock: 110,
        stockMinimo: 12,
        tipoProducto: 'GENERICO',
        unidadProducto: 'UNIDAD',
        etiquetas: ['omega 3', 'corazón', 'cerebro'],
        estado: 'ACTIVO'
      },
      {
        nombre: 'Magnesio 400mg',
        descripcion: 'Mineral esencial',
        precioCompra: 75.00,
        precioVenta: 130.00,
        stock: 160,
        stockMinimo: 18,
        tipoProducto: 'GENERICO',
        unidadProducto: 'UNIDAD',
        etiquetas: ['magnesio', 'músculos', 'relajación'],
        estado: 'ACTIVO'
      },
      // Equipos médicos
      {
        nombre: 'Tensiómetro Digital',
        descripcion: 'Medidor de presión arterial',
        precioCompra: 450.00,
        precioVenta: 680.00,
        stock: 35,
        stockMinimo: 5,
        tipoProducto: 'ELECTRONICO',
        unidadProducto: 'UNIDAD',
        etiquetas: ['tensiómetro', 'presión arterial', 'digital'],
        estado: 'ACTIVO'
      },
      {
        nombre: 'Glucómetro Accu-Chek',
        descripcion: 'Medidor de glucosa en sangre',
        precioCompra: 380.00,
        precioVenta: 580.00,
        stock: 42,
        stockMinimo: 6,
        tipoProducto: 'ELECTRONICO',
        unidadProducto: 'UNIDAD',
        etiquetas: ['glucómetro', 'diabetes', 'glucosa'],
        estado: 'ACTIVO'
      },
      {
        nombre: 'Termómetro Digital',
        descripcion: 'Termómetro infrarrojo',
        precioCompra: 280.00,
        precioVenta: 420.00,
        stock: 55,
        stockMinimo: 8,
        tipoProducto: 'ELECTRONICO',
        unidadProducto: 'UNIDAD',
        etiquetas: ['termómetro', 'fiebre', 'infrarrojo'],
        estado: 'ACTIVO'
      },
      {
        nombre: 'Nebulizador Portátil',
        descripcion: 'Nebulizador para asma',
        precioCompra: 650.00,
        precioVenta: 950.00,
        stock: 28,
        stockMinimo: 4,
        tipoProducto: 'ELECTRONICO',
        unidadProducto: 'UNIDAD',
        etiquetas: ['nebulizador', 'asma', 'respiratorio'],
        estado: 'ACTIVO'
      },
      // Productos de cuidado personal
      {
        nombre: 'Jabón Antibacterial',
        descripcion: 'Jabón líquido antibacterial',
        precioCompra: 25.00,
        precioVenta: 45.00,
        stock: 200,
        stockMinimo: 30,
        tipoProducto: 'GENERICO',
        unidadProducto: 'UNIDAD',
        etiquetas: ['antibacterial', 'higiene', 'limpieza'],
        estado: 'ACTIVO'
      },
      {
        nombre: 'Alcohol en Gel 70%',
        descripcion: 'Desinfectante de manos',
        precioCompra: 35.00,
        precioVenta: 65.00,
        stock: 180,
        stockMinimo: 25,
        tipoProducto: 'GENERICO',
        unidadProducto: 'UNIDAD',
        etiquetas: ['alcohol', 'desinfectante', 'manos'],
        estado: 'ACTIVO'
      },
      {
        nombre: 'Cubrebocas KN95',
        descripcion: 'Mascarilla de protección',
        precioCompra: 15.00,
        precioVenta: 35.00,
        stock: 500,
        stockMinimo: 50,
        tipoProducto: 'GENERICO',
        unidadProducto: 'PAQUETE',
        etiquetas: ['cubrebocas', 'protección', 'respiratorio'],
        estado: 'ACTIVO'
      },
      {
        nombre: 'Toallas Húmedas',
        descripcion: 'Toallas húmedas para bebés',
        precioCompra: 45.00,
        precioVenta: 75.00,
        stock: 120,
        stockMinimo: 15,
        tipoProducto: 'CUIDADO_PERSONAL',
        unidadProducto: 'PAQUETE',
        etiquetas: ['toallas', 'bebés', 'higiene'],
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
        console.log(`✅ Producto creado: ${productoData.nombre}`);
      } else {
        console.log(`⏭️  Producto ya existe: ${productoData.nombre}`);
      }
    }

    // 5. Crear movimientos de inventario
    console.log('\n📊 Creando movimientos de inventario...');
    
    const productosCreados = await prisma.producto.findMany({
      where: { empresaId: empresa.id }
    });

    const proveedoresCreados = await prisma.proveedor.findMany({
      where: { empresaId: empresa.id }
    });

    // Generar movimientos de entrada (compras)
    for (let i = 0; i < 120; i++) {
      const producto = productosCreados[Math.floor(Math.random() * productosCreados.length)];
      const proveedor = proveedoresCreados[Math.floor(Math.random() * proveedoresCreados.length)];
      
      // Fechas variadas en los últimos 3 meses
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - Math.floor(Math.random() * 90));
      
      const cantidad = Math.floor(Math.random() * 20) + 5; // 5-25 unidades
      
      await prisma.movimientoInventario.create({
        data: {
          tipo: 'ENTRADA',
          cantidad: cantidad,
          motivo: 'Compra a proveedor',
          empresaId: empresa.id,
          productoId: producto.id,
          proveedorId: proveedor.id,
          createdAt: fecha
        }
      });
    }

    // Generar movimientos de salida (ventas)
    for (let i = 0; i < 150; i++) {
      const producto = productosCreados[Math.floor(Math.random() * productosCreados.length)];
      
      // Fechas variadas en los últimos 3 meses
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - Math.floor(Math.random() * 90));
      
      const cantidad = Math.floor(Math.random() * 8) + 1; // 1-8 unidades
      
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

    // 6. Crear pedidos a proveedores
    console.log('\n📋 Creando pedidos a proveedores...');
    
    for (let i = 0; i < 8; i++) {
      const proveedor = proveedoresCreados[Math.floor(Math.random() * proveedoresCreados.length)];
      
      // Fechas variadas
      const fechaPedido = new Date();
      fechaPedido.setDate(fechaPedido.getDate() - Math.floor(Math.random() * 60));
      
      const fechaEntrega = new Date(fechaPedido);
      fechaEntrega.setDate(fechaEntrega.getDate() + Math.floor(Math.random() * 14) + 3);
      
      const estado = Math.random() > 0.3 ? 'ENTREGADO' : 'PENDIENTE';
      
      await prisma.pedido.create({
        data: {
          fechaPedido: fechaPedido,
          fechaEntrega: estado === 'ENTREGADO' ? fechaEntrega : null,
          estado: estado,
          total: Math.floor(Math.random() * 5000) + 1000,
          empresaId: empresa.id,
          proveedorId: proveedor.id
        }
      });
    }

    // 7. Actualizar stocks basado en movimientos
    console.log('\n🔄 Actualizando stocks...');
    
    const movimientos = await prisma.movimientoInventario.findMany({
      where: { empresaId: empresa.id },
      include: { producto: true }
    });

    for (const movimiento of movimientos) {
      if (movimiento.tipo === 'ENTRADA') {
        await prisma.producto.update({
          where: { id: movimiento.productoId },
          data: {
            stock: {
              increment: movimiento.cantidad
            }
          }
        });
      } else if (movimiento.tipo === 'SALIDA') {
        await prisma.producto.update({
          where: { id: movimiento.productoId },
          data: {
            stock: {
              decrement: movimiento.cantidad
            }
          }
        });
      }
    }

    console.log('\n🎉 Datos de farmacia generados exitosamente!');
    console.log('=============================================');
    console.log(`🏥 Empresa: ${empresa.nombre}`);
    console.log(`👤 Usuario: ${user.email}`);
    console.log(`💊 Productos: ${productosCreados.length}`);
    console.log(`🏭 Proveedores: ${proveedoresCreados.length}`);
    console.log(`📊 Movimientos: ${movimientos.length}`);
    console.log(`📋 Pedidos: 8`);

  } catch (error) {
    console.error('❌ Error generando datos de farmacia:', error);
  } finally {
    await prisma.$disconnect();
  }
}

generatePharmacyData(); 