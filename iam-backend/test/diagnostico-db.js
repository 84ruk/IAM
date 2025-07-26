// Script para diagnosticar problemas de base de datos
const { PrismaClient } = require('@prisma/client');

async function diagnosticarBaseDatos() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Iniciando diagnóstico de base de datos...\n');
    
    // 1. Probar conexión básica
    console.log('1️⃣ Probando conexión básica...');
    await prisma.$connect();
    console.log('✅ Conexión exitosa a la base de datos');
    
    // 2. Verificar tablas principales
    console.log('\n2️⃣ Verificando tablas principales...');
    
    // Verificar tabla usuarios
    try {
      const usuariosCount = await prisma.usuario.count();
      console.log(`✅ Tabla usuarios: ${usuariosCount} registros`);
    } catch (error) {
      console.log(`❌ Error en tabla usuarios: ${error.message}`);
    }
    
    // Verificar tabla productos
    try {
      const productosCount = await prisma.producto.count();
      console.log(`✅ Tabla productos: ${productosCount} registros`);
    } catch (error) {
      console.log(`❌ Error en tabla productos: ${error.message}`);
    }
    
    // Verificar tabla empresas
    try {
      const empresasCount = await prisma.empresa.count();
      console.log(`✅ Tabla empresas: ${empresasCount} registros`);
    } catch (error) {
      console.log(`❌ Error en tabla empresas: ${error.message}`);
    }
    
    // 3. Verificar empresa específica
    console.log('\n3️⃣ Verificando empresa de prueba...');
    try {
      const empresa = await prisma.empresa.findFirst({
        where: { usuarios: { some: { email: 'test@iam.com' } } },
        include: { usuarios: true }
      });
      
      if (empresa) {
        console.log(`✅ Empresa encontrada: ${empresa.nombre} (ID: ${empresa.id})`);
        console.log(`   Usuarios: ${empresa.usuarios.length}`);
        empresa.usuarios.forEach(user => {
          console.log(`   - ${user.email} (${user.rol})`);
        });
      } else {
        console.log('❌ No se encontró la empresa de prueba');
      }
    } catch (error) {
      console.log(`❌ Error verificando empresa: ${error.message}`);
    }
    
    // 4. Probar inserción de prueba
    console.log('\n4️⃣ Probando inserción de prueba...');
    try {
      const productoPrueba = await prisma.producto.create({
        data: {
          nombre: 'Producto de Prueba - Diagnóstico',
          descripcion: 'Producto temporal para verificar inserción',
          stock: 1,
          precioCompra: 10,
          precioVenta: 15,
          stockMinimo: 1,
          tipoProducto: 'GENERICO',
          unidad: 'UNIDAD',
          estado: 'ACTIVO',
          empresaId: 12, // ID de la empresa de prueba
          codigoBarras: 'DIAG-' + Date.now(),
          sku: 'DIAG-' + Date.now(),
        }
      });
      console.log(`✅ Producto de prueba creado: ${productoPrueba.nombre} (ID: ${productoPrueba.id})`);
      
      // Eliminar el producto de prueba
      await prisma.producto.delete({
        where: { id: productoPrueba.id }
      });
      console.log('✅ Producto de prueba eliminado');
      
    } catch (error) {
      console.log(`❌ Error en inserción de prueba: ${error.message}`);
      console.log(`   Detalles: ${JSON.stringify(error, null, 2)}`);
    }
    
    // 5. Verificar configuración de Prisma
    console.log('\n5️⃣ Verificando configuración de Prisma...');
    try {
      const config = await prisma.$queryRaw`SELECT current_database(), current_user, version()`;
      console.log('✅ Configuración de base de datos:');
      console.log(`   Base de datos: ${config[0].current_database}`);
      console.log(`   Usuario: ${config[0].current_user}`);
      console.log(`   Versión: ${config[0].version}`);
    } catch (error) {
      console.log(`❌ Error obteniendo configuración: ${error.message}`);
    }
    
    console.log('\n🎉 Diagnóstico completado');
    
  } catch (error) {
    console.error('\n❌ Error en diagnóstico:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar diagnóstico
diagnosticarBaseDatos(); 