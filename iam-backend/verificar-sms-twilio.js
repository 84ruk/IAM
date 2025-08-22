const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verificarSMS() {
  try {
    console.log('🔍 Verificando estado del SMS enviado...');
    
    // 1. Verificar configuración de Twilio
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    
    if (!accountSid || !authToken) {
      console.log('❌ Configuración de Twilio incompleta');
      return;
    }
    
    // 2. Obtener el último registro SMS
    const ultimoSMS = await prisma.registroEnvioSMS.findFirst({
      orderBy: { id: 'desc' }
    });
    
    if (!ultimoSMS) {
      console.log('❌ No hay registros de SMS');
      return;
    }
    
    console.log(`📱 Último SMS enviado:`);
    console.log(`   - ID: ${ultimoSMS.id}`);
    console.log(`   - Message ID: ${ultimoSMS.mensajeId}`);
    console.log(`   - Destinatario: ${ultimoSMS.destinatario}`);
    console.log(`   - Estado: ${ultimoSMS.estado}`);
    
    // 3. Verificar estado en Twilio
    console.log('\n🔍 Verificando estado en Twilio...');
    
    try {
      const twilio = require('twilio');
      const client = twilio(accountSid, authToken);
      
      const message = await client.messages(ultimoSMS.mensajeId).fetch();
      
      console.log('✅ Estado del SMS en Twilio:');
      console.log(`   - SID: ${message.sid}`);
      console.log(`   - Status: ${message.status}`);
      console.log(`   - From: ${message.from}`);
      console.log(`   - To: ${message.to}`);
      console.log(`   - Body: ${message.body.substring(0, 100)}...`);
      console.log(`   - Date Created: ${message.dateCreated}`);
      console.log(`   - Date Sent: ${message.dateSent || 'No enviado'}`);
      console.log(`   - Error Code: ${message.errorCode || 'N/A'}`);
      console.log(`   - Error Message: ${message.errorMessage || 'N/A'}`);
      
      // 4. Actualizar estado en la base de datos
      await prisma.registroEnvioSMS.update({
        where: { id: ultimoSMS.id },
        data: { 
          estado: message.status,
          codigoError: message.errorCode || null
        }
      });
      
      console.log(`\n💾 Estado actualizado en BD: ${message.status}`);
      
      // 5. Analizar posibles problemas
      if (message.status === 'delivered') {
        console.log('🎉 SMS entregado exitosamente!');
      } else if (message.status === 'failed') {
        console.log('❌ SMS falló al enviar');
        console.log(`   - Error: ${message.errorMessage}`);
        console.log(`   - Código: ${message.errorCode}`);
      } else if (message.status === 'queued') {
        console.log('⏳ SMS en cola de envío');
      } else if (message.status === 'sending') {
        console.log('📤 SMS enviándose...');
      } else {
        console.log(`ℹ️ Estado del SMS: ${message.status}`);
      }
      
    } catch (twilioError) {
      console.log('❌ Error verificando SMS en Twilio:');
      console.log(`   - Error: ${twilioError.message}`);
      console.log(`   - Código: ${twilioError.code}`);
    }
    
  } catch (error) {
    console.error('❌ Error verificando SMS:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verificarSMS();
