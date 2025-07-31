const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

async function crearArchivoMovimientosCorrecto() {
  try {
    console.log('📝 Creando archivo de movimientos con datos correctos...\n');

    // Primero obtener productos existentes para usar IDs válidos
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const productos = await prisma.producto.findMany({
      where: {
        empresaId: 14,
        estado: 'ACTIVO',
      },
      select: {
        id: true,
        nombre: true,
      },
      take: 5,
    });

    await prisma.$disconnect();

    if (productos.length === 0) {
      console.log('❌ No hay productos disponibles para crear movimientos');
      return;
    }

    console.log(`📦 Productos disponibles:`);
    productos.forEach((producto, index) => {
      console.log(`${index + 1}. ID: ${producto.id} - ${producto.nombre}`);
    });

    // Crear datos de movimientos con IDs válidos
    const datosMovimientos = [
      {
        tipo: 'entrada',
        productoid: productos[0].id, // Usar ID real
        cantidad: 10,
        descripcion: 'Compra de productos',
        motivo: 'Reabastecimiento',
        fecha: '2024-01-15',
        empresaid: 14,
        createdat: '2024-01-15T10:00:00Z'
      },
      {
        tipo: 'salida',
        productoid: productos[1].id, // Usar ID real
        cantidad: 5,
        descripcion: 'Venta de productos',
        motivo: 'Venta directa',
        fecha: '2024-01-16',
        empresaid: 14,
        createdat: '2024-01-16T14:30:00Z'
      },
      {
        tipo: 'entrada',
        productoid: productos[2].id, // Usar ID real
        cantidad: 15,
        descripcion: 'Devolución de productos',
        motivo: 'Devolución cliente',
        fecha: '2024-01-17',
        empresaid: 14,
        createdat: '2024-01-17T09:15:00Z'
      }
    ];

    // Crear workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(datosMovimientos);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Movimientos');

    const fileName = 'plantilla-movimientos-correctos.xlsx';
    const filePath = path.join(__dirname, fileName);
    
    XLSX.writeFile(workbook, filePath);
    
    console.log(`✅ Archivo creado: ${filePath}`);
    console.log(`📊 Datos incluidos:`);
    datosMovimientos.forEach((movimiento, index) => {
      const producto = productos.find(p => p.id === movimiento.productoid);
      console.log(`${index + 1}. ${movimiento.tipo.toUpperCase()} - ${producto?.nombre} (ID: ${movimiento.productoid}) - Cantidad: ${movimiento.cantidad}`);
    });

    console.log(`\n🎯 Este archivo debería importarse correctamente sin errores.`);

  } catch (error) {
    console.error('❌ Error creando archivo:', error);
  }
}

// Ejecutar la creación
crearArchivoMovimientosCorrecto(); 