const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    console.log('👤 Creando usuario de prueba...');
    
    // Verificar si ya existe
    const existingUser = await prisma.usuario.findUnique({
      where: { email: 'test@iam.com' }
    });
    
    if (existingUser) {
      console.log('✅ Usuario de prueba ya existe');
      console.log(`Email: ${existingUser.email}`);
      console.log(`Nombre: ${existingUser.nombre}`);
      console.log(`Rol: ${existingUser.rol}`);
      return;
    }
    
    // Crear empresa de prueba si no existe
    let empresa = await prisma.empresa.findFirst({
      where: { nombre: 'Empresa de Prueba' }
    });
    
    if (!empresa) {
      empresa = await prisma.empresa.create({
        data: {
          nombre: 'Empresa de Prueba',
          emailContacto: 'test@empresa.com',
          direccion: 'Dirección de prueba'
        }
      });
      console.log('🏢 Empresa de prueba creada');
    }
    
    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash('test123', 10);
    
    // Crear usuario
    const user = await prisma.usuario.create({
      data: {
        email: 'test@iam.com',
        nombre: 'Usuario de Prueba',
        password: hashedPassword,
        rol: 'ADMIN',
        empresaId: empresa.id,
        activo: true,
        setupCompletado: true
      }
    });
    
    console.log('✅ Usuario de prueba creado exitosamente!');
    console.log(`Email: ${user.email}`);
    console.log(`Contraseña: test123`);
    console.log(`Nombre: ${user.nombre}`);
    console.log(`Rol: ${user.rol}`);
    console.log(`Empresa: ${empresa.nombre}`);
    
  } catch (error) {
    console.error('❌ Error creando usuario de prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  createTestUser().catch(console.error);
}

module.exports = { createTestUser }; 