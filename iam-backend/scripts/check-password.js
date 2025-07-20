const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function checkPassword() {
  console.log('🔍 Verificando contraseña del usuario prueba@iam.com...\n');

  try {
    const user = await prisma.usuario.findUnique({
      where: { email: 'prueba@iam.com' },
      select: { 
        id: true, 
        email: true, 
        password: true,
        nombre: true,
        activo: true
      }
    });

    if (!user) {
      console.log('❌ Usuario no encontrado');
      return;
    }

    console.log('✅ Usuario encontrado:');
    console.log(`- ID: ${user.id}`);
    console.log(`- Email: ${user.email}`);
    console.log(`- Nombre: ${user.nombre}`);
    console.log(`- Activo: ${user.activo}`);
    console.log(`- Password hash: ${user.password ? user.password.substring(0, 20) + '...' : 'NULL'}`);

    // Probar diferentes contraseñas
    const testPasswords = [
      'PruebaIAM123',
      'pruebaIAM123',
      'Prueba123',
      'prueba123',
      'password',
      '123456',
      'admin',
      'test'
    ];

    console.log('\n🔐 Probando contraseñas:');
    
    for (const password of testPasswords) {
      if (user.password) {
        const isValid = await bcrypt.compare(password, user.password);
        console.log(`- "${password}": ${isValid ? '✅ CORRECTA' : '❌'}`);
        
        if (isValid) {
          console.log(`\n🎉 ¡Contraseña encontrada: "${password}"`);
          break;
        }
      } else {
        console.log('❌ El usuario no tiene contraseña configurada');
        break;
      }
    }

    // Si ninguna funciona, crear una nueva contraseña
    console.log('\n🔄 Generando nueva contraseña...');
    const newPassword = 'PruebaIAM123';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await prisma.usuario.update({
      where: { email: 'prueba@iam.com' },
      data: { password: hashedPassword }
    });

    console.log(`✅ Nueva contraseña configurada: "${newPassword}"`);
    console.log('🔑 Ahora puedes usar:');
    console.log(`   Email: prueba@iam.com`);
    console.log(`   Password: ${newPassword}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  checkPassword();
}

module.exports = { checkPassword }; 