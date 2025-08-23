const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function corregirTelefonoMexico() {
  try {
    console.log('📱 Corrigiendo número de teléfono para México...');
    
    // Buscar el destinatario con el número 4441882114
    const destinatario = await prisma.destinatarioAlerta.findFirst({
      where: {
        telefono: '4441882114'
      }
    });
    
    if (!destinatario) {
      console.log('❌ No se encontró destinatario con teléfono 4441882114');
      return;
    }
    
    console.log('✅ Destinatario encontrado:');
    console.log('📧 Email:', destinatario.email);
    console.log('📱 Teléfono actual:', destinatario.telefono);
    
    // Actualizar el número agregando +52
    const resultado = await prisma.destinatarioAlerta.update({
      where: { id: destinatario.id },
      data: {
        telefono: '+524441882114'
      }
    });
    
    console.log('✅ Teléfono actualizado exitosamente');
    console.log('📱 Nuevo teléfono:', resultado.telefono);
    
    // Verificar que se guardó
    const destinatarioVerificado = await prisma.destinatarioAlerta.findFirst({
      where: {
        telefono: '+524441882114'
      }
    });
    
    if (destinatarioVerificado) {
      console.log('🔍 Verificación exitosa:');
      console.log('📧 Email:', destinatarioVerificado.email);
      console.log('📱 Teléfono:', destinatarioVerificado.telefono);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

corregirTelefonoMexico();
