const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugSMS() {
  try {
    console.log('🔍 Debug detallado del problema SMS...');
    
    // 1. Verificar configuración completa de Twilio
    console.log('\n🔧 Configuración de Twilio:');
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_FROM_NUMBER || process.env.TWILIO_PHONE_NUMBER;
    
    console.log(`   - Account SID: ${accountSid ? '✅' : '❌'}`);
    console.log(`   - Auth Token: ${authToken ? '✅' : '❌'}`);
    console.log(`   - From Number: ${fromNumber}`);
    
    if (!accountSid || !authToken || !fromNumber) {
      console.log('❌ Configuración incompleta');
      return;
    }
    
    // 2. Verificar cuenta de Twilio
    console.log('\n📊 Verificando cuenta de Twilio...');
    
    try {
      const twilio = require('twilio');
      const client = twilio(accountSid, authToken);
      
      // Obtener información de la cuenta
      const account = await client.api.accounts(accountSid).fetch();
      console.log(`   - Account Status: ${account.status}`);
      console.log(`   - Account Type: ${account.type}`);
      console.log(`   - Trial: ${account.status === 'trial' ? 'SÍ' : 'NO'}`);
      
      // Verificar números activos
      const phoneNumbers = await client.incomingPhoneNumbers.list();
      console.log(`   - Números activos: ${phoneNumbers.length}`);
      
      if (phoneNumbers.length > 0) {
        phoneNumbers.forEach((num, index) => {
          console.log(`     ${index + 1}. ${num.phoneNumber} (${num.status})`);
        });
      }
      
      // 3. Probar diferentes formatos de número
      console.log('\n📞 Probando diferentes formatos de número...');
      
      const formatos = [
        '+524441882114',    // Formato compacto
        '+52 444 188 2114', // Con espacios
        '+52-444-188-2114', // Con guiones
        '524441882114',     // Sin +
        '4441882114'        // Solo número local
      ];
      
      for (const formato of formatos) {
        console.log(`\n🔄 Probando formato: ${formato}`);
        
        try {
          const result = await client.messages.create({
            body: `🧪 PRUEBA - Formato: ${formato}`,
            from: fromNumber,
            to: formato
          });
          
          console.log(`   ✅ Enviado: ${result.sid}`);
          console.log(`   📊 Status: ${result.status}`);
          
          // Esperar y verificar estado
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          const message = await client.messages(result.sid).fetch();
          console.log(`   🔍 Estado final: ${message.status}`);
          
          if (message.errorCode) {
            console.log(`   ❌ Error: ${message.errorCode} - ${message.errorMessage || 'N/A'}`);
          }
          
          // Limpiar mensaje de prueba
          if (message.status === 'failed') {
            console.log(`   🗑️ Mensaje de prueba eliminado`);
          }
          
        } catch (error) {
          console.log(`   ❌ Error: ${error.message}`);
          if (error.code) {
            console.log(`   🔍 Código: ${error.code}`);
          }
        }
      }
      
      // 4. Verificar restricciones de la cuenta
      console.log('\n🔒 Verificando restricciones de cuenta...');
      
      if (account.status === 'trial') {
        console.log('⚠️ CUENTA EN MODO PRUEBA - Restricciones aplican:');
        console.log('   - Solo puedes enviar SMS a números verificados');
        console.log('   - Límite de mensajes por día');
        console.log('   - Números de origen limitados');
        
        console.log('\n💡 SOLUCIONES:');
        console.log('   1. Verificar que +52 444 188 2114 esté en "Verified Caller IDs"');
        console.log('   2. Actualizar a cuenta de pago');
        console.log('   3. Usar números de prueba verificados');
      }
      
      // 5. Verificar logs de mensajes recientes
      console.log('\n📋 Logs de mensajes recientes:');
      const recentMessages = await client.messages.list({limit: 5});
      
      recentMessages.forEach((msg, index) => {
        console.log(`\n   ${index + 1}. ${msg.sid}`);
        console.log(`      To: ${msg.to}`);
        console.log(`      From: ${msg.from}`);
        console.log(`      Status: ${msg.status}`);
        console.log(`      Error: ${msg.errorCode || 'N/A'}`);
        console.log(`      Fecha: ${msg.dateCreated}`);
      });
      
    } catch (twilioError) {
      console.log('❌ Error con Twilio:');
      console.log(`   - Mensaje: ${twilioError.message}`);
      console.log(`   - Código: ${twilioError.code || 'N/A'}`);
      console.log(`   - Status: ${twilioError.status || 'N/A'}`);
    }
    
  } catch (error) {
    console.error('❌ Error en debug:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugSMS();
