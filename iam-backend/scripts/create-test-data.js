const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestData() {
  console.log('🚀 Creando datos de prueba para el sistema de sensores...\n');

  try {
    // 1. Crear empresa de prueba
    console.log('1️⃣ Creando empresa de prueba...');
    const empresa = await prisma.empresa.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        nombre: 'Empresa Test Sensores',
        rfc: 'TEST123456789',
        emailContacto: 'test@sensores.com',
        direccion: 'Dirección de prueba',
        TipoIndustria: 'GENERICA'
      }
    });
    console.log(`✅ Empresa creada: ${empresa.nombre} (ID: ${empresa.id})\n`);

    // 2. Crear usuario admin
    console.log('2️⃣ Creando usuario admin...');
    const usuario = await prisma.usuario.upsert({
      where: { email: 'admin@test.com' },
      update: {},
      create: {
        nombre: 'Admin Test',
        email: 'admin@test.com',
        password: '$2b$10$rQZ8K9vL8mN7jK6hG5fD2sA1qW3eR4tY6uI7oP8a9b0c1d2e3f4g5h6i7j8k9l0m1n2o3p4q5r6s7t8u9v0w1x2y3z', // admin123
        rol: 'ADMIN',
        empresaId: empresa.id,
        activo: true,
        setupCompletado: true
      }
    });
    console.log(`✅ Usuario creado: ${usuario.nombre} (ID: ${usuario.id})\n`);

    // 3. Crear ubicación de prueba
    console.log('3️⃣ Creando ubicación de prueba...');
    const ubicacion = await prisma.ubicacion.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        nombre: 'Almacén Principal',
        descripcion: 'Ubicación principal para testing de sensores',
        empresaId: empresa.id,
        activa: true
      }
    });
    console.log(`✅ Ubicación creada: ${ubicacion.nombre} (ID: ${ubicacion.id})\n`);

    // 4. Crear producto de prueba
    console.log('4️⃣ Creando producto de prueba...');
    const producto = await prisma.producto.upsert({
      where: { id: 1 },
      update: {},
      create: {
        nombre: 'Producto Test Sensor',
        descripcion: 'Producto para probar sensores',
        stock: 100,
        empresaId: empresa.id,
        precioCompra: 10.50,
        precioVenta: 15.00,
        stockMinimo: 10,
        tipoProducto: 'GENERICO',
        unidad: 'UNIDAD',
        estado: 'ACTIVO',
        etiquetas: ['test', 'sensor']
      }
    });
    console.log(`✅ Producto creado: ${producto.nombre} (ID: ${producto.id})\n`);

    // 5. Crear sensor de prueba
    console.log('5️⃣ Creando sensor de prueba...');
    const sensor = await prisma.sensor.upsert({
      where: { id: 1 },
      update: {},
      create: {
        nombre: 'Sensor Test Temperatura',
        tipo: 'TEMPERATURA',
        descripcion: 'Sensor de temperatura para testing',
        ubicacionId: ubicacion.id,
        empresaId: empresa.id,
        activo: true,
        configuracion: {
          unidad: '°C',
          rango_min: -20,
          rango_max: 50,
          precision: 0.1,
          intervalo_lectura: 30,
          umbral_alerta: 35,
          umbral_critico: 40
        }
      }
    });
    console.log(`✅ Sensor creado: ${sensor.nombre} (ID: ${sensor.id})\n`);

    // 6. Crear dispositivo IoT de prueba
    console.log('6️⃣ Creando dispositivo IoT de prueba...');
    const dispositivo = await prisma.dispositivoIoT.upsert({
      where: { deviceId: 'test-device-001' },
      update: {},
      create: {
        deviceId: 'test-device-001',
        deviceName: 'Dispositivo Test ESP32',
        nombre: 'ESP32 Test',
        tipo: 'ESP32',
        ubicacionId: ubicacion.id,
        empresaId: empresa.id,
        activo: true,
        apiToken: 'test-token-123',
        intervaloLecturas: 30000
      }
    });
    console.log(`✅ Dispositivo IoT creado: ${dispositivo.deviceName} (ID: ${dispositivo.id})\n`);

    console.log('🎉 Datos de prueba creados exitosamente!');
    console.log('\n📋 Resumen:');
    console.log(`   - Empresa: ${empresa.nombre} (ID: ${empresa.id})`);
    console.log(`   - Usuario: ${usuario.email} (password: admin123)`);
    console.log(`   - Ubicación: ${ubicacion.nombre} (ID: ${ubicacion.id})`);
    console.log(`   - Producto: ${producto.nombre} (ID: ${producto.id})`);
    console.log(`   - Sensor: ${sensor.nombre} (ID: ${sensor.id})`);
    console.log(`   - Dispositivo IoT: ${dispositivo.deviceName} (ID: ${dispositivo.id})`);

  } catch (error) {
    console.error('❌ Error creando datos de prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar script
createTestData();
