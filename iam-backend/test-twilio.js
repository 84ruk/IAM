#!/usr/bin/env node

require('dotenv').config();
const { Twilio } = require('twilio');

async function testTwilio() {
  console.log('🔍 Probando configuración de Twilio...\n');
  
  // Verificar variables de entorno
  const apiKeySid = process.env.TWILIO_API_SID; // API Key SID (SK...) - opcional
  const apiSecret = process.env.TWILIO_SECRET;
  const realAccountSid = process.env.TWILIO_ACCOUNT_SID; // Account SID real (AC...)
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_FROM;
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
  
  console.log('📋 Variables de entorno:');
  console.log(`  TWILIO_API_SID (API Key): ${apiKeySid ? '✅ Configurado' : '❌ No configurado (opcional)'}`);
  console.log(`  TWILIO_SECRET: ${apiSecret ? '✅ Configurado' : '❌ No configurado'}`);
  console.log(`  TWILIO_ACCOUNT_SID: ${realAccountSid ? '✅ Configurado' : '❌ No configurado'}`);
  console.log(`  TWILIO_AUTH_TOKEN: ${authToken ? '✅ Configurado' : '❌ No configurado'}`);
  console.log(`  TWILIO_PHONE_NUMBER: ${from ? '✅ Configurado' : '❌ No configurado'}`);
  console.log(`  TWILIO_MESSAGING_SERVICE_SID: ${messagingServiceSid ? '✅ Configurado' : '❌ No configurado'}`);
  
  if (!realAccountSid) {
    console.log('\n❌ TWILIO_ACCOUNT_SID es requerido.');
    return;
  }
  
  if (!realAccountSid.startsWith('AC')) {
    console.log('\n❌ TWILIO_ACCOUNT_SID debe comenzar con "AC".');
    return;
  }
  
  if (!authToken && (!apiKeySid || !apiSecret)) {
    console.log('\n❌ Se requiere TWILIO_AUTH_TOKEN o TWILIO_API_SID + TWILIO_SECRET.');
    return;
  }
  
  try {
    console.log('\n🚀 Inicializando cliente de Twilio...');
    
    let client;
    if (apiSecret && apiKeySid && realAccountSid) {
      // Usar API Key (método recomendado)
      try {
        client = new Twilio(apiKeySid, apiSecret, { accountSid: realAccountSid });
        console.log('✅ Cliente de Twilio inicializado con API Key');
      } catch (error) {
        console.log(`❌ Error con API Key: ${error.message}`);
        console.log('🔄 Intentando con Auth Token...');
        if (authToken) {
          client = new Twilio(realAccountSid, authToken);
          console.log('✅ Cliente de Twilio inicializado con Auth Token (fallback)');
        } else {
          throw new Error('No se pudo inicializar con API Key ni Auth Token');
        }
      }
    } else if (authToken && realAccountSid) {
      // Usar Auth Token (método que funciona)
      client = new Twilio(realAccountSid, authToken);
      console.log('✅ Cliente de Twilio inicializado con Auth Token');
    } else {
      throw new Error('No se encontró configuración válida');
    }
    
    // Verificar cuenta
    console.log('\n📊 Verificando información de la cuenta...');
    const account = await client.api.accounts(realAccountSid).fetch();
    console.log(`  Nombre de cuenta: ${account.friendlyName}`);
    console.log(`  Estado: ${account.status}`);
    console.log(`  Tipo: ${account.type}`);
    
    // Verificar números disponibles
    console.log('\n📱 Verificando números disponibles...');
    const incomingPhoneNumbers = await client.incomingPhoneNumbers.list({ limit: 5 });
    
    if (incomingPhoneNumbers.length > 0) {
      console.log('  Números disponibles:');
      incomingPhoneNumbers.forEach((number, index) => {
        console.log(`    ${index + 1}. ${number.phoneNumber} (${number.friendlyName || 'Sin nombre'})`);
      });
    } else {
      console.log('  ⚠️ No se encontraron números de teléfono');
    }
    
    // Verificar servicios de mensajería
    if (messagingServiceSid) {
      console.log('\n💬 Verificando servicio de mensajería...');
      try {
        const messagingService = await client.messaging.v1.services(messagingServiceSid).fetch();
        console.log(`  Nombre: ${messagingService.friendlyName}`);
        console.log(`  Estado: ${messagingService.status}`);
        console.log(`  Número: ${messagingService.inboundRequestUrl || 'No configurado'}`);
      } catch (error) {
        console.log(`  ❌ Error al obtener servicio de mensajería: ${error.message}`);
      }
    }
    
    // Probar envío de SMS (solo si hay número configurado)
    if (from) {
      console.log('\n📤 Probando envío de SMS...');
      console.log(`  Número de origen: ${from}`);
      console.log('  ⚠️ Para probar envío real, descomenta las líneas de código en el script');
      
      // Descomenta estas líneas para probar envío real:
      /*
      try {
        const testMessage = await client.messages.create({
          body: 'Prueba de IAM Backend - ' + new Date().toISOString(),
          from: from,
          to: '+1234567890' // Cambia por tu número de prueba
        });
        console.log(`  ✅ SMS de prueba enviado. SID: ${testMessage.sid}`);
      } catch (error) {
        console.log(`  ❌ Error enviando SMS de prueba: ${error.message}`);
      }
      */
    }
    
    console.log('\n✅ Prueba de Twilio completada exitosamente!');
    
  } catch (error) {
    console.log('\n❌ Error al probar Twilio:');
    console.log(`  Código: ${error.code || 'N/A'}`);
    console.log(`  Mensaje: ${error.message}`);
    console.log(`  Más info: ${error.moreInfo || 'N/A'}`);
    
    if (error.code === 20003) {
      console.log('\n💡 Solución: Verifica que las credenciales sean correctas');
    } else if (error.code === 20008) {
      console.log('\n💡 Solución: Verifica que la cuenta esté activa');
    } else if (error.code === 20012) {
      console.log('\n💡 Solución: Verifica que el Account SID comience con "AC"');
    }
  }
}

// Ejecutar prueba
testTwilio().catch(console.error);
