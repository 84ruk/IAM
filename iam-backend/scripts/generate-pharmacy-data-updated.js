const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function generatePharmacyDataUpdated() {
  try {
    console.log('💊 Generando datos actualizados para farmacia...\n');

    // 1. Verificar si el usuario existe
    let user = await prisma.usuario.findUnique({
      where: { email: 'prueba2@iam.com' }
    });

    if (!user) {
      console.log('👤 Usuario no encontrado, creando cuenta...');
      
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
          industria: 'FARMACIA',
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

    // 4. Crear productos farmacéuticos con tipos correctos
    console.log('\n💊 Creando productos farmacéuticos con tipos específicos...');
    
    const productos = [
      // MEDICAMENTOS
      {
        nombre: 'Paracetamol 500mg',
        descripcion: 'Analgésico y antipirético',
        precioCompra: 45.00,
        precioVenta: 85.00,
        stock: 150,
        stockMinimo: 20,
        tipoProducto: 'MEDICAMENTO',
        unidad: 'CAJA',
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
        tipoProducto: 'MEDICAMENTO',
        unidad: 'CAJA',
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
        tipoProducto: 'MEDICAMENTO',
        unidad: 'CAJA',
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
        tipoProducto: 'MEDICAMENTO',
        unidad: 'CAJA',
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
        tipoProducto: 'MEDICAMENTO',
        unidad: 'CAJA',
        etiquetas: ['antialérgico', 'venta libre', 'alergias'],
        estado: 'ACTIVO'
      },
      {
        nombre: 'Tramadol 50mg',
        descripcion: 'Analgésico opioide',
        precioCompra: 180.00,
        precioVenta: 280.00,
        stock: 45,
        stockMinimo: 8,
        tipoProducto: 'MEDICAMENTO',
        unidad: 'CAJA',
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
        tipoProducto: 'MEDICAMENTO',
        unidad: 'CAJA',
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
        tipoProducto: 'MEDICAMENTO',
        unidad: 'CAJA',
        etiquetas: ['opioide', 'controlado', 'dolor crónico'],
        estado: 'ACTIVO'
      },
      // SUPLEMENTOS
      {
        nombre: 'Vitamina C 1000mg',
        descripcion: 'Suplemento vitamínico',
        precioCompra: 65.00,
        precioVenta: 110.00,
        stock: 180,
        stockMinimo: 20,
        tipoProducto: 'SUPLEMENTO',
        unidad: 'UNIDAD',
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
        tipoProducto: 'SUPLEMENTO',
        unidad: 'UNIDAD',
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
        tipoProducto: 'SUPLEMENTO',
        unidad: 'UNIDAD',
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
        tipoProducto: 'SUPLEMENTO',
        unidad: 'UNIDAD',
        etiquetas: ['magnesio', 'músculos', 'relajación'],
        estado: 'ACTIVO'
      },
      // EQUIPOS MÉDICOS
      {
        nombre: 'Tensiómetro Digital',
        descripcion: 'Medidor de presión arterial',
        precioCompra: 450.00,
        precioVenta: 680.00,
        stock: 35,
        stockMinimo: 5,
        tipoProducto: 'EQUIPO_MEDICO',
        unidad: 'UNIDAD',
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
        tipoProducto: 'EQUIPO_MEDICO',
        unidad: 'UNIDAD',
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
        tipoProducto: 'EQUIPO_MEDICO',
        unidad: 'UNIDAD',
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
        tipoProducto: 'EQUIPO_MEDICO',
        unidad: 'UNIDAD',
        etiquetas: ['nebulizador', 'asma', 'respiratorio'],
        estado: 'ACTIVO'
      },
      // CUIDADO PERSONAL
      {
        nombre: 'Jabón Antibacterial',
        descripcion: 'Jabón líquido antibacterial',
        precioCompra: 25.00,
        precioVenta: 45.00,
        stock: 200,
        stockMinimo: 30,
        tipoProducto: 'CUIDADO_PERSONAL',
        unidad: 'UNIDAD',
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
        tipoProducto: 'CUIDADO_PERSONAL',
        unidad: 'UNIDAD',
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
        tipoProducto: 'CUIDADO_PERSONAL',
        unidad: 'PAQUETE',
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
        unidad: 'PAQUETE',
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
        console.log(`✅ Producto creado: ${productoData.nombre} (${productoData.tipoProducto})`);
      } else {
        // Actualizar el tipo de producto si es necesario
        if (existingProducto.tipoProducto !== productoData.tipoProducto) {
          await prisma.producto.update({
            where: { id: existingProducto.id },
            data: { tipoProducto: productoData.tipoProducto }
          });
          console.log(`🔄 Producto actualizado: ${productoData.nombre} → ${productoData.tipoProducto}`);
        } else {
          console.log(`⏭️  Producto ya existe: ${productoData.nombre} (${productoData.tipoProducto})`);
        }
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
    for (let i = 0; i < 80; i++) {
      const producto = productosCreados[Math.floor(Math.random() * productosCreados.length)];
      const proveedor = proveedoresCreados[Math.floor(Math.random() * proveedoresCreados.length)];
      
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
    for (let i = 0; i < 100; i++) {
      const producto = productosCreados[Math.floor(Math.random() * productosCreados.length)];
      
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - Math.floor(Math.random() * 90));
      
      const cantidad = Math.floor(Math.random() * 8) + 1;
      
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
    
    for (let i = 0; i < 6; i++) {
      const proveedor = proveedoresCreados[Math.floor(Math.random() * proveedoresCreados.length)];
      const producto = productosCreados[Math.floor(Math.random() * productosCreados.length)];
      
      const fechaPedido = new Date();
      fechaPedido.setDate(fechaPedido.getDate() - Math.floor(Math.random() * 60));
      
      const fechaEntrega = new Date(fechaPedido);
      fechaEntrega.setDate(fechaEntrega.getDate() + Math.floor(Math.random() * 14) + 3);
      
      const estado = Math.random() > 0.3 ? 'RECIBIDO' : 'PENDIENTE';
      const cantidad = Math.floor(Math.random() * 50) + 10;
      
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

    console.log('\n🎉 Datos de farmacia actualizados exitosamente!');
    console.log('================================================');
    console.log(`🏥 Empresa: ${empresa.nombre}`);
    console.log(`👤 Usuario: ${user.email}`);
    console.log(`💊 Productos: ${productosCreados.length}`);
    console.log(`🏭 Proveedores: ${proveedoresCreados.length}`);
    console.log(`📊 Movimientos: 180`);
    console.log(`📋 Pedidos: 6`);
    console.log('\n✅ Tipos de producto específicos implementados:');
    console.log('   🔒 MEDICAMENTO - 8 productos');
    console.log('   💊 SUPLEMENTO - 4 productos');
    console.log('   🏥 EQUIPO_MEDICO - 4 productos');
    console.log('   🧴 CUIDADO_PERSONAL - 4 productos');

  } catch (error) {
    console.error('❌ Error generando datos de farmacia:', error);
  } finally {
    await prisma.$disconnect();
  }
}

generatePharmacyDataUpdated(); 