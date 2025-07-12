const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createSuperAdmin() {
  try {
    // Verificar si ya existe un super admin
    const existingSuperAdmin = await prisma.usuario.findFirst({
      where: {
        rol: 'SUPERADMIN'
      }
    });

    if (existingSuperAdmin) {
      console.log('Ya existe un super admin en el sistema');
      console.log('Email:', existingSuperAdmin.email);
      return;
    }

    // Crear el super admin
    const hashedPassword = await bcrypt.hash('SuperAdmin123!', 10);
    
    const superAdmin = await prisma.usuario.create({
      data: {
        nombre: 'Super Administrador',
        email: 'superadmin@iam.com',
        password: hashedPassword,
        rol: 'SUPERADMIN',
        activo: true,
        setupCompletado: true
      }
    });

    console.log('✅ Super Admin creado exitosamente');
    console.log('Email:', superAdmin.email);
    console.log('Contraseña: SuperAdmin123!');
    console.log('⚠️  IMPORTANTE: Cambia la contraseña después del primer login');

  } catch (error) {
    console.error('Error creando super admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSuperAdmin(); 