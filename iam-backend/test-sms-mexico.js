const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testSMSMexico() {
  try {
    console.log('📱 Probando envío de SMS a número mexicano con formato correcto...');
    
    // 1. Verificar configuración de Twilio
    console.log('\n🔧 Verificando configuración de Twilio...');
    
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_FROM_NUMBER || process.env.TWILIO_PHONE_NUMBER;
    
    if (!accountSid || !authToken || !fromNumber) {
      console.log('❌ Configuración de Twilio incompleta');
      return;
    }
    
    console.log('✅ Configuración de Twilio encontrada');
    console.log(`   - From Number: ${fromNumber}`);
    
    // 2. Formatear número mexicano correctamente
    const numeroMexico = '4441882114';
    const numeroFormateado = `+52${numeroMexico}`;
    
    console.log('\n📞 Formato del número:');
    console.log(`   - Original: ${numeroMexico}`);
    console.log(`   - Formateado: ${numeroFormateado}`);
    console.log(`   - País: México (+52)`);
    
    // 3. Crear mensaje de prueba
    const mensajePrueba = `🚨 PRUEBA SMS - Sistema IAM Inventario\n\n` +
      `Este es un SMS de prueba para verificar que el sistema de notificaciones SMS funciona correctamente.\n\n` +
      `📊 Estado: Sistema operativo\n` +
      `⏰ Fecha: ${new Date().toLocaleString('es-MX')}\n` +
      `🔧 Tipo: Prueba de conectividad\n\n` +
      `Si recibes este mensaje, el sistema SMS está funcionando correctamente.`;
    
    console.log('\n📝 Mensaje a enviar:');
    console.log(mensajePrueba);
    
    // 4. Enviar SMS
    console.log('\n📤 Enviando SMS...');
    
    try {
      const twilio = require('twilio');
      const client = twilio(accountSid, authToken);
      
      const result = await client.messages.create({
        body: mensajePrueba,
        from: fromNumber,
        to: numeroFormateado
      });
      
      console.log('✅ SMS enviado exitosamente!');
      console.log(`   - Message ID: ${result.sid}`);
      console.log(`   - Status: ${result.status}`);
      console.log(`   - Destinatario: ${numeroFormateado}`);
      
      // 5. Registrar en la base de datos
      console.log('\n💾 Registrando envío en la base de datos...');
      
      const registroSMS = await prisma.registroEnvioSMS.create({
        data: {
          mensajeId: result.sid,
          destinatario: numeroMexico,
          estado: result.status,
          alertaId: null
        }
      });
      
      console.log(`✅ Registro SMS creado: ${registroSMS.id}`);
      
      // 6. Verificar estado después de unos segundos
      console.log('\n⏳ Esperando 5 segundos para verificar estado...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const message = await client.messages(result.sid).fetch();
      
      console.log('\n📊 Estado final del SMS:');
      console.log(`   - Status: ${message.status}`);
      console.log(`   - Error Code: ${message.errorCode || 'N/A'}`);
      console.log(`   - Error Message: ${message.errorMessage || 'N/A'}`);
      
      // 7. Actualizar estado en BD
      await prisma.registroEnvioSMS.update({
        where: { id: registroSMS.id },
        data: { 
          estado: message.status,
          codigoError: message.errorCode ? message.errorCode.toString() : null
        }
      });
      
      // 8. Análisis del resultado
      if (message.status === 'delivered') {
        console.log('\n🎉 ¡SMS entregado exitosamente!');
        console.log('   El número está recibiendo mensajes correctamente.');
      } else if (message.status === 'failed') {
        console.log('\n❌ SMS falló al enviar');
        console.log(`   - Código de error: ${message.errorCode}`);
        
        if (message.errorCode === '30044') {
          console.log('\n🔍 PROBLEMA IDENTIFICADO: Número no verificado');
          console.log('   En cuentas de prueba de Twilio, solo puedes enviar SMS a números verificados.');
          console.log('\n💡 SOLUCIONES:');
          console.log('   1. Verificar el número en tu cuenta de Twilio');
          console.log('   2. Actualizar a cuenta de pago (permite enviar a cualquier número)');
          console.log('   3. Usar números de prueba verificados');
        } else if (message.errorCode === '21211') {
          console.log('\n🔍 PROBLEMA IDENTIFICADO: Número inválido');
          console.log('   El formato del número no es correcto.');
        } else if (message.errorCode === '21608') {
          console.log('\n🔍 PROBLEMA IDENTIFICADO: Saldo insuficiente');
          console.log('   La cuenta de Twilio no tiene saldo para enviar SMS.');
        }
        
        console.log('\n📋 Para verificar números en Twilio:');
        console.log('   1. Ve a https://console.twilio.com/');
        console.log('   2. Navega a Phone Numbers > Manage > Verified Caller IDs');
        console.log('   3. Agrega +52 444 188 2114 como número verificado');
        
      } else if (message.status === 'queued') {
        console.log('\n⏳ SMS en cola de envío');
        console.log('   El mensaje está esperando ser procesado por Twilio.');
      } else if (message.status === 'sending') {
        console.log('\n📤 SMS enviándose...');
        console.log('   El mensaje está siendo procesado por Twilio.');
      }
      
    } catch (twilioError) {
      console.log('❌ Error enviando SMS:');
      console.log(`   - Error: ${twilioError.message}`);
      console.log(`   - Código: ${twilioError.code}`);
      
      if (twilioError.code === '30044') {
        console.log('\n🔍 SOLUCIÓN INMEDIATA:');
        console.log('   Este número necesita ser verificado en tu cuenta de Twilio.');
        console.log('   Ve a: https://console.twilio.com/ > Phone Numbers > Verified Caller IDs');
        console.log('   Agrega: +52 444 188 2114');
      }
    }
    
  } catch (error) {
    console.error('❌ Error en la prueba de SMS:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Verificar dependencias
try {
  require('twilio');
  testSMSMexico();
} catch (error) {
  console.log('❌ Dependencia Twilio no encontrada');
  console.log('💡 Instala Twilio con: npm install twilio');
}
