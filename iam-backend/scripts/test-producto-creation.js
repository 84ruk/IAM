const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testProductoCreation() {
  try {
    console.log('🧪 Probando creación de producto con precios diferentes...');
    
    // Datos de prueba para un producto con precios diferentes
    const productoTest = {
      nombre: 'Producto Test ' + Date.now(),
      descripcion: 'Producto para probar validación de precios',
      precioCompra: 100.00,
      precioVenta: 150.00, // 50% de margen
      stock: 10,
      stockMinimo: 5,
      unidad: 'UNIDAD',
      etiquetas: ['test', 'validacion'],
      tipoProducto: 'GENERICO',
      empresaId: 2 // ID de la empresa del token
    };

    console.log('📦 Datos del producto:', {
      nombre: productoTest.nombre,
      precioCompra: productoTest.precioCompra,
      precioVenta: productoTest.precioVenta,
      margen: ((productoTest.precioVenta - productoTest.precioCompra) / productoTest.precioCompra * 100).toFixed(2) + '%'
    });

    // Intentar crear el producto
    const productoCreado = await prisma.producto.create({
      data: productoTest
    });

    console.log('✅ Producto creado exitosamente!');
    console.log('🆔 ID del producto:', productoCreado.id);
    console.log('💰 Precio compra:', productoCreado.precioCompra);
    console.log('💰 Precio venta:', productoCreado.precioVenta);
    console.log('📊 Margen calculado:', ((productoCreado.precioVenta - productoCreado.precioCompra) / productoCreado.precioCompra * 100).toFixed(2) + '%');

    // Limpiar: eliminar el producto de prueba
    await prisma.producto.delete({
      where: { id: productoCreado.id }
    });
    console.log('🧹 Producto de prueba eliminado');

    return true;
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
    if (error.code === 'P2002') {
      console.error('💡 Error de duplicado - probablemente el nombre del producto ya existe');
    }
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

async function testAPIEndpoint() {
  try {
    console.log('\n🌐 Probando endpoint de creación via API...');
    
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NTQ1MjM4NjMsImp0aSI6ImE3ZDZkNzlhLTRmNGMtNDNhZS05ODA3LWM0YWMzOTMzMzU3ZSIsInN1YiI6IjEiLCJlbWFpbCI6ImJhcnVrMDY2QGdtYWlsLmNvbSIsInJvbCI6IkFETUlOIiwiZW1wcmVzYUlkIjoyLCJ0aXBvSW5kdXN0cmlhIjoiR0VORVJJQ0EiLCJhdXRoUHJvdmlkZXIiOiJnb29nbGUiLCJleHAiOjE3NTQ2MTAyNjMsImF1ZCI6Imh0dHA6Ly9sb2NhbGhvc3Q6MzAwMSIsImlzcyI6Imh0dHA6Ly9sb2NhbGhvc3Q6MzAwMSJ9.JItMTmjBWig28HcJuFglmHmR7hpSG4F2FPNKMP8yTS4';
    
    const productData = {
      nombre: 'API Test ' + Date.now(),
      descripcion: 'Producto test via API',
      precioCompra: 80.00,
      precioVenta: 120.00, // 50% margen
      stock: 15,
      stockMinimo: 3,
      unidad: 'UNIDAD',
      etiquetas: ['api', 'test'],
      tipoProducto: 'GENERICO'
    };

    console.log('📤 Enviando datos:', {
      nombre: productData.nombre,
      precioCompra: productData.precioCompra,
      precioVenta: productData.precioVenta,
      margen: ((productData.precioVenta - productData.precioCompra) / productData.precioCompra * 100).toFixed(2) + '%'
    });

    const response = await fetch('http://localhost:3001/productos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(productData)
    });

    if (response.ok) {
      const resultado = await response.json();
      console.log('✅ Producto creado via API exitosamente!');
      console.log('🆔 ID:', resultado.id);
      console.log('💰 Precios confirmados:', {
        compra: resultado.precioCompra,
        venta: resultado.precioVenta
      });

      // Limpiar
      const deleteResponse = await fetch(`http://localhost:3001/productos/${resultado.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (deleteResponse.ok) {
        console.log('🧹 Producto de prueba eliminado via API');
      }

      return true;
    } else {
      const errorData = await response.json();
      console.error('❌ Error en API:', response.status, errorData);
      return false;
    }
  } catch (error) {
    console.error('❌ Error conectando con API:', error.message);
    return false;
  }
}

// Ejecutar las pruebas
if (require.main === module) {
  (async () => {
    console.log('🚀 Iniciando pruebas de creación de productos...\n');
    
    const dbTest = await testProductoCreation();
    const apiTest = await testAPIEndpoint();
    
    console.log('\n📋 Resumen de pruebas:');
    console.log('DB directa:', dbTest ? '✅ PASS' : '❌ FAIL');
    console.log('API endpoint:', apiTest ? '✅ PASS' : '❌ FAIL');
    
    if (dbTest && apiTest) {
      console.log('\n🎉 ¡Todas las pruebas pasaron! El sistema permite precios diferentes correctamente.');
    } else {
      console.log('\n⚠️ Algunas pruebas fallaron. Revisar la configuración.');
    }
    
    process.exit(dbTest && apiTest ? 0 : 1);
  })();
}

module.exports = { testProductoCreation, testAPIEndpoint };
