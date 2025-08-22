const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testSMSReal() {
  try {
    console.log('📱 Probando envío REAL de SMS al número 4441882114...');
    
    // 1. Verificar configuración de Twilio
    console.log('\n🔧 Verificando configuración de Twilio...');
    
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_FROM_NUMBER || process.env.TWILIO_PHONE_NUMBER;
    
    if (!accountSid || !authToken || !fromNumber) {
      console.log('❌ Configuración de Twilio incompleta:');
      console.log(`   - TWILIO_ACCOUNT_SID: ${accountSid ? '✅' : '❌'}`);
      console.log(`   - TWILIO_AUTH_TOKEN: ${authToken ? '✅' : '❌'}`);
      console.log(`   - TWILIO_FROM_NUMBER: ${fromNumber ? '✅' : '❌'}`);
      console.log('\n💡 Asegúrate de que las variables de entorno estén configuradas en tu archivo .env');
      return;
    }
    
    console.log('✅ Configuración de Twilio encontrada');
    console.log(`   - From Number: ${fromNumber}`);
    
    // 2. Crear mensaje de prueba
    const mensajePrueba = `🚨 PRUEBA SMS - Sistema IAM Inventario\n\n` +
      `Este es un SMS de prueba para verificar que el sistema de notificaciones SMS funciona correctamente.\n\n` +
      `📊 Estado: Sistema operativo\n` +
      `⏰ Fecha: ${new Date().toLocaleString('es-MX')}\n` +
      `🔧 Tipo: Prueba de conectividad\n\n` +
      `Si recibes este mensaje, el sistema SMS está funcionando correctamente.`;
    
    console.log('\n📝 Mensaje a enviar:');
    console.log(mensajePrueba);
    
    // 3. Enviar SMS usando Twilio directamente
    console.log('\n📤 Enviando SMS...');
    
    try {
      // Usar la API de Twilio directamente para esta prueba
      const twilio = require('twilio');
      const client = twilio(accountSid, authToken);
      
      const result = await client.messages.create({
        body: mensajePrueba,
        from: fromNumber,
        to: '+524441882114' // Formato mexicano completo
      });
      
      console.log('✅ SMS enviado exitosamente!');
      console.log(`   - Message ID: ${result.sid}`);
      console.log(`   - Status: ${result.status}`);
      console.log(`   - Destinatario: +52 444 188 2114`);
      
      // 4. Registrar el envío en la base de datos
      console.log('\n💾 Registrando envío en la base de datos...');
      
      const registroSMS = await prisma.registroEnvioSMS.create({
        data: {
          mensajeId: result.sid,
          destinatario: '4441882114',
          estado: 'ENVIADO',
          alertaId: null
        }
      });
      
      console.log(`✅ Registro SMS creado: ${registroSMS.id}`);
      
      // 5. Verificar estado final
      console.log('\n📊 Estado final:');
      console.log(`   - ✅ SMS enviado: SÍ`);
      console.log(`   - ✅ Message ID: ${result.sid}`);
      console.log(`   - ✅ Registro en BD: ${registroSMS.id}`);
      console.log(`   - ✅ Destinatario: +52 444 188 2114`);
      
      console.log('\n🎯 PRUEBA SMS COMPLETADA EXITOSAMENTE!');
      console.log(`   Deberías recibir el SMS en el número 4441882114 en los próximos minutos.`);
      console.log(`   Si no lo recibes, verifica:`);
      console.log(`   1. Que el número esté correcto`);
      console.log(`   2. Que Twilio tenga saldo disponible`);
      console.log(`   3. Los logs de Twilio para posibles errores`);
      
    } catch (twilioError) {
      console.log('❌ Error enviando SMS con Twilio:');
      console.log(`   - Error: ${twilioError.message}`);
      
      if (twilioError.code === 21211) {
        console.log('   - Causa: Número de teléfono inválido');
      } else if (twilioError.code === 21608) {
        console.log('   - Causa: Saldo insuficiente en cuenta de Twilio');
      } else if (twilioError.code === 21610) {
        console.log('   - Causa: Número no verificado (cuenta de prueba)');
      }
      
      console.log('\n🔍 Posibles causas:');
      console.log(`   1. Saldo insuficiente en cuenta de Twilio`);
      console.log(`   2. Número de teléfono inválido`);
      console.log(`   3. Restricciones de la cuenta de Twilio`);
      console.log(`   4. Problemas de conectividad`);
      console.log(`   5. Cuenta de Twilio en modo de prueba (números no verificados)`);
    }
    
  } catch (error) {
    console.error('❌ Error en la prueba de SMS:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Verificar si las dependencias están disponibles
try {
  require('twilio');
  testSMSReal();
} catch (error) {
  console.log('❌ Dependencia Twilio no encontrada');
  console.log('💡 Instala Twilio con: npm install twilio');
  console.log('   O verifica que esté en tu package.json');
}
